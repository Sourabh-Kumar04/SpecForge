import os
import re
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from backend.config import settings
from backend.models.schemas import SettingsResponse, SettingsUpdateRequest
from backend.services.llm_client import llm_client
from backend.services.tavily_researcher import tavily_researcher

logger = logging.getLogger("specforge.routes.settings")
router = APIRouter()

def _mask_api_key(key: Optional[str]) -> str:
    """Masks secret key for safe display in UI. Never reveals plaintext."""
    if not key or key.startswith("your-") or len(key.strip()) < 8:
        return "NOT SET"
    if len(key) <= 12:
        return "••••••••"
    return f"{key[:4]}••••••••{key[-4:]}"

def _update_env_file(updates: dict):
    """
    Safely updates or appends environment variables in the local .env file.
    Does NOT log sensitive values.
    """
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    existing_lines = []
    if env_path.exists():
        try:
            existing_lines = env_path.read_text(encoding="utf-8").splitlines()
        except Exception as e:
            logger.warning(f"Failed to read existing .env: {e}")

    updated_keys = set()
    new_lines = []

    for line in existing_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            new_lines.append(line)
            continue

        key, _ = stripped.split("=", 1)
        key = key.strip()
        if key in updates:
            new_val = str(updates[key])
            new_lines.append(f"{key}={new_val}")
            updated_keys.add(key)
        else:
            new_lines.append(line)

    for k, v in updates.items():
        if k not in updated_keys:
            new_lines.append(f"{k}={v}")

    try:
        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        logger.info("Successfully updated persistent .env configuration for: %s", list(updates.keys()))
    except Exception as e:
        logger.error(f"Failed to write to .env file: {e}")

def _build_settings_response() -> SettingsResponse:
    nebius_set = not settings.effective_mock_llm
    tavily_set = not settings.effective_mock_tavily
    return SettingsResponse(
        nebius_api_key_set=nebius_set,
        nebius_api_key_masked=_mask_api_key(settings.nebius_api_key),
        nebius_base_url=settings.nebius_base_url,
        nebius_model_fast=settings.nebius_model_fast,
        nebius_model_reasoning=settings.nebius_model_reasoning,
        tavily_api_key_set=tavily_set,
        tavily_api_key_masked=_mask_api_key(settings.tavily_api_key),
        spend_cap_usd=settings.nebius_spend_cap_usd,
        mock_mode=settings.effective_mock_llm,
        tavily_enabled=not settings.effective_mock_tavily,
    )

@router.get("", response_model=SettingsResponse)
def get_settings():
    """Returns current active system configuration with sensitive keys securely masked."""
    return _build_settings_response()

@router.post("", response_model=SettingsResponse)
def update_settings(req: SettingsUpdateRequest):
    """
    Updates BYOK API credentials and spend controls.
    Persists updates to local .env and reloads active clients in-memory.
    Credentials are NEVER logged or echoed in plaintext.
    """
    env_updates = {}

    if req.nebius_api_key is not None:
        cleaned_key = req.nebius_api_key.strip()
        if cleaned_key:
            settings.nebius_api_key = cleaned_key
            settings.mock_llm = False
            env_updates["NEBIUS_API_KEY"] = cleaned_key
            env_updates["MOCK_LLM"] = "false"

    if req.tavily_api_key is not None:
        cleaned_tavily = req.tavily_api_key.strip()
        if cleaned_tavily:
            settings.tavily_api_key = cleaned_tavily
            env_updates["TAVILY_API_KEY"] = cleaned_tavily

    if req.spend_cap_usd is not None and req.spend_cap_usd > 0:
        settings.nebius_spend_cap_usd = float(req.spend_cap_usd)
        env_updates["NEBIUS_SPEND_CAP_USD"] = str(req.spend_cap_usd)

    if req.nebius_model_fast is not None and req.nebius_model_fast.strip():
        settings.nebius_model_fast = req.nebius_model_fast.strip()
        env_updates["NEBIUS_MODEL_FAST"] = settings.nebius_model_fast

    if req.nebius_model_reasoning is not None and req.nebius_model_reasoning.strip():
        settings.nebius_model_reasoning = req.nebius_model_reasoning.strip()
        env_updates["NEBIUS_MODEL_REASONING"] = settings.nebius_model_reasoning

    if env_updates:
        _update_env_file(env_updates)

    # Hot-reload in-memory clients
    llm_client.reload_settings()
    tavily_researcher.reload_settings()

    logger.info("Updated BYOK settings (spend_cap=$%.2f, mock_mode=%s)", settings.nebius_spend_cap_usd, settings.effective_mock_llm)
    return _build_settings_response()

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import settings

client = TestClient(app)

def test_get_settings_masks_credentials():
    """Validates that GET /api/settings returns masked credentials and never raw secrets."""
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()

    assert "nebius_api_key_set" in data
    assert "nebius_api_key_masked" in data
    assert "tavily_api_key_set" in data
    assert "tavily_api_key_masked" in data
    assert "spend_cap_usd" in data
    assert "mock_mode" in data
    assert "nebius_model_fast" in data
    assert "nebius_model_reasoning" in data

    # Verify secret is never raw in masked fields
    if settings.nebius_api_key:
        assert data["nebius_api_key_masked"] != settings.nebius_api_key
        assert "••••••••" in data["nebius_api_key_masked"] or data["nebius_api_key_masked"] == "NOT SET"

def test_update_settings_persists_and_reloads(tmp_path, monkeypatch):
    """
    Validates that POST /api/settings:
    1. Updates configuration
    2. Never returns raw secret keys
    3. Hot-reloads in-memory clients
    """
    # Point .env updates to a temporary test directory
    fake_env = tmp_path / ".env"
    fake_env.write_text("NEBIUS_SPEND_CAP_USD=2.00\n", encoding="utf-8")

    from backend.routes import settings as settings_route
    monkeypatch.setattr(settings_route, "_update_env_file", lambda updates: [
        fake_env.write_text("\n".join(f"{k}={v}" for k, v in updates.items()), encoding="utf-8")
    ])

    payload = {
        "nebius_api_key": "nist-secret-test-token-12345678",
        "tavily_api_key": "tvly-secret-test-token-87654321",
        "spend_cap_usd": 3.50,
        "nebius_model_fast": "nvidia/nemotron-3-super-120b-a12b",
    }

    response = client.post("/api/settings", json=payload)
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["spend_cap_usd"] == 3.50
    assert res_data["nebius_api_key_set"] is True
    assert res_data["tavily_api_key_set"] is True
    assert "nist-secret-test-token" not in res_data["nebius_api_key_masked"]
    assert "••••••••" in res_data["nebius_api_key_masked"]
    assert "tvly-secret-test-token" not in res_data["tavily_api_key_masked"]
    assert "••••••••" in res_data["tavily_api_key_masked"]

    # Verify settings updated in memory
    assert settings.nebius_spend_cap_usd == 3.50
    assert settings.nebius_api_key == "nist-secret-test-token-12345678"
    assert settings.tavily_api_key == "tvly-secret-test-token-87654321"

    # Reset back to mock/safe defaults
    settings.nebius_api_key = None
    settings.tavily_api_key = None
    settings.nebius_spend_cap_usd = 2.00
    settings.mock_llm = True

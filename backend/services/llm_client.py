import os
import json
import re
import logging
from typing import Optional, Dict, Any, Tuple
from openai import OpenAI
from backend.config import settings

logger = logging.getLogger("specforge.llm")

def extract_json_from_text(text: str) -> Any:
    """Robustly extract and parse JSON object or array from LLM text."""
    if not text:
        raise ValueError("Cannot extract JSON from empty text")
    
    clean_text = text.strip()
    # Check for markdown code fences
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    matches = re.findall(fence_pattern, clean_text, re.DOTALL)
    if matches:
        for match in reversed(matches):
            try:
                return json.loads(match.strip())
            except json.JSONDecodeError:
                continue

    # Try raw string
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        pass

    # Find outermost { ... }
    first_brace = clean_text.find("{")
    last_brace = clean_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        snippet = clean_text[first_brace:last_brace + 1]
        try:
            return json.loads(snippet)
        except json.JSONDecodeError:
            pass

    # Find outermost [ ... ]
    first_bracket = clean_text.find("[")
    last_bracket = clean_text.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        snippet = clean_text[first_bracket:last_bracket + 1]
        try:
            return json.loads(snippet)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse valid JSON from text: {text[:200]}...")


class LLMClient:
    """
    Client for Nebius Token Factory / Nebius AI Cloud targeting NVIDIA Nemotron models.
    Supports both real API calls and mock mode.
    Handles Nemotron-specific gotchas:
    1. Reads reasoning_content with fallback to content when content is empty.
    2. Prompt-based JSON structuring without OpenAI tool-calling.
    3. Configurable exact model IDs from env.
    """

    def __init__(self):
        self.is_mock = settings.effective_mock_llm
        self.fast_model = settings.nebius_model_fast
        self.reasoning_model = settings.nebius_model_reasoning
        self.client: Optional[OpenAI] = None

        if not self.is_mock and settings.nebius_api_key:
            self.client = OpenAI(
                base_url=settings.nebius_base_url,
                api_key=settings.nebius_api_key,
            )
            logger.info("Initialized Nebius Token Factory client targeting NVIDIA Nemotron models")
        else:
            logger.info("Operating in MOCK_LLM mode (all generation verified locally)")

    def _get_model_id(self, tier: str = "reasoning") -> str:
        if tier == "fast":
            return self.fast_model
        return self.reasoning_model

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        tier: str = "reasoning",
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> Tuple[str, Optional[str]]:
        """
        Executes a completion request.
        Returns tuple: (final_content, reasoning_content)
        Handles the Nemotron gotcha where content may be empty and reasoning_content contains the answer.
        """
        if self.is_mock:
            return self._mock_completion(system_prompt, user_prompt, tier)

        model_id = self._get_model_id(tier)
        try:
            response = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            message = response.choices[0].message
            content = getattr(message, "content", None) or ""
            reasoning_content = getattr(message, "reasoning_content", None)

            # Gotcha handling:
            # If content is empty or only whitespace, fall back to reasoning_content
            final_text = content.strip()
            if not final_text and reasoning_content:
                logger.info("Nemotron returned empty content; falling back to reasoning_content")
                final_text = reasoning_content.strip()

            return final_text, reasoning_content

        except Exception as e:
            logger.error(f"Error calling Nebius API ({model_id}): {e}. Falling back to mock generator.")
            return self._mock_completion(system_prompt, user_prompt, tier)

    def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        tier: str = "reasoning",
    ) -> Tuple[Any, Optional[str]]:
        """
        Forces JSON output format in prompt and parses response.
        Returns tuple: (parsed_json, reasoning_content)
        """
        system_prompt_with_json = (
            f"{system_prompt}\n\n"
            "CRITICAL REQUIREMENT: Output MUST be strictly valid JSON without explanation, "
            "wrapped in ```json ... ``` code fence or as a raw JSON string."
        )
        content, reasoning = self.complete(system_prompt_with_json, user_prompt, tier=tier)
        parsed = extract_json_from_text(content)
        return parsed, reasoning

    def _mock_completion(self, system_prompt: str, user_prompt: str, tier: str) -> Tuple[str, Optional[str]]:
        """Mock generator that produces context-aware responses matching schema expectations."""
        prompt_lower = (system_prompt + " " + user_prompt).lower()

        # 1. PLANNER request
        if "plan" in prompt_lower or "architect" in prompt_lower:
            mock_plan = {
                "title": "SpecForge Verified Microservice",
                "architecture_summary": "Modular, test-driven application architecture optimized for high reliability and clean separation of concerns.",
                "tech_stack": ["Python 3.12", "FastAPI", "Pydantic v2", "Pytest", "Uvicorn"],
                "files": [
                    {"path": "app/core/config.py", "purpose": "App settings & environment validation", "is_test": False},
                    {"path": "app/services/calculator.py", "purpose": "Core business domain logic", "is_test": False},
                    {"path": "app/api/endpoints.py", "purpose": "REST API routes and request validators", "is_test": False},
                    {"path": "app/main.py", "purpose": "FastAPI application factory and middleware", "is_test": False},
                    {"path": "tests/test_calculator.py", "purpose": "Unit tests for core logic", "is_test": True},
                    {"path": "tests/test_api.py", "purpose": "Integration tests for HTTP endpoints", "is_test": True},
                    {"path": "pyproject.toml", "purpose": "Project configuration and dependencies", "is_test": False}
                ],
                "test_strategy": "100% unit test coverage on core math/business logic plus API endpoint HTTP status verification using FastAPI TestClient.",
                "research_queries": [
                    "FastAPI 0.110 best practices router dependency injection",
                    "Pydantic v2 BaseSettings configuration patterns",
                    "Pytest fixtures for ASGI test client"
                ]
            }
            reasoning = "Analyzing spec requirements. Decomposing into modular components: config, business service, API routes, and test suite. Planning pytest test strategy."
            return json.dumps(mock_plan, indent=2), reasoning

        # 2. FIXER request
        if "fix" in prompt_lower or "repair" in prompt_lower or "traceback" in prompt_lower:
            mock_fix = {
                "diagnosis": "Identified edge case in division or boundary validation causing assertion failure.",
                "changes": [
                    {
                        "path": "app/services/calculator.py",
                        "explanation": "Added zero-division guard and refined return type annotations",
                        "content": '''"""Calculator business logic service."""
from typing import Union, List

class CalculatorService:
    @staticmethod
    def add(a: float, b: float) -> float:
        return a + b

    @staticmethod
    def subtract(a: float, b: float) -> float:
        return a - b

    @staticmethod
    def multiply(a: float, b: float) -> float:
        return a * b

    @staticmethod
    def divide(a: float, b: float) -> float:
        if b == 0:
            raise ValueError("Division by zero is not permitted")
        return a / b

    @staticmethod
    def calculate_stats(numbers: List[float]) -> dict:
        if not numbers:
            return {"count": 0, "sum": 0.0, "mean": 0.0}
        total = sum(numbers)
        return {
            "count": len(numbers),
            "sum": total,
            "mean": total / len(numbers)
        }
'''
                    }
                ]
            }
            reasoning = "Examined failing test traceback. Root cause was unhandled zero division in calculator service. Patched divide method with explicit ValueError check."
            return json.dumps(mock_fix, indent=2), reasoning

        # 3. Default JSON / fallback
        default_json = {
            "status": "success",
            "message": "Generated via SpecForge Nemotron fallback pipeline"
        }
        return json.dumps(default_json), "Mock reasoning step complete."


llm_client = LLMClient()

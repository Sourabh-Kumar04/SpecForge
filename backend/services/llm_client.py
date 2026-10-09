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

    def _repair_triple_quotes(s: str) -> str:
        pattern = r'(\"(?:content|code|body|source)\"\s*:\s*)\"\"\"([\s\S]*?)\"\"\"(?=\s*[\r\n]*\s*[},\]])'
        def repl(m):
            prefix = m.group(1)
            inner = m.group(2)
            try:
                unescaped = inner.encode('utf-8').decode('unicode_escape')
            except Exception:
                unescaped = inner
            return prefix + json.dumps(unescaped)
        return re.sub(pattern, repl, s)

    def _parse(s: str) -> Any:
        try:
            return json.loads(s)
        except (json.JSONDecodeError, TypeError):
            pass

        try:
            return json.loads(s, strict=False)
        except (json.JSONDecodeError, TypeError):
            pass

        try:
            repaired = _repair_triple_quotes(s)
            return json.loads(repaired, strict=False)
        except Exception:
            return None

    # Check for markdown code fences
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    matches = re.findall(fence_pattern, clean_text, re.DOTALL)
    if matches:
        for match in reversed(matches):
            res = _parse(match.strip())
            if res is not None:
                return res

    # Try raw string
    res = _parse(clean_text)
    if res is not None:
        return res

    # Find outermost { ... }
    first_brace = clean_text.find("{")
    last_brace = clean_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        snippet = clean_text[first_brace:last_brace + 1]
        res = _parse(snippet)
        if res is not None:
            return res

    # Find outermost [ ... ]
    first_bracket = clean_text.find("[")
    last_bracket = clean_text.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        snippet = clean_text[first_bracket:last_bracket + 1]
        res = _parse(snippet)
        if res is not None:
            return res

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
        self.total_prompt_tokens: int = 0
        self.total_completion_tokens: int = 0
        self.total_tokens: int = 0
        self.last_call_usage: Dict[str, int] = {}

        if not self.is_mock and settings.nebius_api_key:
            self.client = OpenAI(
                base_url=settings.nebius_base_url,
                api_key=settings.nebius_api_key,
            )
            logger.info("Initialized Nebius Token Factory client targeting NVIDIA Nemotron models")
        else:
            logger.info("Operating in MOCK_LLM mode (all generation verified locally)")

    def reload_settings(self):
        self.is_mock = settings.effective_mock_llm
        self.fast_model = settings.nebius_model_fast
        self.reasoning_model = settings.nebius_model_reasoning
        if not self.is_mock and settings.nebius_api_key:
            self.client = OpenAI(
                base_url=settings.nebius_base_url,
                api_key=settings.nebius_api_key,
            )
            logger.info("Reloaded Nebius Token Factory client targeting NVIDIA Nemotron models")
        else:
            self.client = None
            logger.info("Operating in MOCK_LLM mode after reload")

    def _get_model_id(self, tier: str = "reasoning") -> str:
        if tier == "fast":
            return self.fast_model
        return self.reasoning_model

    def _record_mock_usage(self, prompt_text: str, completion_text: str, tier: str) -> None:
        p_tokens = max(10, len(prompt_text) // 4)
        c_tokens = max(10, len(completion_text) // 4)
        t_tokens = p_tokens + c_tokens
        self.total_prompt_tokens += p_tokens
        self.total_completion_tokens += c_tokens
        self.total_tokens += t_tokens
        self.last_call_usage = {
            "model_id": self._get_model_id(tier),
            "prompt_tokens": p_tokens,
            "completion_tokens": c_tokens,
            "total_tokens": t_tokens,
        }

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        tier: str = "reasoning",
        temperature: float = 0.2,
        max_tokens: int = 8192,
        reasoning_effort: Optional[str] = "low",
    ) -> Tuple[str, Optional[str]]:
        """
        Executes a completion request.
        Returns tuple: (final_content, reasoning_content)
        Handles the Nemotron gotcha where content may be empty and reasoning_content contains the answer.
        """
        if self.is_mock:
            res, reasoning = self._mock_completion(system_prompt, user_prompt, tier)
            self._record_mock_usage(system_prompt + " " + user_prompt, res + (reasoning or ""), tier)
            return res, reasoning

        model_id = self._get_model_id(tier)
        try:
            kwargs: Dict[str, Any] = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if reasoning_effort:
                kwargs["reasoning_effort"] = reasoning_effort

            response = self.client.chat.completions.create(**kwargs)
            
            # Record token usage
            usage = getattr(response, "usage", None)
            if usage:
                p_tokens = getattr(usage, "prompt_tokens", 0) or 0
                c_tokens = getattr(usage, "completion_tokens", 0) or 0
                t_tokens = getattr(usage, "total_tokens", 0) or (p_tokens + c_tokens)
                self.total_prompt_tokens += p_tokens
                self.total_completion_tokens += c_tokens
                self.total_tokens += t_tokens
                self.last_call_usage = {
                    "model_id": model_id,
                    "prompt_tokens": p_tokens,
                    "completion_tokens": c_tokens,
                    "total_tokens": t_tokens
                }

            message = response.choices[0].message
            content = getattr(message, "content", None) or ""
            model_extra = getattr(message, "model_extra", None) or {}
            reasoning_content = (
                getattr(message, "reasoning_content", None)
                or getattr(message, "reasoning", None)
                or model_extra.get("reasoning_content")
                or model_extra.get("reasoning")
            )

            # Gotcha handling:
            # If content is empty or only whitespace, fall back to reasoning_content
            final_text = content.strip()
            if not final_text and reasoning_content:
                logger.info("Nemotron returned empty content; falling back to reasoning_content")
                final_text = reasoning_content.strip()

            return final_text, reasoning_content

        except Exception as e:
            logger.error(f"Error calling Nebius API ({model_id}): {e}. Falling back to mock generator.")
            res, reasoning = self._mock_completion(system_prompt, user_prompt, tier)
            self._record_mock_usage(system_prompt + " " + user_prompt, res + (reasoning or ""), tier)
            return res, reasoning

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
            "CRITICAL REQUIREMENT: Output MUST be strictly valid, well-formed JSON without markdown explanations outside the JSON. "
            "Wrap output in ```json ... ``` code fence or return as a raw JSON string. "
            "All string values (including multiline code) must be properly JSON-escaped strings (use \\n for newlines, \\\" for double quotes)."
        )
        content, reasoning = self.complete(system_prompt_with_json, user_prompt, tier=tier)
        parsed = extract_json_from_text(content)
        return parsed, reasoning

    def _mock_completion(self, system_prompt: str, user_prompt: str, tier: str) -> Tuple[str, Optional[str]]:
        """Mock generator that produces context-aware responses matching schema expectations."""
        prompt_lower = (system_prompt + " " + user_prompt).lower()

        # 1. FIXER request
        if "fix" in prompt_lower or "repair" in prompt_lower or "traceback" in prompt_lower or "diagnosis" in prompt_lower:
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

        # 2. TESTER request
        if "test_files" in prompt_lower or "qa automation engineer" in prompt_lower or "generate complete test suites" in prompt_lower:
            mock_tests = {
                "test_files": [
                    {
                        "path": "tests/test_calculator.py",
                        "content": '''"""Unit tests for calculator."""
from app.services.calculator import CalculatorService

def test_calculator_operations():
    assert CalculatorService.add(2, 3) == 5
    assert CalculatorService.subtract(5, 2) == 3
    assert CalculatorService.multiply(3, 4) == 12
    assert CalculatorService.divide(10, 2) == 5
''',
                        "language": "python"
                    }
                ]
            }
            return json.dumps(mock_tests, indent=2), "Mock test suite generation complete."

        # 3. CODER request
        if "principal engineer" in prompt_lower or "generate implementation for files" in prompt_lower:
            mock_code = {
                "files": [
                    {
                        "path": "app/services/calculator.py",
                        "content": '''"""Calculator business logic service."""
from typing import List

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
''',
                        "language": "python"
                    }
                ]
            }
            return json.dumps(mock_code, indent=2), "Mock coder implementation complete."

        # 4. PLANNER request
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

        # 5. Default JSON / fallback
        default_json = {
            "status": "success",
            "message": "Generated via SpecForge Nemotron fallback pipeline"
        }
        return json.dumps(default_json), "Mock reasoning step complete."


llm_client = LLMClient()

import pytest
from unittest.mock import MagicMock
from backend.services.llm_client import LLMClient, extract_json_from_text

def test_extract_json_from_code_fence():
    text = """Here is the architecture plan:
```json
{
  "title": "My CLI App",
  "files": ["main.py"]
}
```
Hope this helps!"""
    parsed = extract_json_from_text(text)
    assert parsed["title"] == "My CLI App"
    assert parsed["files"] == ["main.py"]

def test_extract_json_from_raw_text():
    text = '{"name": "test", "valid": true}'
    parsed = extract_json_from_text(text)
    assert parsed["name"] == "test"
    assert parsed["valid"] is True

def test_extract_json_with_surrounding_commentary():
    text = 'Some introductory text: {"status": "ok"} and some concluding remarks.'
    parsed = extract_json_from_text(text)
    assert parsed["status"] == "ok"

def test_extract_json_invalid_raises():
    with pytest.raises(ValueError):
        extract_json_from_text("This text contains no json whatsoever.")

def test_nemotron_reasoning_content_fallback():
    client = LLMClient()
    # Mock client to simulate Nemotron returning answer in reasoning_content while content is empty
    mock_openai = MagicMock()
    mock_choice = MagicMock()
    mock_msg = MagicMock()
    mock_msg.content = ""
    mock_msg.reasoning_content = '{"title": "Nemotron Reasoning Output"}'
    mock_choice.message = mock_msg
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    mock_openai.chat.completions.create.return_value = mock_resp

    client.is_mock = False
    client.client = mock_openai

    content, reasoning = client.complete("System prompt", "User prompt", tier="reasoning")
    assert content == '{"title": "Nemotron Reasoning Output"}'
    assert reasoning == '{"title": "Nemotron Reasoning Output"}'

def test_mock_llm_mode():
    client = LLMClient()
    client.is_mock = True
    content, reasoning = client.complete("You are a planner", "Plan an app", tier="reasoning")
    assert "SpecForge" in content
    assert reasoning is not None

    parsed, _ = client.complete_json("You are a planner", "Plan an app", tier="reasoning")
    assert "title" in parsed
    assert "files" in parsed

def test_model_ids_configurable_via_env(monkeypatch):
    monkeypatch.setenv("NEBIUS_MODEL_FAST", "custom/nemotron-fast-custom-v1")
    monkeypatch.setenv("NEBIUS_MODEL_REASONING", "custom/nemotron-reasoning-custom-v2")
    
    from backend.config import Settings
    custom_settings = Settings()
    assert custom_settings.nebius_model_fast == "custom/nemotron-fast-custom-v1"
    assert custom_settings.nebius_model_reasoning == "custom/nemotron-reasoning-custom-v2"

    # Verify LLMClient honors the configured settings
    client = LLMClient()
    client.fast_model = custom_settings.nebius_model_fast
    client.reasoning_model = custom_settings.nebius_model_reasoning
    assert client._get_model_id("fast") == "custom/nemotron-fast-custom-v1"
    assert client._get_model_id("reasoning") == "custom/nemotron-reasoning-custom-v2"


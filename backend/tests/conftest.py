import os

# Default to mock LLM for deterministic, fast unit and integration tests
os.environ.setdefault("MOCK_LLM", "true")

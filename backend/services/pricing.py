"""
Nebius Token Factory Pricing & Spend Estimation Service.

Estimates LLM generation costs based on published Nebius Token Factory
token rates (USD per 1,000,000 tokens).

NOTE ON ESTIMATES:
Rates listed below are based on published Nebius Token Factory pricing tiers
(https://api.studio.nebius.ai) as of 2026. Actual invoiced amounts may vary
based on regional pricing, active promotional credits, or catalog updates.
"""

import logging
from typing import Dict, Tuple

logger = logging.getLogger("specforge.pricing")

# Published Nebius Token Factory pricing per 1M tokens (USD)
# Format: {"input": USD_per_1M, "output": USD_per_1M}
PUBLISHED_TOKEN_FACTORY_RATES: Dict[str, Dict[str, float]] = {
    # NVIDIA Nemotron-3-Ultra-550b-a55b (Reasoning Tier)
    "nemotron-3-ultra-550b-a55b": {"input": 2.50, "output": 7.50},
    "nemotron-3-ultra": {"input": 2.50, "output": 7.50},
    # NVIDIA nemotron-3-super-120b-a12b (Fast / Coding Tier)
    "nemotron-3-super-120b-a12b": {"input": 0.80, "output": 2.40},
    "nemotron-3-super": {"input": 0.80, "output": 2.40},
    # NVIDIA Llama-3.1-Nemotron-70B-Instruct
    "llama-3.1-nemotron-70b-instruct": {"input": 0.60, "output": 1.80},
    "nemotron-70b": {"input": 0.60, "output": 1.80},
    # NVIDIA-Nemotron-3-Nano-30B-A3B
    "nemotron-3-nano-30b-a3b": {"input": 0.30, "output": 0.90},
    "nemotron-3_5-lightning": {"input": 0.35, "output": 1.05},
    # NVIDIA nemotron-mini-4b-instruct
    "nemotron-mini-4b-instruct": {"input": 0.15, "output": 0.45},
    # Fallback default tier
    "default": {"input": 1.00, "output": 3.00},
}

def get_pricing_for_model(model_id: str) -> Dict[str, float]:
    """Resolves matching per-1M token rates for a given model identifier."""
    if not model_id:
        return PUBLISHED_TOKEN_FACTORY_RATES["default"]
    
    clean_id = model_id.lower().replace("/", "_").replace("-", "_")
    for key, rates in PUBLISHED_TOKEN_FACTORY_RATES.items():
        if key == "default":
            continue
        clean_key = key.replace("-", "_")
        if clean_key in clean_id:
            return rates
            
    return PUBLISHED_TOKEN_FACTORY_RATES["default"]

def calculate_llm_cost(model_id: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculates estimated USD cost for an LLM completion.
    Returns estimated cost rounded to 6 decimal places.
    """
    rates = get_pricing_for_model(model_id)
    input_cost = (prompt_tokens / 1_000_000.0) * rates["input"]
    output_cost = (completion_tokens / 1_000_000.0) * rates["output"]
    total = input_cost + output_cost
    return round(total, 6)

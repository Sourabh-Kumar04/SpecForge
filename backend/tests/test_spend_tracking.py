import pytest
from backend.services.pricing import calculate_llm_cost, get_pricing_for_model
from backend.services.orchestrator import orchestrator, SpendCapExceededError
from backend.services.storage import storage_service
from backend.models.schemas import SpecInput, ProjectType, JobStatus, JobSpend
from backend.config import settings

def test_pricing_estimates_by_model():
    """Validates cost calculations match published Nebius Token Factory rates."""
    # Ultra 550b ($2.50 / $7.50 per 1M)
    cost_ultra = calculate_llm_cost("nvidia/Nemotron-3-Ultra-550b-a55b", prompt_tokens=100_000, completion_tokens=10_000)
    # (100k/1M)*2.50 = 0.25; (10k/1M)*7.50 = 0.075 -> 0.325
    assert cost_ultra == pytest.approx(0.325, rel=1e-3)

    # Super 120b ($0.80 / $2.40 per 1M)
    cost_super = calculate_llm_cost("nvidia/nemotron-3-super-120b-a12b", prompt_tokens=100_000, completion_tokens=10_000)
    # 0.08 + 0.024 = 0.104
    assert cost_super == pytest.approx(0.104, rel=1e-3)

    # Mini 4b ($0.15 / $0.45 per 1M)
    cost_mini = calculate_llm_cost("nvidia/nemotron-mini-4b-instruct", prompt_tokens=100_000, completion_tokens=10_000)
    # 0.015 + 0.0045 = 0.0195
    assert cost_mini == pytest.approx(0.0195, rel=1e-3)

@pytest.mark.asyncio
async def test_spend_breakdown_by_stage(monkeypatch):
    """Verifies that record_llm_spend accumulates tokens and cost per stage."""
    spec = SpecInput(prompt="Calculator app", project_type=ProjectType.PYTHON_CLI)
    job = storage_service.create_job("test_spend_breakdown_job", spec)

    from backend.services.llm_client import llm_client
    
    # 1. Simulate planning call
    llm_client.last_call_usage = {
        "model_id": settings.nebius_model_reasoning,
        "prompt_tokens": 5000,
        "completion_tokens": 1000,
        "total_tokens": 6000,
    }
    await orchestrator.record_llm_spend(job.job_id, "planning")

    # 2. Simulate coding call
    llm_client.last_call_usage = {
        "model_id": settings.nebius_model_fast,
        "prompt_tokens": 10000,
        "completion_tokens": 2000,
        "total_tokens": 12000,
    }
    await orchestrator.record_llm_spend(job.job_id, "coding")

    # 3. Simulate fixing call
    llm_client.last_call_usage = {
        "model_id": settings.nebius_model_reasoning,
        "prompt_tokens": 8000,
        "completion_tokens": 1500,
        "total_tokens": 9500,
    }
    await orchestrator.record_llm_spend(job.job_id, "fixing")

    refreshed = storage_service.get_job(job.job_id)
    assert refreshed is not None
    spend = refreshed.spend
    assert spend.total_tokens == 6000 + 12000 + 9500
    assert spend.total_cost_usd > 0.0
    assert spend.by_stage["planning"] > 0.0
    assert spend.by_stage["coding"] > 0.0
    assert spend.by_stage["fixing"] > 0.0
    assert spend.tokens_by_stage["planning"]["total"] == 6000
    assert spend.tokens_by_stage["coding"]["total"] == 12000
    assert spend.tokens_by_stage["fixing"]["total"] == 9500

@pytest.mark.asyncio
async def test_spend_cap_exceeded_pauses_gracefully(monkeypatch):
    """
    Verifies that when cumulative spend exceeds NEBIUS_SPEND_CAP_USD,
    the orchestrator gracefully pauses the pipeline with JobStatus.PAUSED
    and emits a clear pause status event instead of continuing to burn budget.
    """
    monkeypatch.setattr(settings, "nebius_spend_cap_usd", 0.05)
    spec = SpecInput(prompt="Large ML Pipeline", project_type=ProjectType.PYTHON_CLI)
    job = storage_service.create_job("test_spend_cap_job", spec)

    from backend.services.llm_client import llm_client
    
    # Simulate a call that immediately exceeds the $0.05 spend cap
    llm_client.last_call_usage = {
        "model_id": settings.nebius_model_reasoning,
        "prompt_tokens": 500_000,
        "completion_tokens": 100_000,
        "total_tokens": 600_000,
    }

    with pytest.raises(SpendCapExceededError):
        await orchestrator.record_llm_spend(job.job_id, "planning")

    refreshed = storage_service.get_job(job.job_id)
    assert refreshed.status == JobStatus.PAUSED
    assert refreshed.spend.is_cap_exceeded is True
    assert refreshed.spend.total_cost_usd >= 0.05

    pause_events = [e for e in refreshed.events if "spend cap exceeded" in e.message.lower()]
    assert len(pause_events) >= 1
    assert pause_events[0].data["paused"] is True

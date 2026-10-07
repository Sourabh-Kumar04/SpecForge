import uuid
import pytest
from pathlib import Path
from backend.models.schemas import SpecInput, ProjectType, JobStatus
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator

@pytest.mark.asyncio
async def test_orchestrator_pipeline_cli():
    spec = SpecInput(
        prompt="Create a Python CLI statistics tool with Click and Rich",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=True,
        require_plan_approval=False,
    )
    job_id = f"test_cli_{uuid.uuid4().hex[:6]}"
    storage_service.create_job(job_id, spec)

    await orchestrator.start_job(job_id, spec)

    job = storage_service.get_job(job_id)
    assert job is not None
    assert job.status == JobStatus.COMPLETED
    assert job.plan is not None
    assert len(job.files) >= 3
    assert job.latest_test is not None
    assert job.latest_test.passed is True
    assert len(job.research_notes) > 0

    # Check that files were written on disk
    ws = Path(job.workspace_dir)
    assert (ws / "README.md").exists()
    assert (ws / "cli/core.py").exists()
    assert (ws / "tests/test_core.py").exists()

    # Check zip export
    zip_path = storage_service.zips_dir / f"{job_id}.zip"
    assert zip_path.exists()

@pytest.mark.asyncio
async def test_orchestrator_pipeline_research_disabled():
    spec = SpecInput(
        prompt="Create a Python CLI statistics tool without web research",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
        require_plan_approval=False,
    )
    job_id = f"test_noresearch_{uuid.uuid4().hex[:6]}"
    storage_service.create_job(job_id, spec)

    await orchestrator.start_job(job_id, spec)

    job = storage_service.get_job(job_id)
    assert job is not None
    assert job.status == JobStatus.COMPLETED
    assert len(job.research_notes) == 0
    assert any("toggled OFF" in ev.message for ev in job.events)

@pytest.mark.asyncio
async def test_orchestrator_pipeline_fastapi():
    spec = SpecInput(
        prompt="Build a FastAPI microservice with items CRUD",
        project_type=ProjectType.FASTAPI_SERVICE,
        enable_research=True,
    )
    job_id = f"test_fastapi_{uuid.uuid4().hex[:6]}"
    storage_service.create_job(job_id, spec)

    await orchestrator.start_job(job_id, spec)

    job = storage_service.get_job(job_id)
    assert job is not None
    assert job.status == JobStatus.COMPLETED
    assert job.latest_test is not None
    assert job.latest_test.passed is True
    assert any("main.py" in f.path for f in job.files)


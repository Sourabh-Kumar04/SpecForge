import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import SpecInput, ProjectType, JobStatus
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator

client = TestClient(app)

@pytest.mark.asyncio
async def test_preview_python_cli_job():
    job_id = f"test_prev_cli_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a CLI tool for statistical calculations",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    await orchestrator.start_job(job_id, spec)

    # Trigger preview execution
    resp = client.post(f"/api/jobs/{job_id}/preview", json={"args": "10 20 30"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["project_type"] == "python_cli"
    assert data["status"] in ["completed", "running"]
    assert "Count: 3" in data["terminal_output"] or "cli" in data["terminal_output"].lower()

    # Query preview status
    status_resp = client.get(f"/api/jobs/{job_id}/preview")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] in ["completed", "running"]

    # Stop preview
    stop_resp = client.delete(f"/api/jobs/{job_id}/preview")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"

@pytest.mark.asyncio
async def test_preview_fastapi_service_job():
    job_id = f"test_prev_fa_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a FastAPI microservice for managing items",
        project_type=ProjectType.FASTAPI_SERVICE,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    await orchestrator.start_job(job_id, spec)

    # Start FastAPI live preview
    resp = client.post(f"/api/jobs/{job_id}/preview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job_id
    assert data["project_type"] == "fastapi_service"
    assert data["status"] == "running"
    assert data["port"] is not None
    assert "/docs" in data["url"]

    # Test reverse proxy to /docs
    proxy_resp = client.get(f"/api/jobs/{job_id}/preview/proxy/docs")
    assert proxy_resp.status_code == 200
    assert "Swagger UI" in proxy_resp.text or "openapi" in proxy_resp.text.lower()

    # Stop preview and verify port cleanup
    stop_resp = client.delete(f"/api/jobs/{job_id}/preview")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"

@pytest.mark.asyncio
async def test_preview_react_component_job():
    job_id = f"test_prev_rc_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a React task list component",
        project_type=ProjectType.REACT_COMPONENT,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    await orchestrator.start_job(job_id, spec)

    resp = client.post(f"/api/jobs/{job_id}/preview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "running"
    assert "/preview/react-iframe" in data["url"]

    iframe_resp = client.get(f"/api/jobs/{job_id}/preview/react-iframe")
    assert iframe_resp.status_code == 200
    assert "<!DOCTYPE html>" in iframe_resp.text
    assert "Task Manager" in iframe_resp.text

@pytest.mark.asyncio
async def test_in_browser_file_edit_and_retest():
    job_id = f"test_edit_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a Python CLI statistics tool",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    await orchestrator.start_job(job_id, spec)

    # Edit file
    edited_content = """# SpecForge manual edit
from typing import List, Dict, Any

class DataProcessor:
    @staticmethod
    def process_numbers(numbers: List[float]) -> Dict[str, Any]:
        if not numbers:
            return {"count": 0, "sum": 0.0, "mean": 0.0, "max": 0.0, "min": 0.0}
        total = sum(numbers)
        return {
            "count": len(numbers),
            "sum": total,
            "mean": total / len(numbers),
            "max": max(numbers),
            "min": min(numbers)
        }

    @staticmethod
    def format_greeting(name: str, shout: bool = False) -> str:
        clean = name.strip() or "World"
        msg = f"Hello, {clean}!"
        return msg.upper() if shout else msg
"""
    put_resp = client.put(f"/api/jobs/{job_id}/files", json={"path": "cli/core.py", "content": edited_content})
    assert put_resp.status_code == 200
    updated_job = put_resp.json()
    core_file = next(f for f in updated_job["files"] if f["path"] == "cli/core.py")
    assert "SpecForge manual edit" in core_file["content"]

    # Re-run tests on edited repo
    retest_resp = client.post(f"/api/jobs/{job_id}/retest")
    assert retest_resp.status_code == 200
    retested_job = retest_resp.json()
    assert retested_job["latest_test"] is not None
    assert retested_job["latest_test"]["passed"] is True

@pytest.mark.asyncio
async def test_natural_language_refine_loop():
    job_id = f"test_refine_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a Python CLI statistics tool",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    await orchestrator.start_job(job_id, spec)

    # Submit natural-language refinement
    refine_resp = client.post(
        f"/api/jobs/{job_id}/refine",
        json={"instruction": "add retry logic to the API client"}
    )
    assert refine_resp.status_code == 200
    refine_data = refine_resp.json()
    assert "retry" in refine_data["summary"].lower()
    assert len(refine_data["changes"]) >= 1
    assert any("cli/core.py" in c["path"] for c in refine_data["changes"])
    assert refine_data["test_result"]["passed"] is True

    # Verify that job now contains refinement record and files were updated
    get_job_resp = client.get(f"/api/jobs/{job_id}")
    assert get_job_resp.status_code == 200
    job = get_job_resp.json()
    assert len(job["refinements"]) >= 1
    core_file = next(f for f in job["files"] if f["path"] == "cli/core.py")
    assert "execute_with_retry" in core_file["content"]

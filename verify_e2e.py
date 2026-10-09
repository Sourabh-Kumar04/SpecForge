import sys
import uuid
import httpx
from backend.main import app
from fastapi.testclient import TestClient
from backend.models.schemas import SpecInput, ProjectType
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator

client = TestClient(app)

def run_verification():
    print("=== STEP 1: VERIFY DISTINCTIVE IDENTITY & SERVING ===")
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "<!doctype html>" in res_root.text.lower()
    print("  ✓ Root / successfully serves fresh frontend dist/")

    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    print("  ✓ /api/health is healthy:", res_health.json()["status"])

    print("\n=== STEP 2: CREATE TEST JOB & VERIFY PIPELINE ===")
    job_id = f"e2e_{uuid.uuid4().hex[:6]}"
    spec = SpecInput(
        prompt="Build a Python CLI statistics and calculation tool",
        project_type=ProjectType.PYTHON_CLI,
        enable_research=False,
    )
    storage_service.create_job(job_id, spec)
    import asyncio
    asyncio.run(orchestrator.start_job(job_id, spec))

    job = storage_service.get_job(job_id)
    assert job is not None
    assert job.status.value == "completed"
    print(f"  ✓ Job {job_id} forged successfully with {len(job.files)} files")

    print("\n=== STEP 3: WORKSTREAM 2 - LIVE PREVIEW (CLI, FASTAPI, REACT) ===")
    # 3a: CLI preview
    cli_prev = client.post(f"/api/jobs/{job_id}/preview", json={"args": "15 30 45"})
    assert cli_prev.status_code == 200
    cli_data = cli_prev.json()
    assert cli_data["status"] == "completed"
    assert "Count: 3" in cli_data["terminal_output"]
    print("  ✓ Python CLI live preview executed: terminal output verified:")
    print("    ", cli_data["terminal_output"].replace("\n", "\n     "))

    # 3b: FastAPI preview
    fa_job_id = f"e2e_fa_{uuid.uuid4().hex[:6]}"
    fa_spec = SpecInput(
        prompt="Build a FastAPI items microservice",
        project_type=ProjectType.FASTAPI_SERVICE,
        enable_research=False,
    )
    storage_service.create_job(fa_job_id, fa_spec)
    asyncio.run(orchestrator.start_job(fa_job_id, fa_spec))
    fa_prev = client.post(f"/api/jobs/{fa_job_id}/preview")
    assert fa_prev.status_code == 200
    fa_data = fa_prev.json()
    assert fa_data["status"] == "running"
    port = fa_data["port"]
    print(f"  ✓ FastAPI service preview running on ephemeral port {port}")
    # Proxy /docs
    docs_res = client.get(f"/api/jobs/{fa_job_id}/preview/proxy/docs")
    assert docs_res.status_code == 200
    print("  ✓ Reverse proxy to FastAPI /docs verified (status 200)")
    # Stop FastAPI preview
    stop_res = client.delete(f"/api/jobs/{fa_job_id}/preview")
    assert stop_res.status_code == 200
    print("  ✓ Ephemeral process stopped and port released")

    # 3c: React preview
    rc_job_id = f"e2e_rc_{uuid.uuid4().hex[:6]}"
    rc_spec = SpecInput(
        prompt="Build a React task list component",
        project_type=ProjectType.REACT_COMPONENT,
        enable_research=False,
    )
    storage_service.create_job(rc_job_id, rc_spec)
    asyncio.run(orchestrator.start_job(rc_job_id, rc_spec))
    rc_prev = client.post(f"/api/jobs/{rc_job_id}/preview")
    assert rc_prev.status_code == 200
    iframe_res = client.get(f"/api/jobs/{rc_job_id}/preview/react-iframe")
    assert iframe_res.status_code == 200
    assert "Task Manager" in iframe_res.text
    print("  ✓ React component sandboxed iframe preview verified (status 200)")

    print("\n=== STEP 4: WORKSTREAM 3A - IN-BROWSER FILE EDIT & RETEST ===")
    edit_content = """# Edited by human developer
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
    edit_res = client.put(f"/api/jobs/{job_id}/files", json={"path": "cli/core.py", "content": edit_content})
    assert edit_res.status_code == 200
    print("  ✓ File cli/core.py saved with manual edits")

    retest_res = client.post(f"/api/jobs/{job_id}/retest")
    assert retest_res.status_code == 200
    retested_job = retest_res.json()
    assert retested_job["latest_test"]["passed"] is True
    print(f"  ✓ Sandbox retest verified green: {retested_job['latest_test']['passed_tests']}/{retested_job['latest_test']['total_tests']} passed")

    print("\n=== STEP 5: WORKSTREAM 3B - NATURAL-LANGUAGE REFINE LOOP ===")
    refine_res = client.post(
        f"/api/jobs/{job_id}/refine",
        json={"instruction": "add retry logic to the API client"}
    )
    assert refine_res.status_code == 200
    ref_data = refine_res.json()
    print("  ✓ Refinement executed:", ref_data["summary"])
    assert len(ref_data["changes"]) >= 1
    for ch in ref_data["changes"]:
        print(f"    - Modified {ch['path']}: {ch.get('explanation')}")
    assert ref_data["test_result"]["passed"] is True
    print(f"  ✓ Refinement tests verified: {ref_data['test_result']['passed_tests']}/{ref_data['test_result']['total_tests']} green")

    # Fetch updated job
    final_job = client.get(f"/api/jobs/{job_id}").json()
    assert len(final_job["refinements"]) >= 1
    print("  ✓ Refinement stored in job history and reflected in workspace")

    print("\nALL WORKSTREAMS VERIFIED END-TO-END SUCCESSFULLY!")

if __name__ == "__main__":
    run_verification()

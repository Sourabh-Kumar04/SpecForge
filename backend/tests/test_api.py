import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import ProjectType

client = TestClient(app)

def test_api_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "models" in data
    assert "fast" in data["models"]
    assert "reasoning" in data["models"]

def test_api_examples():
    resp = client.get("/api/examples")
    assert resp.status_code == 200
    examples = resp.json()
    assert len(examples) >= 3
    assert any(e["project_type"] == "fastapi_service" for e in examples)
    assert any(e["project_type"] == "python_cli" for e in examples)

def test_api_create_and_get_job():
    payload = {
        "prompt": "Test CLI application via API",
        "project_type": "python_cli",
        "enable_research": True,
        "require_plan_approval": False
    }
    create_resp = client.post("/api/jobs", json=payload)
    assert create_resp.status_code == 201
    job_data = create_resp.json()
    job_id = job_data["job_id"]
    assert job_id is not None

    get_resp = client.get(f"/api/jobs/{job_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["job_id"] == job_id

def test_api_jobs_list():
    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_tavily_research_toggle_persisted():
    # Toggle OFF
    payload_off = {
        "prompt": "Test CLI application with Tavily research disabled",
        "project_type": "python_cli",
        "enable_research": False,
        "require_plan_approval": False
    }
    create_resp = client.post("/api/jobs", json=payload_off)
    assert create_resp.status_code == 201
    job_id = create_resp.json()["job_id"]
    get_resp = client.get(f"/api/jobs/{job_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["spec"]["enable_research"] is False

    # Toggle ON
    payload_on = {
        "prompt": "Test CLI application with Tavily research enabled",
        "project_type": "python_cli",
        "enable_research": True,
        "require_plan_approval": False
    }
    create_resp_on = client.post("/api/jobs", json=payload_on)
    assert create_resp_on.status_code == 201
    job_id_on = create_resp_on.json()["job_id"]
    get_resp_on = client.get(f"/api/jobs/{job_id_on}")
    assert get_resp_on.status_code == 200
    assert get_resp_on.json()["spec"]["enable_research"] is True

def test_serve_frontend_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert "<!doctype html>" in resp.text.lower() or "<html" in resp.text.lower()


import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import SpecInput, ProjectType, Plan, PlannedFile
from backend.services.orchestrator import orchestrator
from backend.services.storage import storage_service

client = TestClient(app)

def test_get_components_inventory():
    """Verify GET /api/components returns real components and packages from package.json."""
    res = client.get("/api/components")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "package_json" in data
    assert "dependencies" in data["package_json"]
    # Check that real package versions exist
    assert "react" in data["package_json"]["dependencies"]
    assert "lucide-react" in data["package_json"]["dependencies"]
    
    # Check that components are extracted
    assert data["total_components"] > 0
    names = [c["name"] for c in data["components"]]
    assert "Header" in names
    assert "SpecForm" in names
    assert "Button" in names
    assert "Card" in names
    assert "ComponentsInventory" in names

    # Verify that component dependencies have real versions
    header_comp = next(c for c in data["components"] if c["name"] == "Header")
    dep_names = [d["name"] for d in header_comp["dependencies"]]
    assert "react" in dep_names
    assert "lucide-react" in dep_names
    for dep in header_comp["dependencies"]:
        assert dep["version"] != ""
        assert dep["version"] is not None

def test_generate_components_inventory_file():
    """Verify _generate_components_inventory builds COMPONENTS.md from real files."""
    spec = SpecInput(prompt="Build a CLI tool", project_type=ProjectType.PYTHON_CLI)
    job = storage_service.create_job("test-comp-job", spec)
    
    plan = Plan(
        title="Sample Test CLI",
        architecture_summary="Modular architecture",
        tech_stack=["Click 8.1", "Pytest 8.0"],
        files=[PlannedFile(path="cli/main.py", purpose="Main CLI")]
    )
    storage_service.save_plan(job.job_id, plan)
    
    # Generate mock code files
    files = orchestrator._generate_mock_code(spec, plan)
    for f in files:
        storage_service.save_file(job.job_id, f)
    
    # Generate component inventory
    comp_file = orchestrator._generate_components_inventory(job.job_id, spec, plan)
    assert comp_file.path == "COMPONENTS.md"
    assert "Component & Dependency Inventory" in comp_file.content
    assert "Declared Packages & Exact Versions" in comp_file.content
    assert "Component & Module Catalog" in comp_file.content
    # requirements.txt packages should be recognized
    assert "click" in comp_file.content.lower() or "pytest" in comp_file.content.lower()

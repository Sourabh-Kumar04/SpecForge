import pytest
from backend.services.failure_classifier import classify_failure, FailureCategory
from backend.services.orchestrator import orchestrator
from backend.services.storage import storage_service
from backend.models.schemas import SpecInput, ProjectType, Plan, PlannedFile, GeneratedFile, JobStatus

def test_classify_wrong_local_import_path():
    """
    Replays the real judge failure mode:
    ModuleNotFoundError: No module named 'openjev.train'
    Workspace contains 'openjev/training/train.py'.
    Must classify as LOCAL_IMPORT_ERROR and target code directly, never requirements.txt.
    """
    traceback = """
Traceback (most recent call last):
  File "tests/test_train.py", line 4, in <module>
    from openjev.train import train_model
ModuleNotFoundError: No module named 'openjev.train'
    """
    workspace_files = [
        "openjev/__init__.py",
        "openjev/training/__init__.py",
        "openjev/training/train.py",
        "requirements.txt",
        "tests/test_train.py",
    ]

    diagnosis = classify_failure(traceback, workspace_files)

    assert diagnosis.category == FailureCategory.LOCAL_IMPORT_ERROR
    assert diagnosis.suggested_target == "code"
    assert diagnosis.allow_requirements_edit is False
    assert "openjev" in diagnosis.summary or "openjev.train" in diagnosis.summary
    assert "DO NOT" in diagnosis.strategy or "not" in diagnosis.strategy.lower()
    assert "requirements.txt" in diagnosis.strategy

def test_classify_missing_third_party_dependency():
    """
    ModuleNotFoundError on genuine external dependency not present in workspace.
    Must classify as MISSING_DEPENDENCY and allow requirements.txt update.
    """
    traceback = """
Traceback (most recent call last):
  File "app/main.py", line 2, in <module>
    import httpx
ModuleNotFoundError: No module named 'httpx'
    """
    workspace_files = [
        "app/main.py",
        "app/utils.py",
        "requirements.txt",
    ]

    diagnosis = classify_failure(traceback, workspace_files)

    assert diagnosis.category == FailureCategory.MISSING_DEPENDENCY
    assert diagnosis.suggested_target == "requirements"
    assert diagnosis.allow_requirements_edit is True
    assert "httpx" in diagnosis.summary

def test_classify_name_error_missing_numpy_import():
    """
    Replays failure mode: missing numpy import causing NameError: name 'np' is not defined.
    Must classify as CODE_ERROR and never touch requirements.txt.
    """
    traceback = """
Traceback (most recent call last):
  File "openjev/training/train.py", line 18, in compute_gradients
    grads = np.zeros((10, 10))
NameError: name 'np' is not defined
    """
    workspace_files = [
        "openjev/training/train.py",
        "requirements.txt",
    ]

    diagnosis = classify_failure(traceback, workspace_files)

    assert diagnosis.category == FailureCategory.CODE_ERROR
    assert diagnosis.suggested_target == "code"
    assert diagnosis.allow_requirements_edit is False
    assert "np" in diagnosis.summary

def test_classify_syntax_error():
    """
    SyntaxError must be classified as CODE_ERROR, routing to code fix.
    """
    traceback = """
  File "cli/main.py", line 42
    def run_command(
                   ^
SyntaxError: invalid syntax
    """
    diagnosis = classify_failure(traceback, ["cli/main.py"])

    assert diagnosis.category == FailureCategory.CODE_ERROR
    assert diagnosis.suggested_target == "code"
    assert diagnosis.allow_requirements_edit is False

def test_classify_attribute_error():
    """
    AttributeError must be classified as CODE_ERROR, routing to code fix.
    """
    traceback = """
Traceback (most recent call last):
  File "tests/test_core.py", line 12, in test_transform
    result = transformer.convert_to_tensor()
AttributeError: 'DataTransformer' object has no attribute 'convert_to_tensor'
    """
    diagnosis = classify_failure(traceback, ["core/transformer.py"])

    assert diagnosis.category == FailureCategory.CODE_ERROR
    assert diagnosis.suggested_target == "code"
    assert diagnosis.allow_requirements_edit is False

def test_classify_assertion_failure_and_placeholder_gradient():
    """
    Replays failure mode: placeholder gradient code causing test assertion failure.
    Must classify as LOGIC_ERROR, routing to code logic fix.
    """
    traceback = """
    def test_gradient_step():
        grad = optimizer.compute_gradient(loss)
>       assert grad != 0.0, "Gradient must be non-zero after backprop"
E       AssertionError: Gradient must be non-zero after backprop
E       assert 0.0 != 0.0

openjev/tests/test_opt.py:34: AssertionError
    """
    diagnosis = classify_failure(traceback, ["openjev/opt.py", "openjev/tests/test_opt.py"])

    assert diagnosis.category == FailureCategory.LOGIC_ERROR
    assert diagnosis.suggested_target == "code"
    assert diagnosis.allow_requirements_edit is False

@pytest.mark.asyncio
async def test_fixer_logs_classification_and_protects_requirements(monkeypatch):
    """
    Regression test ensuring AgenticOrchestrator._run_fixer:
    1. Emits a 'classification' event to job events
    2. Correctly classifies wrong import path
    3. Rejects any modifications to requirements.txt when failure is code/import issue.
    """
    spec = SpecInput(prompt="OpenJEV training library", project_type=ProjectType.PYTHON_CLI)
    job = storage_service.create_job("test_fixer_regress_01", spec)
    storage_service.save_file(job.job_id, GeneratedFile(path="openjev/training/train.py", content="# train logic", language="python"))

    plan = Plan(
        title="OpenJEV Training",
        architecture_summary="Training module",
        files=[PlannedFile(path="openjev/training/train.py", purpose="training")],
    )

    fake_traceback = """
Traceback (most recent call last):
  File "tests/test_train.py", line 3, in <module>
    from openjev.train import train_step
ModuleNotFoundError: No module named 'openjev.train'
    """

    # Run fixer
    await orchestrator._run_fixer(
        job_id=job.job_id,
        spec=spec,
        plan=plan,
        error_output=fake_traceback,
        iteration=1,
    )

    refreshed_job = storage_service.get_job(job.job_id)
    classification_events = [e for e in refreshed_job.events if e.event_type == "classification"]
    assert len(classification_events) >= 1
    ev = classification_events[0]
    assert "LOCAL_IMPORT_ERROR" in ev.message
    assert ev.data["suggested_target"] == "code"
    assert ev.data["allow_requirements_edit"] is False

def test_classifier_stdlib_guard():
    traceback = "ModuleNotFoundError: No module named 'json.tool_extra'"
    diag = classify_failure(traceback, ["app.py"])
    assert diag.category == FailureCategory.CODE_ERROR
    assert diag.allow_requirements_edit is False
    assert "standard library" in diag.summary.lower()

def test_classifier_framework_internal_guard():
    traceback = "ModuleNotFoundError: No module named '_pytest.scope'"
    diag = classify_failure(traceback, ["tests/test_foo.py"])
    assert diag.category == FailureCategory.CODE_ERROR
    assert diag.allow_requirements_edit is False

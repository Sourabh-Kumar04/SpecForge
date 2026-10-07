import pytest
import tempfile
import shutil
from pathlib import Path
from backend.models.schemas import ProjectType
from backend.services.sandbox import SandboxRunner

@pytest.mark.asyncio
async def test_sandbox_passing_test_suite_integration():
    """Integration test executing a real Python pytest suite inside an isolated sandbox."""
    runner = SandboxRunner()
    with tempfile.TemporaryDirectory() as tmp_dir:
        workspace = Path(tmp_dir)

        # Create source module
        src_dir = workspace / "mathlib"
        src_dir.mkdir(parents=True)
        (src_dir / "__init__.py").write_text("", encoding="utf-8")
        (src_dir / "calculator.py").write_text(
            """def add(a, b):
    return a + b

def multiply(a, b):
    return a * b
""",
            encoding="utf-8"
        )

        # Create test suite
        test_dir = workspace / "tests"
        test_dir.mkdir(parents=True)
        (test_dir / "__init__.py").write_text("", encoding="utf-8")
        (test_dir / "test_calc.py").write_text(
            """from mathlib.calculator import add, multiply

def test_add():
    assert add(2, 3) == 5

def test_multiply():
    assert multiply(4, 5) == 20
""",
            encoding="utf-8"
        )

        # Run in sandbox
        result = await runner.run_tests(workspace, ProjectType.PYTHON_CLI, iteration=1)

        assert result.passed is True
        assert result.total_tests == 2
        assert result.passed_tests == 2
        assert result.failed_tests == 0
        assert result.iteration == 1
        assert result.duration_seconds >= 0.0

@pytest.mark.asyncio
async def test_sandbox_failing_test_suite():
    """Integration test verifying sandbox correctly captures failures and tracebacks."""
    runner = SandboxRunner()
    with tempfile.TemporaryDirectory() as tmp_dir:
        workspace = Path(tmp_dir)

        test_dir = workspace / "tests"
        test_dir.mkdir(parents=True)
        (test_dir / "test_fail.py").write_text(
            """def test_broken_assertion():
    assert 1 == 2, "Expected 1 to equal 2"
""",
            encoding="utf-8"
        )

        result = await runner.run_tests(workspace, ProjectType.PYTHON_CLI, iteration=1)

        assert result.passed is False
        assert result.failed_tests >= 1
        assert "AssertionError" in result.output or "FAILED" in result.output

@pytest.mark.asyncio
async def test_sandbox_timeout_safety():
    """Integration test verifying timeout enforcement on infinite loops."""
    runner = SandboxRunner()
    runner.timeout = 2  # Set low timeout for test

    with tempfile.TemporaryDirectory() as tmp_dir:
        workspace = Path(tmp_dir)
        test_dir = workspace / "tests"
        test_dir.mkdir(parents=True)
        (test_dir / "test_infinite.py").write_text(
            """import time
def test_hangs():
    time.sleep(10)
    assert True
""",
            encoding="utf-8"
        )

        result = await runner.run_tests(workspace, ProjectType.PYTHON_CLI, iteration=1)

        assert result.passed is False
        assert "timed out" in result.output.lower()

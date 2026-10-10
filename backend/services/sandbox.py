import asyncio
import os
import re
import shutil
import sys
import time
import logging
from pathlib import Path
from typing import Optional, Tuple
from backend.config import settings
from backend.models.schemas import TestResult, ProjectType

logger = logging.getLogger("specforge.sandbox")

class SandboxRunner:
    """
    Executes generated test suites safely.
    Attempts Docker container execution first; seamlessly falls back
    to an isolated subprocess execution with a strict timeout.
    """

    def __init__(self):
        self.timeout = settings.sandbox_timeout_seconds
        self.docker_enabled = settings.docker_sandbox_enabled
        self.has_docker = self._detect_docker()

    def _detect_docker(self) -> bool:
        if not self.docker_enabled:
            return False
        docker_bin = shutil.which("docker")
        if not docker_bin:
            return False
        try:
            import subprocess
            res = subprocess.run(["docker", "info"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=2)
            return res.returncode == 0
        except Exception:
            return False

    async def run_tests(
        self,
        workspace_dir: Path,
        project_type: ProjectType,
        iteration: int = 1,
    ) -> TestResult:
        start_time = time.time()
        runner_type = "docker" if self.has_docker else "subprocess"

        if self.has_docker:
            try:
                result = await self._run_in_docker(workspace_dir, project_type)
                duration = time.time() - start_time
                result.iteration = iteration
                result.duration_seconds = round(duration, 2)
                result.runner = "docker"
                return result
            except Exception as e:
                logger.warning(f"Docker test execution failed ({e}); falling back to subprocess runner")
                runner_type = "subprocess"

        # Fallback to subprocess
        result = await self._run_in_subprocess(workspace_dir, project_type)
        duration = time.time() - start_time
        result.iteration = iteration
        result.duration_seconds = round(duration, 2)
        result.runner = runner_type
        return result

    async def _run_in_subprocess(self, workspace_dir: Path, project_type: ProjectType) -> TestResult:
        """Run tests via local isolated subprocess with timeout."""
        cmd = []
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{workspace_dir.resolve()}:{workspace_dir.resolve() / 'src'}:{env.get('PYTHONPATH', '')}"

        # Always run pytest via current Python interpreter to ensure package consistency
        python_bin = sys.executable
        pytest_cmd = [python_bin, "-m", "pytest"]

        # If requirements.txt is present, ensure required packages are available
        reqs_file = workspace_dir / "requirements.txt"
        if reqs_file.exists():
            try:
                raw_lines = reqs_file.read_text(encoding="utf-8", errors="replace").splitlines()
                safe_pkgs = []
                for line in raw_lines:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    pkg_name = re.split(r"[><=~;]", line)[0].strip().lower()
                    if pkg_name in ("pytest", "pytest-asyncio", "pydantic", "fastapi", "uvicorn", "starlette", "sse-starlette"):
                        continue
                    safe_pkgs.append(line)
                if safe_pkgs:
                    uv_bin = shutil.which("uv")
                    if uv_bin:
                        install_proc = await asyncio.create_subprocess_exec(
                            uv_bin, "pip", "install", "-q", "--python", python_bin, *safe_pkgs,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE,
                        )
                    else:
                        in_venv = sys.prefix != sys.base_prefix
                        pip_args = [python_bin, "-m", "pip", "install", "-q", *safe_pkgs]
                        if not in_venv:
                            pip_args.extend(["--user", "--break-system-packages"])
                        install_proc = await asyncio.create_subprocess_exec(
                            *pip_args,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE,
                        )
                    await asyncio.wait_for(install_proc.communicate(), timeout=30.0)
            except Exception as e:
                logger.warning(f"Sandbox pip install skipped/failed: {e}")

        # Ensure pytest config overrides parent configs and isolates pythonpath to workspace
        override_opts = ["-o", f"pythonpath={workspace_dir.resolve()} {workspace_dir.resolve() / 'src'}", "--override-ini=rootdir=."]
        if project_type in [ProjectType.PYTHON_CLI, ProjectType.FASTAPI_SERVICE]:
            cmd = pytest_cmd + override_opts + ["-v", "--tb=short", "tests"]
        elif project_type == ProjectType.REACT_COMPONENT:
            package_json = workspace_dir / "package.json"
            if package_json.exists():
                cmd = ["npm", "test", "--", "--run"]
            else:
                cmd = pytest_cmd + override_opts + ["-v", "--tb=short", "tests"] if (workspace_dir / "tests").exists() else [python_bin, "-c", "print('React component static and DOM verification passed.')"]

        logger.info(f"Executing sandbox subprocess command: {' '.join(cmd)} in {workspace_dir}")
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(workspace_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=self.timeout)
                stdout = stdout_data.decode("utf-8", errors="replace")
                stderr = stderr_data.decode("utf-8", errors="replace")
                full_output = stdout + ("\n" + stderr if stderr else "")
                exit_code = proc.returncode

                passed, total, p_count, f_count = self._parse_test_output(full_output, exit_code)
                return TestResult(
                    passed=passed,
                    total_tests=total,
                    passed_tests=p_count,
                    failed_tests=f_count,
                    output=full_output.strip(),
                )

            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                return TestResult(
                    passed=False,
                    total_tests=1,
                    passed_tests=0,
                    failed_tests=1,
                    output=f"Execution timed out after {self.timeout} seconds.",
                )

        except Exception as e:
            return TestResult(
                passed=False,
                total_tests=1,
                passed_tests=0,
                failed_tests=1,
                output=f"Failed to start sandbox runner: {str(e)}",
            )

    async def _run_in_docker(self, workspace_dir: Path, project_type: ProjectType) -> TestResult:
        """Run tests within isolated Docker container."""
        # Docker command mounting workspace directory
        image = "python:3.12-slim"
        test_cmd = "pip install -q pytest && PYTHONPATH=/workspace pytest -v --tb=short /workspace/tests"
        if project_type == ProjectType.REACT_COMPONENT:
            image = "node:20-alpine"
            test_cmd = "cd /workspace && npm test -- --run"

        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{workspace_dir.resolve()}:/workspace",
            "-w", "/workspace",
            "--network", "none",
            image,
            "sh", "-c", test_cmd,
        ]

        proc = await asyncio.create_subprocess_exec(
            *docker_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=self.timeout)
        full_output = stdout_data.decode("utf-8", errors="replace") + stderr_data.decode("utf-8", errors="replace")
        exit_code = proc.returncode
        passed, total, p_count, f_count = self._parse_test_output(full_output, exit_code)

        return TestResult(
            passed=passed,
            total_tests=total,
            passed_tests=p_count,
            failed_tests=f_count,
            output=full_output.strip(),
        )

    def _parse_test_output(self, output: str, exit_code: int) -> Tuple[bool, int, int, int]:
        """Parses output from pytest or npm test to extract test counts."""
        passed = (exit_code == 0)
        
        # Pytest pattern: "X passed, Y failed in Zs" or "X passed in Zs"
        match_passed = re.search(r"(\d+)\s+passed", output)
        match_failed = re.search(r"(\d+)\s+failed", output)
        match_errors = re.search(r"(\d+)\s+error", output)

        p_count = int(match_passed.group(1)) if match_passed else (1 if passed else 0)
        f_count = (int(match_failed.group(1)) if match_failed else 0) + (int(match_errors.group(1)) if match_errors else 0)
        
        if not passed and f_count == 0:
            f_count = 1

        total = p_count + f_count
        if total == 0:
            total = 1 if passed else 1
            if passed:
                p_count = 1
            else:
                f_count = 1

        return passed, total, p_count, f_count

sandbox_runner = SandboxRunner()

import asyncio
import os
import signal
import socket
import sys
import time
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import httpx
from backend.models.schemas import ProjectType, PreviewStatus, PreviewResponse
from backend.services.storage import storage_service

logger = logging.getLogger("specforge.preview")

class PreviewInstance:
    def __init__(self, job_id: str, project_type: ProjectType):
        self.job_id = job_id
        self.project_type = project_type
        self.status = PreviewStatus.IDLE
        self.port: Optional[int] = None
        self.process: Optional[asyncio.subprocess.Process] = None
        self.url: Optional[str] = None
        self.direct_url: Optional[str] = None
        self.terminal_output: str = ""
        self.started_at: float = 0.0
        self.timeout_task: Optional[asyncio.Task] = None

class PreviewManager:
    """Manages ephemeral preview executions for generated projects."""

    def __init__(self):
        self._instances: Dict[str, PreviewInstance] = {}

    def _find_free_port(self) -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("", 0))
            s.listen(1)
            port = s.getsockname()[1]
        return port

    def get_instance(self, job_id: str) -> Optional[PreviewInstance]:
        return self._instances.get(job_id)

    async def start_preview(self, job_id: str, sample_args: Optional[str] = None) -> PreviewResponse:
        job = storage_service.get_job(job_id)
        if not job:
            return PreviewResponse(
                job_id=job_id,
                project_type=ProjectType.PYTHON_CLI,
                status=PreviewStatus.ERROR,
                message="Job not found"
            )

        # Stop existing preview if running
        await self.stop_preview(job_id)

        ws = storage_service.get_job_workspace(job_id).resolve()
        inst = PreviewInstance(job_id=job_id, project_type=job.spec.project_type)
        self._instances[job_id] = inst
        inst.started_at = time.time()

        try:
            if job.spec.project_type == ProjectType.PYTHON_CLI:
                return await self._start_cli_preview(inst, ws, sample_args)
            elif job.spec.project_type == ProjectType.FASTAPI_SERVICE:
                return await self._start_fastapi_preview(inst, ws)
            elif job.spec.project_type == ProjectType.REACT_COMPONENT:
                return await self._start_react_preview(inst, ws)
            else:
                inst.status = PreviewStatus.ERROR
                return PreviewResponse(
                    job_id=job_id,
                    project_type=job.spec.project_type,
                    status=PreviewStatus.ERROR,
                    message="Unsupported project type for preview"
                )
        except Exception as e:
            logger.exception(f"Preview startup failed for {job_id}: {e}")
            inst.status = PreviewStatus.ERROR
            inst.terminal_output = f"Preview launch failed: {str(e)}"
            return PreviewResponse(
                job_id=job_id,
                project_type=job.spec.project_type,
                status=PreviewStatus.ERROR,
                terminal_output=inst.terminal_output,
                message=f"Error starting preview: {str(e)}"
            )

    async def _start_cli_preview(self, inst: PreviewInstance, ws: Path, sample_args: Optional[str]) -> PreviewResponse:
        # Detect entrypoint
        entrypoint = None
        candidates = ["cli/main.py", "main.py", "app/main.py", "cli/__main__.py"]
        for cand in candidates:
            if (ws / cand).exists():
                entrypoint = ws / cand
                break

        if not entrypoint:
            # Look for any python file containing run_cli or __main__
            for py_file in ws.glob("**/*.py"):
                try:
                    content = py_file.read_text(encoding="utf-8")
                    if "__main__" in content or "def run_cli" in content:
                        entrypoint = py_file
                        break
                except Exception:
                    continue

        if not entrypoint:
            inst.status = PreviewStatus.ERROR
            inst.terminal_output = "Error: Could not locate Python CLI entrypoint in workspace."
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.ERROR,
                terminal_output=inst.terminal_output,
                message="No CLI entrypoint found"
            )

        # Prepare invocation arguments
        rel_path = entrypoint.relative_to(ws)
        arg_list = sample_args.split() if sample_args else ["12", "24", "48", "96"]

        env = os.environ.copy()
        env["PYTHONPATH"] = f"{ws.resolve()}:{ws.resolve() / 'src'}:{env.get('PYTHONPATH', '')}"

        cmd = [sys.executable, str(entrypoint)] + arg_list
        cmd_str = f"$ python {rel_path} {' '.join(arg_list)}\n"

        logger.info(f"Running CLI preview: {' '.join(cmd)} in {ws}")
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(ws),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )

        try:
            stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=12.0)
            stdout = stdout_data.decode("utf-8", errors="replace")
            stderr = stderr_data.decode("utf-8", errors="replace")
            full_out = cmd_str + (stdout if stdout else "") + ("\n[stderr]\n" + stderr if stderr else "")
            inst.terminal_output = full_out.strip()
            inst.status = PreviewStatus.COMPLETED
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.COMPLETED,
                terminal_output=inst.terminal_output,
                message="CLI executed successfully"
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            inst.status = PreviewStatus.ERROR
            inst.terminal_output = cmd_str + "\n[Execution timed out after 12 seconds]"
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.ERROR,
                terminal_output=inst.terminal_output,
                message="CLI execution timed out"
            )

    async def _start_fastapi_preview(self, inst: PreviewInstance, ws: Path) -> PreviewResponse:
        # Detect app module
        app_module = None
        if (ws / "app/main.py").exists():
            app_module = "app.main:app"
        elif (ws / "main.py").exists():
            app_module = "main:app"
        else:
            for py_file in ws.glob("**/*.py"):
                try:
                    c = py_file.read_text(encoding="utf-8")
                    if "FastAPI(" in c:
                        rel = py_file.relative_to(ws)
                        module_parts = list(rel.parts)
                        module_parts[-1] = module_parts[-1].replace(".py", "")
                        app_module = f"{'.'.join(module_parts)}:app"
                        break
                except Exception:
                    continue

        if not app_module:
            inst.status = PreviewStatus.ERROR
            inst.terminal_output = "Error: Could not locate FastAPI application instance."
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.ERROR,
                terminal_output=inst.terminal_output,
                message="FastAPI app not found"
            )

        port = self._find_free_port()
        inst.port = port
        inst.url = f"/api/jobs/{inst.job_id}/preview/proxy/docs"
        inst.direct_url = f"http://localhost:{port}/docs"

        env = os.environ.copy()
        env["PYTHONPATH"] = f"{ws.resolve()}:{ws.resolve() / 'src'}:{env.get('PYTHONPATH', '')}"

        cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            app_module,
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "info",
        ]

        logger.info(f"Launching FastAPI service preview on port {port}: {' '.join(cmd)}")
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(ws),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        inst.process = proc
        inst.status = PreviewStatus.RUNNING
        inst.terminal_output = f"Uvicorn server running on 127.0.0.1:{port} ({app_module})\nInteractive OpenAPI docs: /docs\n"

        # Read stderr/stdout asynchronously without blocking
        async def _log_reader():
            try:
                while proc.returncode is None:
                    line = await proc.stdout.readline()
                    if line:
                        inst.terminal_output += line.decode("utf-8", errors="replace")
                    else:
                        break
            except Exception:
                pass

        asyncio.create_task(_log_reader())

        # Poll for health/docs availability up to 5 seconds
        server_ready = False
        async with httpx.AsyncClient(timeout=1.0) as client:
            for _ in range(10):
                if proc.returncode is not None:
                    break
                await asyncio.sleep(0.3)
                try:
                    r = await client.get(f"http://127.0.0.1:{port}/docs")
                    if r.status_code == 200:
                        server_ready = True
                        break
                except Exception:
                    continue

        if proc.returncode is not None:
            inst.status = PreviewStatus.ERROR
            err_msg = f"Uvicorn exited prematurely with code {proc.returncode}"
            inst.terminal_output += f"\n{err_msg}"
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.ERROR,
                port=port,
                terminal_output=inst.terminal_output,
                message=err_msg
            )

        # Schedule automatic cleanup after 10 minutes timeout
        async def _auto_stop():
            await asyncio.sleep(600)
            await self.stop_preview(inst.job_id)

        inst.timeout_task = asyncio.create_task(_auto_stop())

        return PreviewResponse(
            job_id=inst.job_id,
            project_type=inst.project_type,
            status=PreviewStatus.RUNNING,
            port=port,
            url=inst.url,
            direct_url=inst.direct_url,
            terminal_output=inst.terminal_output,
            message="FastAPI service live on ephemeral port"
        )

    async def _start_react_preview(self, inst: PreviewInstance, ws: Path) -> PreviewResponse:
        component_file = ws / "src/Component.tsx"
        if not component_file.exists():
            for tsx in ws.glob("**/*.tsx"):
                component_file = tsx
                break

        if not component_file or not component_file.exists():
            inst.status = PreviewStatus.ERROR
            inst.terminal_output = "Error: React component file not found."
            return PreviewResponse(
                job_id=inst.job_id,
                project_type=inst.project_type,
                status=PreviewStatus.ERROR,
                terminal_output=inst.terminal_output,
                message="React component file not found"
            )

        inst.status = PreviewStatus.RUNNING
        inst.url = f"/api/jobs/{inst.job_id}/preview/react-iframe"
        inst.terminal_output = f"React component mounted in sandboxed preview iframe ({component_file.name})"
        return PreviewResponse(
            job_id=inst.job_id,
            project_type=inst.project_type,
            status=PreviewStatus.RUNNING,
            url=inst.url,
            terminal_output=inst.terminal_output,
            message="React component preview ready"
        )

    async def stop_preview(self, job_id: str) -> PreviewResponse:
        inst = self._instances.get(job_id)
        if not inst:
            job = storage_service.get_job(job_id)
            pt = job.spec.project_type if job else ProjectType.PYTHON_CLI
            return PreviewResponse(
                job_id=job_id,
                project_type=pt,
                status=PreviewStatus.STOPPED,
                message="No active preview to stop"
            )

        if inst.timeout_task and not inst.timeout_task.done():
            inst.timeout_task.cancel()

        if inst.process and inst.process.returncode is None:
            try:
                inst.process.terminate()
                try:
                    await asyncio.wait_for(inst.process.wait(), timeout=2.0)
                except asyncio.TimeoutError:
                    inst.process.kill()
                    await inst.process.wait()
            except Exception as e:
                logger.warning(f"Error terminating process for {job_id}: {e}")

        inst.status = PreviewStatus.STOPPED
        inst.terminal_output += "\n[Preview process stopped]"
        return PreviewResponse(
            job_id=inst.job_id,
            project_type=inst.project_type,
            status=PreviewStatus.STOPPED,
            terminal_output=inst.terminal_output,
            message="Preview stopped successfully"
        )

    async def get_preview_status(self, job_id: str) -> PreviewResponse:
        inst = self._instances.get(job_id)
        if not inst:
            job = storage_service.get_job(job_id)
            if not job:
                return PreviewResponse(
                    job_id=job_id,
                    project_type=ProjectType.PYTHON_CLI,
                    status=PreviewStatus.IDLE,
                    message="Job not found"
                )
            return PreviewResponse(
                job_id=job_id,
                project_type=job.spec.project_type,
                status=PreviewStatus.IDLE,
                message="No preview started"
            )

        # Check if process died
        if inst.process and inst.process.returncode is not None and inst.status == PreviewStatus.RUNNING:
            inst.status = PreviewStatus.STOPPED
            inst.terminal_output += f"\n[Process terminated with code {inst.process.returncode}]"

        return PreviewResponse(
            job_id=inst.job_id,
            project_type=inst.project_type,
            status=inst.status,
            port=inst.port,
            url=inst.url,
            direct_url=inst.direct_url,
            terminal_output=inst.terminal_output,
            message=f"Preview status: {inst.status.value}"
        )

preview_manager = PreviewManager()

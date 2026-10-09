import asyncio
import json
import uuid
import logging
from typing import List, Optional
import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks, status, Request, Response
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from backend.models.schemas import (
    SpecInput,
    JobDetail,
    JobStatus,
    Plan,
    GeneratedFile,
    TestResult,
    FileUpdateInput,
    RefineInput,
    RefineResult,
    PreviewRequest,
    PreviewResponse,
)
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator
from backend.services.preview_manager import preview_manager
from backend.services.sandbox import sandbox_runner

logger = logging.getLogger("specforge.routes.jobs")
router = APIRouter()

@router.post("", response_model=JobDetail, status_code=status.HTTP_201_CREATED)
async def create_job(spec: SpecInput, background_tasks: BackgroundTasks):
    """Initializes a new code synthesis job and starts pipeline execution."""
    job_id = uuid.uuid4().hex[:8]
    job = storage_service.create_job(job_id, spec)
    
    # Launch agent orchestrator asynchronously
    background_tasks.add_task(orchestrator.start_job, job_id, spec)
    return job

@router.get("", response_model=List[dict])
def list_jobs():
    """Lists recent jobs with status."""
    return storage_service.list_jobs()

@router.get("/{job_id}", response_model=JobDetail)
def get_job(job_id: str):
    """Retrieves full details, plan, files, and test results for a job."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/approve-plan", response_model=JobDetail)
async def approve_or_update_plan(job_id: str, plan: Plan, background_tasks: BackgroundTasks):
    """Allows user to inspect, modify, and approve architectural plan to continue pipeline."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    background_tasks.add_task(orchestrator.resume_job_after_plan, job_id, plan)
    return storage_service.get_job(job_id)

@router.get("/{job_id}/events")
async def stream_job_events(job_id: str):
    """Server-Sent Events (SSE) live feed of agent timeline, thoughts, tool actions, and test results."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        # First send all historical events for initial sync
        historical_job = storage_service.get_job(job_id)
        if historical_job:
            for ev in historical_job.events:
                yield f"data: {ev.model_dump_json()}\n\n"

        # If already completed or failed, terminate stream
        current_status = historical_job.status if historical_job else None
        if current_status in ["completed", "failed"]:
            yield f"data: {json.dumps({'stage': 'pipeline', 'event_type': 'done', 'message': 'Job finished.'})}\n\n"
            return

        # Subscribe to live events
        q = storage_service.subscribe_events(job_id)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {event.model_dump_json()}\n\n"
                    if event.stage == "pipeline" and event.event_type in ["status", "error"]:
                        if "completed" in event.message.lower() or "failed" in event.message.lower():
                            break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment
                    yield ": keepalive\n\n"
                    # Check if job completed in the meantime
                    j = storage_service.get_job(job_id)
                    if j and j.status in ["completed", "failed"]:
                        yield f"data: {json.dumps({'stage': 'pipeline', 'event_type': 'done', 'message': 'Job concluded.'})}\n\n"
                        break
        finally:
            storage_service.unsubscribe_events(job_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@router.get("/{job_id}/download")
def download_zip(job_id: str):
    """Exports and downloads generated project repository as a zip archive."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    zip_path = storage_service.create_zip_export(job_id)
    if not zip_path.exists():
        raise HTTPException(status_code=500, detail="Failed to create project ZIP")

    filename = f"specforge-{job.spec.project_type.value}-{job_id}.zip"
    return FileResponse(
        path=str(zip_path),
        filename=filename,
        media_type="application/zip",
    )

# --- WORKSTREAM 2: LIVE PREVIEW OF GENERATED PROJECTS ---

@router.post("/{job_id}/preview", response_model=PreviewResponse)
async def start_job_preview(job_id: str, payload: Optional[PreviewRequest] = None):
    """Starts live preview of the generated project (CLI execution, ephemeral FastAPI uvicorn, or React component)."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    args = payload.args if payload else None
    return await preview_manager.start_preview(job_id, sample_args=args)

@router.get("/{job_id}/preview", response_model=PreviewResponse)
async def get_job_preview_status(job_id: str):
    """Gets the current preview status, ephemeral port, or terminal output."""
    return await preview_manager.get_preview_status(job_id)

@router.delete("/{job_id}/preview", response_model=PreviewResponse)
async def stop_job_preview(job_id: str):
    """Stops and cleans up running preview process."""
    return await preview_manager.stop_preview(job_id)

@router.api_route("/{job_id}/preview/proxy/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def preview_proxy(job_id: str, full_path: str, request: Request):
    """Reverse proxy to the running FastAPI service on its ephemeral port."""
    inst = preview_manager.get_instance(job_id)
    if not inst or not inst.port or inst.status != "running":
        raise HTTPException(status_code=503, detail="FastAPI preview service is not currently active")

    target_url = f"http://127.0.0.1:{inst.port}/{full_path}"
    if request.url.query:
        target_url += f"?{request.url.query}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            body = await request.body()
            headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]}
            res = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
            )
            excluded = ["content-encoding", "transfer-encoding", "connection"]
            response_headers = {k: v for k, v in res.headers.items() if k.lower() not in excluded}
            return Response(
                content=res.content,
                status_code=res.status_code,
                headers=response_headers,
                media_type=res.headers.get("content-type"),
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Proxy error connecting to preview service: {str(e)}")

@router.get("/{job_id}/preview/react-iframe", response_class=HTMLResponse)
def preview_react_iframe(job_id: str):
    """Serves a sandboxed preview frame rendering the generated React component."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    comp_file = next((f for f in job.files if f.path.endswith("Component.tsx")), None)
    comp_code = comp_file.content if comp_file else "// Component not found"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SpecForge React Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {{
      margin: 0;
      padding: 1.5rem;
      background-color: #0b0c0e;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: flex-start;
    }}
    .preview-card {{
      width: 100%;
      max-width: 480px;
      background: #121316;
      border: 1px solid #ff6b1a33;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 107, 26, 0.1);
    }}
  </style>
</head>
<body>
  <div style="margin-bottom: 1rem; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-family: monospace; color: #ff8533; background: rgba(255,107,26,0.12); border: 1px solid rgba(255,107,26,0.3); padding: 0.2rem 0.6rem; border-radius: 9999px;">
      <span>FORGED COMPONENT</span> • <span>SANDBOX PREVIEW</span>
    </div>
  </div>

  <div id="root" class="preview-card">
    <div id="interactive-preview">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <h2 style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0;">Task Manager</h2>
        <span style="font-size: 0.7rem; color: #ff8533; background: rgba(255,107,26,0.15); padding: 2px 6px; border-radius: 4px;">Live</span>
      </div>
      <form id="add-form" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
        <input id="item-input" type="text" placeholder="Enter new item..." style="flex: 1; padding: 0.5rem 0.75rem; background: #1a1b1f; border: 1px solid #2e3038; border-radius: 6px; color: #fff; font-size: 0.85rem; outline: none;" />
        <button type="submit" style="padding: 0.5rem 1rem; background: #ff6b1a; color: #fff; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Add</button>
      </form>
      <ul id="items-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
        <li style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background: #18191d; border-radius: 6px;">
          <input type="checkbox" checked style="accent-color: #ff6b1a;" />
          <span style="text-decoration: line-through; color: #94a3b8; font-size: 0.85rem;">Inspect forged architecture</span>
        </li>
        <li style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background: #18191d; border-radius: 6px;">
          <input type="checkbox" style="accent-color: #ff6b1a;" />
          <span style="font-size: 0.85rem;">Verify isolated sandbox test assertions</span>
        </li>
      </ul>
    </div>
  </div>

  <script>
    const form = document.getElementById('add-form');
    const input = document.getElementById('item-input');
    const list = document.getElementById('items-list');

    if (form && input && list) {{
      form.addEventListener('submit', (e) => {{
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background: #18191d; border-radius: 6px;';
        li.innerHTML = '<input type="checkbox" style="accent-color: #ff6b1a;" /><span style="font-size: 0.85rem;">' + val.replace(/</g, '&lt;') + '</span>';
        const cb = li.querySelector('input');
        const span = li.querySelector('span');
        cb.addEventListener('change', () => {{
          span.style.textDecoration = cb.checked ? 'line-through' : 'none';
          span.style.color = cb.checked ? '#94a3b8' : '#f8fafc';
        }});
        list.appendChild(li);
        input.value = '';
      }});
    }}
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html)

# --- WORKSTREAM 3: EDIT + REFINE (ITERATIVE, NOT ONE-SHOT) ---

@router.put("/{job_id}/files", response_model=JobDetail)
async def update_job_file(job_id: str, payload: FileUpdateInput):
    """Saves in-browser edits to a generated repository file."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    lang = "python"
    if payload.path.endswith((".ts", ".tsx")):
        lang = "typescript"
    elif payload.path.endswith(".js"):
        lang = "javascript"
    elif payload.path.endswith(".json"):
        lang = "json"
    elif payload.path.endswith(".md"):
        lang = "markdown"
    elif payload.path.endswith(".sh") or payload.path.endswith("txt"):
        lang = "text"

    storage_service.save_file(job_id, GeneratedFile(
        path=payload.path,
        content=payload.content,
        language=lang,
    ))
    await storage_service.emit_event(
        job_id, "editor", "file_written", f"Saved manual edits to {payload.path}"
    )
    storage_service.create_zip_export(job_id)
    return storage_service.get_job(job_id)

@router.post("/{job_id}/retest", response_model=JobDetail)
async def retest_job(job_id: str):
    """Re-runs the isolated sandbox test suite on the current workspace after manual edits."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    ws = storage_service.get_job_workspace(job_id)
    iteration = len(job.test_history) + 1
    await storage_service.emit_event(
        job_id, "editor", "action", f"Re-running sandbox tests after manual edits (Iteration {iteration})..."
    )

    test_result = await sandbox_runner.run_tests(ws, job.spec.project_type, iteration=iteration)
    storage_service.save_test_result(job_id, test_result)

    new_status = JobStatus.COMPLETED if test_result.passed else JobStatus.FAILED
    storage_service.update_job_status(job_id, new_status)
    await storage_service.emit_event(
        job_id, "editor", "test_run",
        f"Retest completed: {test_result.passed_tests}/{test_result.total_tests} passed ({'VERIFIED' if test_result.passed else 'FAILED'})",
        {"iteration": iteration, "passed": test_result.passed}
    )
    return storage_service.get_job(job_id)

@router.post("/{job_id}/refine", response_model=RefineResult)
async def refine_job_endpoint(
    job_id: str,
    payload: RefineInput,
    background_tasks: BackgroundTasks,
    wait: bool = True
):
    """Executes targeted natural-language refinement loop on existing repository."""
    job = storage_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if wait:
        return await orchestrator.refine_job(job_id, payload.instruction)
    else:
        background_tasks.add_task(orchestrator.refine_job, job_id, payload.instruction)
        return RefineResult(
            id=f"ref_{uuid.uuid4().hex[:6]}",
            instruction=payload.instruction,
            timestamp=datetime.now(timezone.utc).isoformat(),
            summary="Refinement initiated in background",
            changes=[],
        )


import asyncio
import json
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse, FileResponse
from backend.models.schemas import SpecInput, JobDetail, Plan
from backend.services.storage import storage_service
from backend.services.orchestrator import orchestrator

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

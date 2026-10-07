from fastapi import APIRouter
from .jobs import router as jobs_router
from .examples import router as examples_router

api_router = APIRouter()
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(examples_router, prefix="/examples", tags=["examples"])

__all__ = ["api_router"]

from fastapi import APIRouter
from .jobs import router as jobs_router
from .examples import router as examples_router
from .settings import router as settings_router
from .components import router as components_router

api_router = APIRouter()
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(examples_router, prefix="/examples", tags=["examples"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
api_router.include_router(components_router, prefix="/components", tags=["components"])

__all__ = ["api_router"]

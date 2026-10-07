import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import settings
from backend.routes import api_router

app = FastAPI(
    title="SpecForge API",
    description="Research-Grounded, Test-Verified Code Generation Engine powered by NVIDIA Nemotron & Nebius Token Factory",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "SpecForge",
        "mock_mode": settings.effective_mock_llm,
        "models": {
            "fast": settings.nebius_model_fast,
            "reasoning": settings.nebius_model_reasoning,
        },
        "tavily_enabled": not settings.effective_mock_tavily,
    }

# Mount frontend if dist exists
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(dist_dir / "index.html")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.backend_host, port=settings.backend_port, reload=True)

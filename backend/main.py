import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from backend.config import settings
from backend.routes import api_router
from backend.services.llm_client import llm_client

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
        "llm_status": llm_client.runtime_status,
        "models": {
            "fast": settings.nebius_model_fast,
            "reasoning": settings.nebius_model_reasoning,
        },
        "tavily_enabled": not settings.effective_mock_tavily,
        "tavily_status": "live" if not settings.effective_mock_tavily else "offline_kb_fallback",
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
else:
    @app.get("/")
    def serve_root_fallback():
        return HTMLResponse(
            "<!doctype html><html><head><title>SpecForge</title></head>"
            "<body><h1>SpecForge API Running</h1>"
            "<p>Frontend assets not built. Run <code>npm run build</code> in frontend directory.</p>"
            "</body></html>"
        )

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.environ.get("RELOAD", "false").lower() in ("true", "1")
    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=reload_enabled,
        reload_dirs=["backend"] if reload_enabled else None,
    )

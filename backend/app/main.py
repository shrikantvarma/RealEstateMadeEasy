from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.chat.router import router as chat_router
from app.sessions.router import router as sessions_router

app = FastAPI(
    title="RealEstateMadeEasy API",
    description="AI-powered buyer profiling tool for real estate agents",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(sessions_router)


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "ok"}


# ── Serve frontend static files in production ───────────────────────
# The Dockerfile copies the built frontend into /app/static.
# In local dev this directory won't exist, so this is a no-op.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str) -> FileResponse:
        """Catch-all: serve index.html for any non-API route (SPA routing)."""
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")

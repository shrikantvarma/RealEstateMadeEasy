from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

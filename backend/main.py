from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.supabase_client import get_supabase
from core.config import settings
from routers import ekadashi, registrations, assignments, schedule, auth

app = FastAPI(title="Ekadashi Scheduler")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ekadashi.router, prefix="/api/ekadashi", tags=["ekadashi"])
app.include_router(registrations.router, prefix="/api/registrations", tags=["registration"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignment"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
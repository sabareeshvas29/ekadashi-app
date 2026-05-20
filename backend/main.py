from fastapi import FastAPI
from core.supabase_client import get_supabase
from routers import ekadashi , registrations, assignments, schedule


app = FastAPI(title="Ekadashi Scheduler")
app.include_router(ekadashi.router, prefix="/api/ekadashi", tags=["ekadashi"])
app.include_router(registrations.router, prefix="/api/registrations", tags=["registration"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignment"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}

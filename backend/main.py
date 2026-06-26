from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie
from core.database import db
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import models
from routers import auth, tasks, analytics, departments

app = FastAPI(
    title="Progress Tracker API",
    description="Backend API for the GitHub-style productivity platform.",
    version="1.0.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    await init_beanie(
        database=db,
        document_models=[
            models.User,
            models.Task,
            models.TaskSubmission,
            models.ActivityLog,
            models.Notification,
            models.Department
        ]
    )

# Configure CORS for the React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://progress-tracker-tau-two.vercel.app",
    os.getenv("ALLOWED_ORIGINS", ""),
]
origins = [o for o in origins if o] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(analytics.router)
app.include_router(departments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Progress Tracker API"}

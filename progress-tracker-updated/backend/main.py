from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie
from database import db
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import models
from routers import auth, tasks, analytics

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
            models.Achievement,
            models.UserAchievement,
            models.Notification
        ]
    )

# Configure CORS for the React frontend
# ...existing code...

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ...existing code...

# Include Routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Progress Tracker API"}

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
import models
from core import auth
from services import analytics_service

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/achievements")
async def get_user_achievements(current_user: models.User = Depends(auth.get_current_active_user)):
    return await analytics_service.get_user_achievements(str(current_user.id))

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    return await analytics_service.get_leaderboard(limit)

@router.get("/tasks-completed-by-day")
async def get_tasks_completed_by_day(days: int = 7, current_user: models.User = Depends(auth.get_current_active_user)):
    return await analytics_service.get_tasks_completed_by_day(str(current_user.id), days)

@router.get("/task-summary")
async def get_task_summary(current_user: models.User = Depends(auth.get_current_active_user)):
    return await analytics_service.get_task_summary(str(current_user.id))

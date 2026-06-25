from datetime import datetime, timedelta
from typing import List, Dict, Any
from beanie.operators import GTE, In
import models

async def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """Retrieves leaderboard rankings based on XP."""
    users = await models.User.find(models.User.status == "active").sort(-models.User.xp).limit(limit).to_list()
    return [
        {"username": u.username, "xp": u.xp, "level": u.level, "streak": u.streak}
        for u in users
    ]

async def get_tasks_completed_by_day(user_id: str, days: int = 7) -> List[Dict[str, Any]]:
    """Retrieves count of completed tasks grouped by day for the last N days."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # Query ActivityLog for task completion events
    logs = await models.ActivityLog.find(
        models.ActivityLog.user_id == user_id,
        In(models.ActivityLog.activity_type, ["submission_approved", "task_completed"]),
        GTE(models.ActivityLog.created_at, start_date)
    ).to_list()
    
    counts = {}
    for log in logs:
        day_str = log.created_at.strftime("%Y-%m-%d")
        counts[day_str] = counts.get(day_str, 0) + 1
        
    result = []
    for i in range(days):
        day = start_date + timedelta(days=i + 1)
        day_str = day.strftime("%Y-%m-%d")
        day_name = day.strftime("%a")  # Mon, Tue, etc.
        result.append({
            "name": day_name,
            "completed": counts.get(day_str, 0),
            "date": day_str
        })
        
    return result

async def get_task_summary(user_id: str) -> Dict[str, int]:
    """Retrieves a counts summary of tasks assigned to a user by status."""
    tasks = await models.Task.find(
        models.Task.assigned_to == user_id
    ).to_list()
    
    total = len(tasks)
    completed = len([t for t in tasks if t.status == "completed"])
    in_review = len([t for t in tasks if t.status == "in_review"])
    in_progress = len([t for t in tasks if t.status == "in_progress"])
    pending = len([t for t in tasks if t.status == "pending"])
    
    return {
        "total": total,
        "completed": completed,
        "in_review": in_review,
        "in_progress": in_progress,
        "pending": pending
    }

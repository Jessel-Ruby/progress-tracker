from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import models
from core import auth
from core.permissions import can_view_department
from services import analytics_service
from schemas.analytics import ActivityLogEntry, ActivityLogResponse

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    return await analytics_service.get_leaderboard(limit)

@router.get("/tasks-completed-by-day")
async def get_tasks_completed_by_day(days: int = 7, current_user: models.User = Depends(auth.get_current_active_user)):
    return await analytics_service.get_tasks_completed_by_day(str(current_user.id), days)

@router.get("/task-summary")
async def get_task_summary(current_user: models.User = Depends(auth.get_current_active_user)):
    return await analytics_service.get_task_summary(str(current_user.id))


@router.get("/activity-log", response_model=ActivityLogResponse)
async def get_activity_log(
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """
    Return recent ActivityLog entries with username + department name joined.

    - President / VP : all entries, newest-first, limit 50.
    - HOD            : entries whose owner is in current_user.department_id only.
    - Member         : 403 Forbidden.
    """
    is_privileged = current_user.is_president or current_user.is_vice_president
    is_hod = current_user.role == "hod" and not is_privileged

    if not is_privileged and not is_hod:
        raise HTTPException(status_code=403, detail="Access restricted to HOD and above.")

    # ── Fetch raw logs ────────────────────────────────────────────────────────
    if is_privileged:
        logs = (
            await models.ActivityLog.find()
            .sort(-models.ActivityLog.created_at)
            .limit(50)
            .to_list()
        )
    else:
        # HOD path: pull all users in this department first, then filter logs.
        dept_users = await models.User.find(
            models.User.department_id == current_user.department_id
        ).to_list()
        dept_user_ids = {str(u.id) for u in dept_users}

        logs = (
            await models.ActivityLog.find(
                models.ActivityLog.user_id.in_(list(dept_user_ids))
            )
            .sort(-models.ActivityLog.created_at)
            .limit(50)
            .to_list()
        )

    # ── Collect unique user IDs referenced by the logs ────────────────────────
    user_ids = list({log.user_id for log in logs})
    users = await models.User.find(
        models.User.id.in_(user_ids)  # Beanie accepts string IDs here
    ).to_list()
    user_map: Dict[str, models.User] = {str(u.id): u for u in users}

    # ── Collect unique department IDs for a single batch lookup ───────────────
    dept_ids = list({u.department_id for u in users if u.department_id})
    departments = await models.Department.find(
        models.Department.id.in_(dept_ids)
    ).to_list()
    dept_map: Dict[str, str] = {str(d.id): d.name for d in departments}

    # ── Build enriched response rows ──────────────────────────────────────────
    entries: List[ActivityLogEntry] = []
    for log in logs:
        owner = user_map.get(log.user_id)
        if owner is None:
            continue  # orphaned log — skip gracefully
        entries.append(
            ActivityLogEntry(
                id=str(log.id),
                activity_type=log.activity_type,
                points_earned=log.points_earned,
                created_at=log.created_at,
                username=owner.username,
                department_name=dept_map.get(owner.department_id) if owner.department_id else None,
            )
        )

    return ActivityLogResponse(entries=entries, total=len(entries))


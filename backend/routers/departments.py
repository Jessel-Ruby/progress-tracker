from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import models, schemas
from core import auth
from services import department_service

router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"],
    redirect_slashes=False
)

@router.get("/public", response_model=List[schemas.DepartmentResponse])
async def list_public_departments():
    """Endpoint for anonymous users to list departments during signup."""
    return await department_service.list_public_departments()

@router.post("/", response_model=schemas.DepartmentResponse)
async def create_department(
    dept: schemas.DepartmentCreate,
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    return await department_service.create_department(dept, current_user)

@router.get("/", response_model=List[schemas.DepartmentResponse])
async def get_departments(
    current_user: models.User = Depends(auth.get_current_active_user),
):
    return await department_service.get_departments(current_user)

@router.post("/{department_id}/members", response_model=schemas.DepartmentResponse)
async def add_member(
    department_id: str,
    body: schemas.DepartmentMemberAdd,
    current_user: models.User = Depends(auth.get_current_admin_user),
):
    return await department_service.add_member(department_id, body.user_id)

@router.get("/{department_id}/progress", response_model=schemas.DepartmentProgressResponse)
async def get_department_progress(
    department_id: str,
    current_user: models.User = Depends(auth.get_current_active_user),
):
    from core.permissions import can_view_department
    if not can_view_department(current_user, department_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to view this department's progress"
        )

    dept = await models.Department.get(department_id)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Fetch all users belonging to this department
    users = await models.User.find(models.User.department_id == department_id).to_list()
    user_ids = [str(u.id) for u in users]

    # Fetch all tasks assigned to those users
    tasks = await models.Task.find({"assigned_to": {"$in": user_ids}}).to_list()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    progress_percent = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

    per_member = []
    for user in users:
        # User tasks in this department
        user_tasks = [t for t in tasks if t.assigned_to == str(user.id)]

        task_counts = {"pending": 0, "in_progress": 0, "completed": 0, "in_review": 0}
        for t in user_tasks:
            task_counts[t.status] = task_counts.get(t.status, 0) + 1

        per_member.append({
            "username": user.username,
            "task_counts_by_status": task_counts,
            "tasks": [{"title": t.title, "status": t.status} for t in user_tasks]
        })

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress_percent": progress_percent,
        "per_member": per_member
    }

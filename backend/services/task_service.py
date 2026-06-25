from typing import List, Optional
from fastapi import HTTPException
import models
import schemas
from core.permissions import can_view_task, can_edit_task, can_view_department, can_delete_task

from datetime import timedelta
from models.user import get_utc_now

async def assemble_task_response(task: models.Task) -> schemas.TaskResponse:
    """Assembles a TaskResponse by fetching the task's submissions."""
    submissions = await models.TaskSubmission.find(models.TaskSubmission.task_id == str(task.id)).to_list()
    
    assigned_by_user = await models.User.get(task.assigned_by) if task.assigned_by else None
    assigned_by_username = assigned_by_user.username if assigned_by_user else None

    assigned_to_user = await models.User.get(task.assigned_to) if task.assigned_to else None
    assigned_to_username = assigned_to_user.username if assigned_to_user else None

    return schemas.TaskResponse(
        **task.model_dump(exclude={'id'}),
        id=str(task.id),
        assigned_by_username=assigned_by_username,
        assigned_to_username=assigned_to_username,
        submissions=[
            schemas.TaskSubmissionResponse(**{**s.model_dump(exclude={'id'}), 'id': str(s.id)})
            for s in submissions
        ]
    )

async def get_tasks(
    current_user: models.User,
    skip: int = 0,
    limit: int = 20,
    department_id: Optional[str] = None,
    assigned_to_me: bool = False,
    assigned_by_me: bool = False
) -> List[schemas.TaskResponse]:
    """Retrieves tasks based on user role and department scoping."""
    if current_user.status != "active":
        return []

    if assigned_by_me:
        seven_days_ago = get_utc_now() - timedelta(days=7)
        tasks = (
            await models.Task.find(
                models.Task.assigned_by == str(current_user.id),
                models.Task.created_at >= seven_days_ago
            )
            .sort(-models.Task.created_at)
            .to_list()
        )
    elif assigned_to_me:
        tasks = await models.Task.find(models.Task.assigned_to == str(current_user.id)).skip(skip).limit(limit).to_list()
    else:
        if department_id and not can_view_department(current_user, department_id):
            raise HTTPException(status_code=403, detail="Not authorized to view this department")

        if current_user.is_president or current_user.is_vice_president:
            if department_id:
                tasks = await models.Task.find(models.Task.department_id == department_id).skip(skip).limit(limit).to_list()
            else:
                tasks = await models.Task.find_all().skip(skip).limit(limit).to_list()
        elif current_user.role == "hod":
            user_dept = current_user.department_id
            if department_id and department_id != user_dept:
                raise HTTPException(status_code=403, detail="Not authorized to view other departments")
            tasks = await models.Task.find(models.Task.department_id == user_dept).skip(skip).limit(limit).to_list()
        else:
            # Regular member
            if department_id and department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="Not authorized to view other departments")
            tasks = await models.Task.find(models.Task.assigned_to == str(current_user.id)).skip(skip).limit(limit).to_list()
    
    return [await assemble_task_response(t) for t in tasks]

async def get_task_by_id(task_id: str, current_user: models.User) -> models.Task:
    """Gets a task by ID, enforcing access permissions."""
    task = await models.Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_view_task(current_user, task):
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    return task

async def create_task(task_in: schemas.TaskCreate, creator_id: str) -> schemas.TaskResponse:
    """Creates a new task. HODs assign to their own department; President/VP can specify any department."""
    creator = await models.User.get(creator_id)
    if not creator or creator.status != "active":
        raise HTTPException(status_code=403, detail="Inactive user cannot create tasks")
    if creator.role != "hod" and not (creator.is_president or creator.is_vice_president):
        raise HTTPException(status_code=403, detail="Only department HODs, President, or VP can create tasks")

    # Determine target department
    if creator.is_president or creator.is_vice_president:
        # President/VP may specify any department, or default to their own
        target_dept_id = task_in.department_id or creator.department_id
        if not target_dept_id:
            raise HTTPException(status_code=400, detail="Please specify a department for this task")
        # Verify the department exists
        dept = await models.Department.get(target_dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
    else:
        # Regular HODs assign to assignee's department first, or fall back to their own department
        target_dept_id = None
        if task_in.assigned_to:
            assignee = await models.User.get(task_in.assigned_to)
            if assignee:
                target_dept_id = assignee.department_id

        if not target_dept_id:
            if not creator.department_id:
                raise HTTPException(status_code=403, detail="You are not assigned to a department")
            target_dept_id = creator.department_id

    task_data = task_in.model_dump(exclude={"department_id"})
    db_task = models.Task(
        **task_data,
        assigned_by=creator_id,
        department_id=target_dept_id
    )
    await db_task.insert()
    return await assemble_task_response(db_task)

async def update_task(task_id: str, task_update: schemas.TaskUpdate, current_user: models.User) -> schemas.TaskResponse:
    """Updates task status or other fields based on permissions."""
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not can_edit_task(current_user, db_task) and not can_delete_task(current_user, db_task):
        # Check if the user is assigned to this task (to allow status changes)
        if db_task.assigned_to != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
        # User is assigned but not an HOD with edit permissions - only allowed to update status
        update_data = task_update.model_dump(exclude_unset=True)
        allowed_keys = {"status"}
        if any(k not in allowed_keys for k in update_data.keys()):
            raise HTTPException(status_code=403, detail="Not authorized to update task details other than status")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    await db_task.save()
    return await assemble_task_response(db_task)

async def delete_task(task_id: str, current_user: models.User):
    """Deletes a task and all its related TaskSubmission documents."""
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not can_delete_task(current_user, db_task):
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    # Cascade-delete all submissions tied to this task
    submissions = await models.TaskSubmission.find(
        models.TaskSubmission.task_id == task_id
    ).to_list()
    for submission in submissions:
        await submission.delete()

    await db_task.delete()
    return {"message": "Task deleted successfully"}

async def add_voice_note(task_id: str, file_url: str) -> schemas.TaskResponse:
    """Updates task voice note path."""
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db_task.voice_note_path = file_url
    await db_task.save()
    return await assemble_task_response(db_task)

async def add_attachment(task_id: str, file_url: str) -> schemas.TaskResponse:
    """Appends an attachment URL to a task."""
    db_task = await models.Task.get(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db_task.attachments.append(file_url)
    await db_task.save()
    return await assemble_task_response(db_task)


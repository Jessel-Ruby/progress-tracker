from typing import List
from fastapi import HTTPException
import models
import schemas

async def create_department(dept_in: schemas.DepartmentCreate, creator: models.User) -> schemas.DepartmentResponse:
    """Creates a new department. President/VP can create."""
    if not (creator.is_president or creator.is_vice_president or creator.role == "hod"):
        raise HTTPException(status_code=403, detail="Only HOD, President, or VP can create departments")

    db_dept = models.Department(
        name=dept_in.name,
        description=dept_in.description,
        owner_id=str(creator.id) if creator.role == "hod" else None,
        member_ids=[],
    )
    await db_dept.insert()

    return schemas.DepartmentResponse(
        **db_dept.model_dump(exclude={"id"}),
        id=str(db_dept.id),
    )

async def get_departments(user: models.User) -> List[schemas.DepartmentResponse]:
    """Retrieves departments visible to the current user."""
    if user.status != "active":
        return []

    if user.is_president or user.is_vice_president:
        # President/VP can see all departments
        departments = await models.Department.find_all().to_list()
    elif user.department_id:
        # HODs and members only see their own department
        dept = await models.Department.get(user.department_id)
        departments = [dept] if dept else []
    else:
        departments = []

    return [
        schemas.DepartmentResponse(
            **d.model_dump(exclude={"id"}),
            id=str(d.id),
        )
        for d in departments
    ]

async def list_public_departments() -> List[schemas.DepartmentResponse]:
    """Lists all departments publicly for signup selection."""
    departments = await models.Department.find_all().to_list()
    return [
        schemas.DepartmentResponse(
            **d.model_dump(exclude={"id"}),
            id=str(d.id),
        )
        for d in departments
    ]

async def add_member(department_id: str, target_user_id: str) -> schemas.DepartmentResponse:
    """Adds a user to the department's member list."""
    dept = await models.Department.get(department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    target_user = await models.User.get(target_user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user_id not in dept.member_ids:
        dept.member_ids.append(target_user_id)
        await dept.save()

    # Link the user to the department if not done already
    if target_user.department_id != department_id:
        target_user.department_id = department_id
        await target_user.save()

    return schemas.DepartmentResponse(
        **dept.model_dump(exclude={"id"}),
        id=str(dept.id),
    )


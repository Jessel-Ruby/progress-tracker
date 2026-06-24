from fastapi import APIRouter, Depends
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

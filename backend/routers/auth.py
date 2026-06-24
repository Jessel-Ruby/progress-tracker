from typing import List
from fastapi import APIRouter, Depends, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
import models, schemas
from core import auth
from services import auth_service
from utils.cloudinary import upload_to_cloudinary

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

limiter = Limiter(key_func=get_remote_address)

@router.post("/signup", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate):
    return await auth_service.signup_user(user)

@router.post("/login", response_model=schemas.Token)
@limiter.limit('10/minute')
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    return await auth_service.login_user(form_data)

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.get("/users", response_model=List[schemas.UserResponse])
async def list_users(skip: int = 0, limit: int = 20, current_user: models.User = Depends(auth.get_current_admin_user)):
    return await auth_service.list_users(skip, limit)

@router.get("/pending", response_model=List[schemas.UserResponse])
async def list_pending_users(current_user: models.User = Depends(auth.get_current_active_user)):
    return await auth_service.list_pending_users(current_user)

@router.post("/approve/{user_id}", response_model=schemas.UserResponse)
async def approve_user(user_id: str, current_user: models.User = Depends(auth.get_current_active_user)):
    return await auth_service.approve_user(user_id, current_user)

@router.post("/reject/{user_id}")
async def reject_user(user_id: str, current_user: models.User = Depends(auth.get_current_active_user)):
    return await auth_service.reject_user(user_id, current_user)

@router.post("/me/profile-image", response_model=schemas.UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    file_url = await upload_to_cloudinary(file, "document")
    current_user.profile_image = file_url
    await current_user.save()
    return current_user

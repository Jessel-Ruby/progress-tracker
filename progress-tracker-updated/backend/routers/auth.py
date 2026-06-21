from datetime import timedelta, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
import models, schemas, auth

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

limiter = Limiter(key_func=get_remote_address)

@router.post("/signup", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate):
    db_user = await models.User.find_one(models.User.email == user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = await models.User.find_one(models.User.username == user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = auth.get_password_hash(user.password)
    # Default to user role
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role="user"
    )
    await db_user.insert()
    return db_user


@router.post("/login", response_model=schemas.Token)
@limiter.limit('10/minute')
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await models.User.find_one(models.User.username == form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )

    # Streak tracking
    today = date.today()
    already_logged_today = user.last_login_date == today
    if not already_logged_today:
        yesterday = today - timedelta(days=1)
        if user.last_login_date == yesterday:
            user.streak += 1
        else:
            user.streak = 1
        user.last_login_date = today
        await user.save()
        await models.ActivityLog(
            user_id=str(user.id),
            activity_type="daily_login",
            points_earned=0
        ).insert()

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.get("/users", response_model=List[schemas.UserResponse])
async def list_users(skip: int = 0, limit: int = 20, current_user: models.User = Depends(auth.get_current_admin_user)):
    users = await models.User.find().skip(skip).limit(limit).to_list()
    return users

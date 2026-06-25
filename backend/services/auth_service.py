from datetime import date, timedelta
from typing import List, Dict, Any
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import models
import schemas
from core import auth
from services.gamification_service import award_xp
from models.user import get_utc_now

async def signup_user(user_in: schemas.UserCreate) -> models.User:
    """Signs up a new user, performing password strength, uniqueness, and department checks."""
    password_error = auth.validate_signup_password(user_in.password, user_in.username)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    db_user = await models.User.find_one(models.User.email == user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = await models.User.find_one(models.User.username == user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    if user_in.department_id:
        dept = await models.Department.get(user_in.department_id)
        if not dept:
            raise HTTPException(status_code=400, detail="Department not found")

    requested_role = user_in.requested_role or "member"
    role = "member"
    is_president = False
    is_vice_president = False
    
    if requested_role == "hod":
        role = "hod"
    elif requested_role == "president":
        role = "hod"
        is_president = True
    elif requested_role == "vp":
        role = "hod"
        is_vice_president = True

    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=role,
        department_id=user_in.department_id,
        is_president=is_president,
        is_vice_president=is_vice_president,
        status="pending"
    )
    await db_user.insert()
    return db_user

async def login_user(form_data: OAuth2PasswordRequestForm) -> Dict[str, str]:
    """Authenticates user credentials, processes the login streak, and generates a JWT."""
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

    # Streak tracking only for active users
    if user.status == "active":
        today = get_utc_now().date()
        already_logged_today = user.last_login_date == today
        if not already_logged_today:
            yesterday = today - timedelta(days=1)
            if user.last_login_date == yesterday:
                user.streak += 1
                xp_award = 10
            else:
                user.streak = 1
                xp_award = 5
            user.last_login_date = today
            await user.save()
            await award_xp(str(user.id), xp_award, "daily_login")

    return {"access_token": access_token, "token_type": "bearer"}

async def list_users(skip: int = 0, limit: int = 20) -> List[models.User]:
    """Lists users with pagination."""
    return await models.User.find().skip(skip).limit(limit).to_list()

async def list_pending_users(approver: models.User) -> List[models.User]:
    """Lists pending user requests for approval. Only President/VP can view."""
    if not (approver.is_president or approver.is_vice_president):
        raise HTTPException(status_code=403, detail="Only President or VP can view pending users")
    return await models.User.find(models.User.status == "pending").to_list()

async def approve_user(user_id: str, approver: models.User) -> models.User:
    """Approves a pending user signup. Only President/VP can call this."""
    if not (approver.is_president or approver.is_vice_president):
        raise HTTPException(status_code=403, detail="Only President or VP can approve users")
        
    user = await models.User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "active":
        raise HTTPException(status_code=400, detail="User is already active")
        
    user.status = "active"
    await user.save()
    
    # Add to department members list if department is set
    if user.department_id:
        dept = await models.Department.get(user.department_id)
        if dept:
            if user.role == "hod":
                dept.owner_id = str(user.id)
            if str(user.id) not in dept.member_ids:
                dept.member_ids.append(str(user.id))
            await dept.save()
            
    # Add activity log for signup/approval
    await models.ActivityLog(
        user_id=str(user.id),
        activity_type="account_activated",
        points_earned=0
    ).insert()
    
    # Notification
    await models.Notification(
        user_id=str(user.id),
        title="Account Approved! 🎉",
        message="Your account has been approved. You can now access your dashboard.",
        is_read=False
    ).insert()
    
    return user

async def reject_user(user_id: str, approver: models.User) -> Dict[str, str]:
    """Rejects (deletes) a pending user. Only President/VP can call this."""
    if not (approver.is_president or approver.is_vice_president):
        raise HTTPException(status_code=403, detail="Only President or VP can reject users")
        
    user = await models.User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "active":
        raise HTTPException(status_code=400, detail="Cannot reject already active users")
        
    await user.delete()
    return {"message": "User signup application rejected and removed"}

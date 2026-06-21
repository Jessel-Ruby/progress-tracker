from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import os

import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import models
import schemas

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or not SECRET_KEY.strip():
    raise RuntimeError(
        "SECRET_KEY is not set. Copy .env.example to .env and configure it, "
        "or set SECRET_KEY in your environment (e.g. Render dashboard)."
    )
SECRET_KEY = SECRET_KEY.strip()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, pool_password):
    return pwd_context.verify(plain_password, pool_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username, role=role)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await models.User.find_one(models.User.username == token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    return current_user

async def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

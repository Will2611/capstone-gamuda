import os
import inspect
import datetime
import jwt  # Make sure to run: pip install pyjwt[crypto]
from typing import Annotated, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.database.connection import db_dependency

# --- Secret Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "your-very-secure-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 Hours

_bearer = HTTPBearer(auto_error=False)

# --- Authentication Security Functions ---
def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a secure JSON Web Token for user sessions."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def get_current_user(
    db: db_dependency,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)] = None,
):
    """Resolve the authenticated UserModel from a Bearer JWT."""
    from src.database.models.user import UserModel

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        uid = UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id in token",
        ) from exc

    user = db.query(UserModel).filter(UserModel.id == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


CurrentUser = Annotated[object, Depends(get_current_user)]

# --- Existing Router Discovery Utility ---
def get_subcontrollers(dirname:str):
    current_frame = inspect.currentframe()
    routers:list[APIRouter] = []
    if current_frame is None:
        return routers
    # Get Folder
    prev_frame = current_frame.f_back
    if(prev_frame is None):
        return routers
    caller_name = prev_frame.f_globals.get("__name__")
    for f in os.listdir(dirname):
        # Reset/Init
        module_name=None
        moduleVar= None
        # Exclude self, where its only in __init__, and the file utils itself
        if f == "__init__.py" or f == "utils.py" :
            continue
        if os.path.isfile("%s/%s" % (dirname, f)) and f[-3:]=='.py':
            module_name=f[:-3]    
        elif os.path.isdir("%s/%s" % (dirname, f)) and os.path.isfile("%s/%s/__init__.py" % (dirname, f)):
            module_name=f
        # Only if module exists
        if(module_name is not None):
            moduleVar = __import__(f"{caller_name}.{module_name}", fromlist=[''])
            if not hasattr(moduleVar, 'router'):
                continue
            if isinstance(getattr(moduleVar, 'router'), APIRouter):
                routers.append((getattr(moduleVar, 'router')))
        
    return routers  
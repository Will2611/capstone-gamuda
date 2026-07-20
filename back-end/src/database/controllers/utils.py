import os
import inspect
import datetime
import jwt  # Make sure to run: pip install pyjwt[crypto]
from typing import Optional
from fastapi import APIRouter

# --- Secret Configuration ---
SECRET_KEY = "your-very-secure-secret-key"  # Switch to os.getenv("SECRET_KEY") in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 Hours

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
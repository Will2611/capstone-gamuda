from fastapi import Response, Request, Depends, HTTPException, WebSocket
from starlette.requests import HTTPConnection
import jwt
from typing import Optional, Union, cast, Annotated
from src.database.schemas.user import USER_ROLE_TYPE
import uuid_utils.compat as uuid
from pydantic import BaseModel
import os


TOKEN_NAME = "bitescout_token"
SECRET_KEY = os.getenv('COOKIE_SECRET')
ALGORITHM = 'HS256'
COOKIE_AGE = 60*15 #in seconds, 15 min
LONGER_COOKIE_AGE = 30 *24*60*60  #in seconds, 30 days
# Browsers reject Secure cookies on http://localhost — default off for local dev
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")

if not SECRET_KEY:
    raise ValueError("Generate Cookie_secret in .env with secrets.token_hex(32)")

class SessionToken(BaseModel):
    sessionId: uuid.UUID
    userId:Optional[uuid.UUID]
    role: Optional[USER_ROLE_TYPE]
    restuarantId:Optional[uuid.UUID]
    remember_me:bool

def encode_payload(payload:SessionToken)->str:
    if not SECRET_KEY:
        raise ValueError("Generate Cookie_secret in .env with secrets.token_hex(32)")
    return jwt.encode(
        cast(dict,payload.model_dump(mode='json')),
        SECRET_KEY,
        algorithm=ALGORITHM
        )
def decode_payload(token:str)->SessionToken:
    if not SECRET_KEY:
        raise ValueError("Generate Cookie_secret in .env with secrets.token_hex(32)")
    parsed = SessionToken.model_validate(
        jwt.decode(token,SECRET_KEY, algorithms=ALGORITHM)
        )
    return parsed

def default_session_generator()->SessionToken:
    return SessionToken(
        sessionId=uuid.uuid7(),
        userId=None,
        role=None,
        restuarantId=None,
        remember_me=False
    )

def setCookie(resp:Response, payload:SessionToken = default_session_generator()):
    """Resets/delete cookie if no cookie exists"""
    token = encode_payload(payload)
    resp.set_cookie(
        key=TOKEN_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none",
        max_age=LONGER_COOKIE_AGE if payload.remember_me else COOKIE_AGE
    )

def getCookiePayload(req: HTTPConnection):
    token: Optional[str] = req.cookies.get(TOKEN_NAME)
    if not token:
        return None
    try:
        cookie_payload  = decode_payload(token)
        return cookie_payload
    except Exception as e:
        raise HTTPException(status_code=400, detail='Invalid cookies')
    



def ensure_default_cookie(
    request: Request, 
    response: Response, 
):
    """
    Dependency to set a default cookie if it doesn't exist in the request.
    Only suitable for HTTP routes (not WebSockets).
    """
    try:
        parsed  = getCookiePayload(request) or default_session_generator()
        setCookie(response, parsed)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500,detail='Missing Cookie Secret')


def ws_safe_ensure_default_cookie(
    request: Request, 
    response: Response, 
):
    """
    WebSocket-safe wrapper that runs ensure_default_cookie only for HTTP connections.
    For WebSocket connections, the dependency resolver injects None for Response
    but still receives a Request object (Starlette wraps the WS scope into a
    Request-like object). We guard against that by checking scope type.
    """
    if request.scope.get("type") == "websocket":
        # Skip cookie logic for WebSocket connections
        try:
            return getCookiePayload(request) or default_session_generator()
        except Exception:
            return default_session_generator()
    return ensure_default_cookie(request, response)


CookieCustom = Annotated[SessionToken,Depends(ensure_default_cookie)]

# def jwt_default_cookie_decorator():
#     """
#     A decorator that sets a JWT cookie on the response.
#     Requires the endpoint to have a 'response: Response' argument.
#     """
#     def decorator(func):
#         @wraps(func)
#         async def wrapper(*args, response: Response, **kwargs):
#             # 1. Execute the original function to get result (and potentially a token)
#             result = await func(*args, response=response, **kwargs)
            
#             # 2. Generate or Retrieve Token 
#             # (Assuming we generate it here, or extract it from 'result' if needed)
#             token = jwt.encode(
#                 {"sub": "user123", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
#                 SECRET_KEY,
#                 algorithm="HS256"
#             )
            
            
#             # 3. Set the Cookie on the Response object
#             response.set_cookie(
#                 key="access_token",
#                 value=token,
#                 httponly=True,
#                 secure=True,
#                 samesite="lax",
#                 max_age=900
#             )
            
#             return result
#         return wrapper
#     return decorator

from pywebpush import webpush, Response as PushResponse
from src.database.schemas.user import UserSubscription
from types import CoroutineType
from typing import Any
import asyncio
import json
from dotenv import load_dotenv
import os
load_dotenv()
VAPID_PRIVATE_KEY=os.getenv("VAPID_PRIVATE_KEY",'')

async def webpush_single(singlePush:UserSubscription, payload:dict):
    if not VAPID_PRIVATE_KEY:
        raise ValueError('Missing VAPID_PRIVATE_KEY')
    # webpush_async for if deploy to live, needing ssl cert to be proper
    return webpush(
            subscription_info=singlePush.model_dump(),
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={'sub':"mailto:william.ongjiajiang@gmail.com"}
            )
    
    
async def webpush_list(notifications:list[UserSubscription], payload:dict):
    taskList: list[CoroutineType[Any,Any, str|PushResponse]]= []
    for r in notifications:
        taskList.append(webpush_single(singlePush=r,payload=payload))
        
    newList = await asyncio.gather(*taskList, return_exceptions=True)
    cleansed_list:list[UserSubscription] = []
    for index,suc in enumerate(newList):
        if isinstance(suc, BaseException):
            print('failed to push', index, suc)
            continue
        cleansed_list.append(notifications[index])
        print('succeeded to push', index)
    return cleansed_list
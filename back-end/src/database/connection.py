from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from google.cloud.sql.connector import Connector
from typing import Annotated
from dotenv import load_dotenv
import os


# Load variables from .env into the system environment
load_dotenv()
USE_LOCAL =os.getenv("USE_LOCAL", "TRUE")
#PostgrSQL connection details
DB_NAME=os.getenv("DB_NAME")
DB_USER= os.getenv("DB_USER", 'postgres') 
INSTANCE_CONNECTION_NAME = None if USE_LOCAL =="TRUE" else os.getenv("INSTANCE_CONNECTION_NAME", None)
DB_PASSWORD = os.getenv("CLOUD_PASSWORD", 'root') if INSTANCE_CONNECTION_NAME else os.getenv("DB_PASSWORD", 'root')

DB_HOST = os.getenv("DB_HOST")
DB_PORT=os.getenv("DB_PORT", '5432')


def get_conn():
    if(INSTANCE_CONNECTION_NAME is None):
        return None

    connector = Connector()
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        'pg8000',
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME
    )
    return conn

DATABASE_URL=f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}' if  (not INSTANCE_CONNECTION_NAME) else "postgresql+pg8000://"
Kwargs = {"pool_size":5,"max_overflow":10,"pool_timeout":30,"pool_recycle":1800} if (not INSTANCE_CONNECTION_NAME) else {'creator':get_conn}
engine = create_engine( DATABASE_URL,**Kwargs)

# pool_size (Default: 5): The number of connections to keep persistently in the pool.
# max_overflow (Default: 10): The number of additional connections allowed beyond pool_size during high demand.
# pool_timeout (Default: 30): The number of seconds to wait for a connection from the pool before raising an error.
# pool_recycle: The number of seconds after which a connection is automatically recycled (useful for preventing "lost connection" errors with MySQL/MariaDB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)

def drop_tables():
    Base.metadata.drop_all(bind=engine)
    

db_dependency = Annotated[Session, Depends(get_db)]


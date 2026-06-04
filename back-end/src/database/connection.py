from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Annotated
import os
from dotenv import load_dotenv


# Load variables from .env into the system environment
load_dotenv()
#PostgrSQL connection details
DB_USER= os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD") if (os.getenv("DB_PASSWORD") is None)  else 'root'
DB_HOST = os.getenv("DB_HOST")
DB_PORT=os.getenv("DB_PORT")
DB_NAME=os.getenv("DB_NAME")

DATABASE_URL=f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

engine = create_engine(DATABASE_URL,
                       pool_size=5,
                       max_overflow=10,
                       pool_timeout=30,
                       pool_recycle=1800)

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


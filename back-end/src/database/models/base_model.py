from sqlalchemy import  DateTime, func, Uuid, ARRAY, String
import uuid_utils.compat as uuid
from sqlalchemy.orm import mapped_column, Mapped
from datetime import datetime
from typing import List
import pygeohash as gh
from sqlalchemy.orm import MappedAsDataclass

# Example model for checker
# from pydantic import BaseModel, StrictInt, Field
# class BookRequest(BaseModel):
#     title: str= Field(min_length=3, max_length=1000)
#     author: str= Field(min_length=3, max_length=255)
#     published_year: StrictInt= Field(gt=1800, lt=2026)



# Is supposed to include in mixin, what is expected in a base class
class DBBaseModelTimeMixIn(MappedAsDataclass, kw_only=True):
    # id is manual, could be overwritten in case of is also Foreign Key in case of joint table inheritance
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), init=False)
    updated_at:Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), server_onupdate=func.now(), init=False)

class DBBaseModelIdMixin(MappedAsDataclass, kw_only=True):
        id:Mapped[uuid.UUID] = mapped_column(
            Uuid, 
            primary_key=True, 
            index=True, 
            default = uuid.uuid7,
            # server_default=func.uuidv7(),
            init=False
        )
class RestaurantDetailsTableMixin(MappedAsDataclass, kw_only=True):
    # Determine list 
    # its not default=[] in case of multiple instantiation and creating shared memory, JIC
    cuisine:Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    dietary:Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    ambience:Mapped[List[str]] = mapped_column(ARRAY(String), default=list) 

class GeohashHelper:
     @staticmethod
     def column_geohash_factory(latitude_column='latitude',longitude_column="longitude"):
        """Only use if is and SQLAlchemy class and have columns name latitude and longitude"""
        def arrow(context):
            current_param= context.get_current_parameters()
            recent_lat =  current_param.get(latitude_column)
            recent_long =  current_param.get(longitude_column )
            if recent_lat and recent_long:
                return gh.encode(latitude=recent_lat,longitude=recent_lat )
            return None
        return arrow
        


# -- Counts every occurrence of every tag across the entire table
# SELECT element, COUNT(*) as total_count
# FROM unnest((SELECT array_agg(cuisine) FROM clients)) as element
# GROUP BY element
# ORDER BY total_count DESC;   
# -- Or the below query
# SELECT tag, COUNT(*) as frequency
# FROM users, unnest(cuisine) as tag
# GROUP BY tag
# ORDER BY frequency DESC;

# from sqlalchemy import func, select, distinct
# # from sqlalchemy.orm import Session

# # # 1. Create the subquery that unnests the array
# # # "tag" becomes the alias for the exploded elements
# unique_tag_query = (select(
#      func.unnest(ClientModel.cuisine).label('tag'))
#     .subquery())

# # 2. Query the subquery to group and count
# stmt = (
#     select(unnest_query.c.tag, func.count().label('frequency'))
#     .group_by(unnest_query.c.tag)
#     .order_by(func.count().desc())
# )

# with Session(engine) as session:
#     results = session.execute(stmt).all()
    
#     for tag, count in results:
#         print(f"{tag}: {count}")   

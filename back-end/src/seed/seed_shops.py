import csv
from pathlib import Path

from src.database.connection import SessionLocal
from src.database.models.test import TestModel
from src.database.models.restaurants import RestaurantModel, DAYS_OF_WEEK_TYPE
import uuid_utils.compat as uuid
from typing import get_args, cast, TypedDict
import re
from zoneinfo import ZoneInfo
from .shifts_utils import splitShifts,testZoneInfoType
from .visibility_csv import VISBILITY_CSV_ROWS
import datetime
import random
from typing import Any
from faker import Faker
from src.database.models.visibility import (
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    ComplaintThemeModel,
    FootTrafficHourlyModel,
    FootTrafficDailyModel
)
from src.database.models.reviews import ReviewModel, SENTIMENT_TYPE
from .fake_reviews import ReviewProvider
from .fake_reviews import ReviewData
from src.database.schemas.visibility import FUNNEL_STAGES

fake = Faker()
fake.seed(12345)
random.seed(12345)
fake.add_provider(ReviewProvider)

CSV_PATH = Path(__file__).parent / "Restaurants_in_Kuala_Lumpur_159_records.csv"
names_with_visbility:list[str] = list(map(lambda x:x['name'], VISBILITY_CSV_ROWS))
IS_ALLOWED_DAY_TYPE = get_args(DAYS_OF_WEEK_TYPE)
def seed():
    db = SessionLocal()
    try:
        with CSV_PATH.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                shop = row_to_restaurant(row)
                db.add(shop)
                db.flush()
                if shop.name not in names_with_visbility:
                    continue
                visbility_index = names_with_visbility.index(shop.name)
                visbility_row = VISBILITY_CSV_ROWS[visbility_index]
                visbility, prev_visibility = row_to_visibility(row ,shop.id)
                db.add(visbility)
                db.add(prev_visibility)
                db.add_all(row_to_funnel(shop.id))
                
                db.add(row_to_platform_metric(row,shop.id))
                reviews, senti = random_reviews(shop.id)
                themes:ThemesSet ={'positive':set(), 'negative':set(), 'neutral':set()} 
                for r in reviews:
                    themes['negative'].update(r.theme["negative"])
                    themes['positive'].update(r.theme["positive"])
                    themes['neutral'].update(r.theme["neutral"])
                db.add_all(reviews)
                db.add(senti)
                db.flush()

                
        db.commit()
        print("Seed complete")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

today = datetime.date.today()
prev_month = today - datetime.timedelta(days=30)

def row_to_restaurant(row:dict[str|Any,str|Any]):
    cuisine = [r.strip() for r in str(row.get("Categories")).split(';')] if row.get("Categories") else []
    about = str(row.get("About")) if row.get("About") else "Misisng Description"
    address = [r.strip() for r in str(row.get("Fulladdress")).split(',')] if row.get("Fulladdress") else ["Misisng Address"]
    opening_hours = str(row.get("Opening Hours")) if row.get("Opening Hours") else "Misisng Hours"
    contact_no = re.sub(r'[^\d+]','',str(row.get("Phone"))) if row.get("Phone") and isinstance(row.get('Phone'),str) else None
    day_hour_pair = [list(map(lambda x:x.strip(),day.split('):'))) for day in opening_hours.split('],')]
    days_hour_dict = {} if opening_hours == "Misisng Hours" else cast(
        dict[DAYS_OF_WEEK_TYPE,str],
        {day.split('(')[0].strip():hour.split('[')[1] for day,hour in day_hour_pair if day.split('(')[0].strip() in IS_ALLOWED_DAY_TYPE})
    
    days_shift_dict:dict[DAYS_OF_WEEK_TYPE,list[tuple[datetime.time,datetime.time]]]={
        day:splitShifts(list(map(lambda x: x.replace(']',''),hour.split(',')))) for day,hour in days_hour_dict.items()
        }
    
    days_opened:list[DAYS_OF_WEEK_TYPE]=[day for day,hour in days_hour_dict.items() if hour.strip().lower()!='closed']
    
    timezone =str(row.get('Time Zone')).strip() if row.get('Time Zone') else None
    castTimeZone = cast(ZoneInfo, timezone) if testZoneInfoType(timezone) else None
    shop = RestaurantModel(
        name=row["Name"].strip(),
        rating=float(row["Average Rating"]) if row["Average Rating"] else None,
        cuisine= cuisine if row.get("Categories") else [],
        about=about,
        latitude=float(row["Latitude"]),
        longitude=float(row["Longitude"]),
        address=address,
        google_place_id=row.get("Place Id"),
        contact_no= contact_no,
        timezone=castTimeZone,
        timezone_offset=480,
        opening_hours_struct=days_shift_dict,
    )
    return shop

def row_to_visibility(row:dict[str|Any,str|Any], restaurant_id:uuid.UUID):
    visibility_score=round(random.uniform(50.0,100.0),2)
    social_engagement_rate=round(random.uniform(1.0,20.0),2)
    repeat_visit_rate=round(random.uniform(50.0,100.0),2)
    visibility  = VisibilityMetricsModel(
                recorded_at=today,
                average_rating=float(row["Average Rating"]) if row["Average Rating"] else 0.0,
                total_reviews=int(row["Review Count"]) if row["Review Count"] else 0,
                rating_source="Google",
                restaurant_id =restaurant_id,
                # visibility_score=visbility_row["visibility"],
                # social_engagement_rate=visbility_row["social_eng"],
                # repeat_visit_rate=visbility_row["repeat_visit"],
                visibility_score=visibility_score,
                social_engagement_rate=social_engagement_rate,
                repeat_visit_rate=repeat_visit_rate
            )
    prev_visibility_score = round((0.85 + (visibility_score / 200)), 2)
    prev_social = round(social_engagement_rate * prev_visibility_score, 2)
    prev_repeat = round(repeat_visit_rate * prev_visibility_score, 1)
    prev_visbility = VisibilityMetricsModel(
                recorded_at=prev_month,
                average_rating=float(row["Average Rating"]) if row["Average Rating"] else 0.0,
                total_reviews=max(int(row["Review Count"]) if row["Review Count"] else 0,0),
                rating_source="Google",
                restaurant_id =restaurant_id,
                visibility_score=prev_visibility_score,
                social_engagement_rate=prev_social,
                repeat_visit_rate=prev_repeat,
            )
    return visibility, prev_visbility


def row_to_funnel(restaurant_id:uuid.UUID):
    impressions = random.randint(10000,100000)
    clicks = min(random.randint(1000,9999), impressions)
    click_dir = min(random.randint(100,999), clicks)
    counts = [
                (FUNNEL_STAGES[0], impressions, 100.0, False),
                (FUNNEL_STAGES[1], clicks,
                 round(clicks / impressions * 100, 1), False),
                (FUNNEL_STAGES[2], click_dir,
                 round(click_dir /clicks * 100, 1), True),
            ]
    funnelStages:list[ FunnelStageModel] = []
    for name, cnt, conv, drop in counts:
        single_funnel_stage = FunnelStageModel(
            recorded_at=today,
            stage_name=name,
            count=cnt,
            conversion=conv,
            is_drop_off=drop,
            restaurant_id = restaurant_id
            )
        funnelStages.append(single_funnel_stage)
    return funnelStages

def row_to_platform_metric(row:dict[str|Any,str|Any], restaurant_id:uuid.UUID):
    social_engagement_rate=round(random.uniform(1.0,20.0),2)
    platform_metric =  SocialPlatformMetricsModel(
                recorded_at=today,
                platform="google",
                avg_rating=float(row["Average Rating"]) if row["Average Rating"] else 0.0,
                total_reviews=max(int(row["Review Count"]) if row["Review Count"] else 0,0),
                engagement_rate=round(social_engagement_rate * 0.6, 2),
                url="https://www.google.com/maps",
                restaurant_id=restaurant_id
            )
    return platform_metric
class ThemesSet(TypedDict):
    positive:set[str]
    negative:set[str]
    neutral:set[str]
def random_reviews(restaurant_id:uuid.UUID):
    reviews:list[ReviewModel] = []
    total =random.randint(10,25)
    themes:ThemesSet ={'positive':set(), 'negative':set(), 'neutral':set()} 
    for _ in range(total):
        result:tuple[SENTIMENT_TYPE,ReviewData] =  fake.positive_review()
        sentiment, single_review = result
        reviews.append(ReviewModel(restaurant_id=restaurant_id, content=single_review['content'],sentiment=sentiment,theme=single_review['sentiment'], stars=random.randint(1,5)))
    positive=sum(1 for r in reviews if r.sentiment=="Positive")
    negative=sum(1 for r in reviews if r.sentiment=="Negative")
    mixed=sum(1 for r in reviews if r.sentiment=="Mixed")
    neutral=sum(1 for r in reviews if r.sentiment=="Neutral")
    senti = SentimentDataModel(
        restaurant_id=restaurant_id,
        recorded_at=today,
        positive_pct=round(positive/total,1),
        negative_pct=round(negative/total,1),
        neutral_pct=round(neutral/total,1),
        mixed_pct=round(mixed/total,1),
        reviews=None,
        )
    return reviews, senti

if __name__ == "__main__":
    seed()

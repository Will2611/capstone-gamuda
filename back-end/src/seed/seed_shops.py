import csv
from pathlib import Path
import asyncio

from src.database.connection import SessionLocal, create_tables, drop_tables, engine
from src.database.migrate_visibility import ensure_visibility_schema
import src.database.models  # noqa: F401 — register all ORM tables before create_all
from src.database.models.test import TestModel
from src.database.models.restaurants import RestaurantModel, DAYS_OF_WEEK_TYPE
import uuid_utils.compat as uuid
from typing import get_args, cast
import re
from zoneinfo import ZoneInfo
from .shifts_utils import splitShifts,testZoneInfoType

import datetime
import random
from typing import Any
from faker import Faker
from src.database.models.visibility import (
    VisibilityMetricsModel,
    FunnelStageModel,
    SocialPlatformMetricsModel,
    SentimentDataModel,
    FootTrafficHourlyModel,
    SentimentThemeModel,
)
from src.database.models.reviews import ReviewModel, SENTIMENT_TYPE
from src.database.schemas.reviews import ThemesToReviewIds, SentimentModelValidation
from src.llm.sentiment_analyzer import analyze_reviews_batch
from .fake_reviews import ReviewProvider
from .fake_reviews import ReviewData, stars_for_sentiment
from src.database.schemas.visibility import FUNNEL_STAGES
import calendar
import os
year =2026
month=5
_, days_in_month = calendar.monthrange(year, month)
_, days_in_prev_month = calendar.monthrange(year, month-1)

# Define the precise boundaries of the month
start_date = datetime.datetime(year, month, 1, 0, 0, 0)
end_date = datetime.datetime(year, month, days_in_month, 23, 59, 59)
# Calculate total seconds between the start and end of the month
total_seconds = int((end_date - start_date).total_seconds())

weekday_list = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]


# Faker.seed(12345)
fake = Faker()
# random.seed(12345)
fake.add_provider(ReviewProvider)


def extract_dietary_tags(about: str, cuisine: list[str]) -> list[str]:
    dietary = []
    about_lower = about.lower()
    cuisine_lower = [c.lower() for c in cuisine]
    
    if (
        "halal" in about_lower 
        or "halal" in cuisine_lower 
        or "mamak" in cuisine_lower 
        or "indian muslim" in cuisine_lower
    ):
        dietary.append("Halal")
        
    if (
        "vegetarian" in about_lower 
        or "vegetarian" in cuisine_lower
    ):
        dietary.append("Vegetarian")
        
    if (
        "vegan" in about_lower 
        or "vegan" in cuisine_lower
    ):
        dietary.append("Vegan")
        
    if (
        "gluten-free" in about_lower 
        or "gluten free" in about_lower 
        or "gluten-free" in cuisine_lower
    ):
        dietary.append("Gluten-free")
        
    return dietary

CSV_PATH = Path(__file__).parent / "Restaurants_in_Kuala_Lumpur_159_records.csv"

IS_ALLOWED_DAY_TYPE = get_args(DAYS_OF_WEEK_TYPE)
def seed():
    fresh = os.getenv("SEED_FRESH", "true").lower() in ("1", "true", "yes")
    if fresh:
        print("Dropping and recreating database tables...")
        drop_tables()
    else:
        print("Creating database tables (if missing)...")
    create_tables()
    ensure_visibility_schema(engine)
    use_llm = os.getenv("SEED_USE_LLM", "").lower() in ("1", "true", "yes")
    if use_llm:
        print("Tables ready. Seeding with VADER + LLM on conflicts...")
    else:
        print("Tables ready. Seeding with VADER-only analysis (set SEED_USE_LLM=true for Gemini)...")
    db = SessionLocal()
    try:
        with CSV_PATH.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                shop = row_to_restaurant(row)
                db.add(shop)
                db.flush()
                
                visbility, prev_visibility = row_to_visibility(row ,shop.id)
                db.add(visbility)
                db.add(prev_visibility)
                funnel_stages = row_to_funnel(shop.id)
                db.add_all(funnel_stages)
                
                db.add(row_to_platform_metric(row,shop.id))
                reviews = random_reviews(shop.id)
                reviews, analysis_stats = enrich_reviews_with_analysis(reviews, use_llm=use_llm)
                senti = build_sentiment_data(reviews, shop.id)
                if analysis_stats.get("llm"):
                    print(
                        f"  {shop.name}: {analysis_stats['llm']} conflict(s) resolved by LLM "
                        f"({analysis_stats.get('conflicts', 0)} total conflicts)"
                    )
                db.add_all(reviews)
                db.add(senti)
                db.flush()
                themes=ThemesToReviewIds(positive={}, negative={}, neutral={})
                for r in reviews:
                    for negative in r.theme.negative:
                        themes.negative.setdefault(negative.strip().lower(),[]).append(r.id)
                    for positive in r.theme.positive:
                        themes.positive.setdefault(positive.strip().lower(),[]).append(r.id)
                    for neutral in r.theme.neutral:
                        themes.neutral.setdefault(neutral.strip().lower(),[]).append(r.id)
                sentiment_themes = sentiment_theme_from_reviews(themes,senti.id)
                db.add_all(sentiment_themes)
                foot_traffic = foot_traffic_generation(shop.id,funnel_stages[-1].count)
                db.add_all(foot_traffic)
                db.flush()

                
        db.commit()
        print("Seed complete")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

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
    
    
    timezone =str(row.get('Time Zone')).strip() if row.get('Time Zone') else None
    castTimeZone = cast(ZoneInfo, timezone) if testZoneInfoType(timezone) else None
    shop = RestaurantModel(
        name=row["Name"].strip(),
        rating=float(row["Average Rating"]) if row["Average Rating"] else None,
        cuisine= cuisine if row.get("Categories") else [],
        dietary=extract_dietary_tags(about, cuisine),
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
                recorded_at=end_date,
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
                recorded_at=datetime.date(year,month-1,1),
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
    impressions = random.randint(100000,1000000)
    clicks = min(random.randint(10000,99999), impressions)
    click_dir = min(random.randint(1000,10000), clicks)
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
            recorded_at=end_date,
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
                recorded_at=end_date,
                platform="google",
                avg_rating=float(row["Average Rating"]) if row["Average Rating"] else 0.0,
                total_reviews=max(int(row["Review Count"]) if row["Review Count"] else 0,0),
                engagement_rate=round(social_engagement_rate * 0.6, 2),
                url="https://www.google.com/maps",
                restaurant_id=restaurant_id
            )
    return platform_metric


def random_reviews(restaurant_id:uuid.UUID):
    reviews:list[ReviewModel] = []
    total =random.randint(10,50)
    for _ in range(total):
        random_seconds = random.randint(0, total_seconds)
        random_datetime = start_date + datetime.timedelta(seconds=random_seconds)
        result:tuple[SENTIMENT_TYPE,ReviewData] =  fake.any_review()
        sentiment, single_review = result
        star_override = single_review.get("stars")
        review_row  =ReviewModel(
            restaurant_id=restaurant_id,
            content=single_review['content'],
            sentiment=sentiment,
            theme=single_review['sentiment'],
            stars=stars_for_sentiment(sentiment, star_override),
        )
        review_row.created_at = random_datetime
        review_row.id= uuid.uuid7(int(random_datetime.timestamp()))
        reviews.append(review_row)
    return reviews


def build_sentiment_data(reviews: list[ReviewModel], restaurant_id: uuid.UUID) -> SentimentDataModel:
    total = len(reviews)
    positive = sum(1 for r in reviews if r.sentiment == "Positive")
    negative = sum(1 for r in reviews if r.sentiment == "Negative")
    mixed = sum(1 for r in reviews if r.sentiment == "Mixed")
    neutral = sum(1 for r in reviews if r.sentiment == "Neutral")
    senti = SentimentDataModel(
        restaurant_id=restaurant_id,
        recorded_at=end_date,
        positive_pct=round(100 * positive / total, 1),
        negative_pct=round(100 * negative / total, 1),
        neutral_pct=round(100 * neutral / total, 1),
        mixed_pct=round(100 * mixed / total, 1),
    )
    senti.created_at = end_date
    return senti


def _theme_from_analysis(sentiment: str, theme: str) -> SentimentModelValidation:
    if sentiment == "Positive":
        return SentimentModelValidation(positive=[theme], negative=[], neutral=[])
    if sentiment == "Negative":
        return SentimentModelValidation(negative=[theme], positive=[], neutral=[])
    return SentimentModelValidation(neutral=[theme], positive=[], negative=[])


async def _analyze_reviews_async(
    reviews: list[ReviewModel],
    *,
    use_llm: bool,
) -> tuple[list[ReviewModel], dict]:
    pending = [{"text": r.content, "rating": r.stars} for r in reviews]
    analyzed, stats = await analyze_reviews_batch(pending, use_llm=use_llm)
    for review, result in zip(reviews, analyzed):
        sentiment = result.get("sentiment")
        theme = result.get("theme")
        if sentiment in ("Positive", "Negative", "Neutral") and theme:
            review.sentiment = sentiment
            review.theme = _theme_from_analysis(sentiment, theme)
    return reviews, stats


def enrich_reviews_with_analysis(
    reviews: list[ReviewModel],
    *,
    use_llm: bool = False,
) -> tuple[list[ReviewModel], dict]:
    """Run VADER analysis on reviews; pass use_llm=True to invoke LLM on conflicts."""
    return asyncio.run(_analyze_reviews_async(reviews, use_llm=use_llm))

def sentiment_theme_from_reviews(theme_set:ThemesToReviewIds, senti_data_id:uuid.UUID):
    sentiment_themes_list:list[SentimentThemeModel] = []
    for neg_key, neg_list in theme_set.negative.items():
        sentiment_themes_list.append(
            SentimentThemeModel(
                sentiment_id=senti_data_id,
                sentiment_type='Negative',
                theme=neg_key,
                count=len(neg_list),
                review_ids=neg_list
                )
            )
    for pos_key, pos_list in theme_set.positive.items():
        sentiment_themes_list.append(
            SentimentThemeModel(
                sentiment_id=senti_data_id,
                sentiment_type='Positive',
                theme=pos_key,
                count=len(pos_list),
                review_ids=pos_list
                )
            )
    for netl_key, netl_list in theme_set.neutral.items():
        sentiment_themes_list.append(
            SentimentThemeModel(
                sentiment_id=senti_data_id,
                sentiment_type='Neutral',
                theme=netl_key,
                count=len(netl_list),
                review_ids=netl_list
                )
            )

    return sentiment_themes_list
def foot_traffic_generation(restaurant_id:uuid.UUID, limit:int):
    foot_traffic_hour:list[FootTrafficHourlyModel] = []
    day_traffic = random_ints_with_sum(days_in_month,limit,15)
    for day_index,day_visits in enumerate(day_traffic):
        before_eight = random.randint(0,1)
        after_nine = random.randint(0,1)
        a_traffics = random_ints_with_sum(13+before_eight+after_nine,day_visits)
        offset = 8 -before_eight
        day = datetime.date(year, month, day_index+1)
        for hour_index,visitors in enumerate(a_traffics):
            foot_traffic_hour.append(FootTrafficHourlyModel(
                restaurant_id=restaurant_id,
                hour=hour_index+offset,
                traffic_date=day,
                visitors=visitors,
                day_name=weekday_list[day.isoweekday()-1],
                day_type='Weekend' if day.isoweekday()>5 else 'Weekday'
            ))
    return foot_traffic_hour
def random_ints_with_sum(split:int, total:int, min=1):
    # Method: Generate n-1 random dividers in range [1, total-1]
    excess_remainder = total-(min-1)*split
    if(excess_remainder<split):
        raise ValueError(f'Min too big, or cannot split easily{split,total,min}')
    dividers = sorted(random.sample(range(1, excess_remainder), split - 1))
    # Calculate differences between consecutive dividers (including 0 and total)
    zipped= zip(dividers + [total], [0] + dividers)
    tuples = [(a,b) for a,b in zipped]
    return [min-1 + a - b for a, b in tuples]
if __name__ == "__main__":
    seed()

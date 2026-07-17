import csv
from pathlib import Path

from src.database.connection import SessionLocal
from src.database.models.test import TestModel
from src.database.models.restaurants import RestaurantModel, DAYS_OF_WEEK_TYPE
from typing import get_args, cast
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from .shifts_utils import parse_time_ranges_no_regex
import datetime

def testZoneInfoType(input:str|None)->bool:
    if not input:
        return False
    try:
        ZoneInfo(input)
        return True
    except ZoneInfoNotFoundError:
        return False




def splitShifts(shifts:list[str])->list[tuple[datetime.time,datetime.time]]:
    
    if shifts[0].strip().lower()=='closed':
        return []
    if shifts[0].strip()=="Open 24 hours":
        return [(datetime.time(0,0), datetime.time(23,59))]
    return parse_time_ranges_no_regex(shifts)
    

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
a =  "Wednesday(2026-06-24): [6–11 PM], Thursday(2026-06-25): [6–11 PM], Friday(2026-06-26): [6–11 PM], Saturday(2026-06-27): [6–11 PM], Sunday(2026-06-28): [6–11 PM], Monday(2026-06-29): [Closed], Tuesday(2026-06-30): [6–11 PM]"
IS_ALLOWED_DAY_TYPE = get_args(DAYS_OF_WEEK_TYPE)
def seed():
    db = SessionLocal()
    try:
        with CSV_PATH.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
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
                    dietary=extract_dietary_tags(about, cuisine),
                    about=about,
                    latitude=float(row["Latitude"]),
                    longitude=float(row["Longitude"]),
                    address=address,
                    # opening_hours=opening_hours,
                    google_place_id=row.get("Place Id"),
                    contact_no= contact_no,
                    timezone=castTimeZone,
                    timezone_offset=480,
                    opening_hours_struct=days_shift_dict,
                    # start_time=None,
                    # close_time=None,
                    # days_opened=days_opened,
                )
                db.add(shop)
        db.commit()
        print("Seed complete")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
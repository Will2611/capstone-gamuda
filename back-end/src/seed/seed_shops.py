import csv
from pathlib import Path

from src.database.connection import SessionLocal
from src.database.models.test import TestModel
from src.database.models.restaurants import RestaurantModel
import re

CSV_PATH = Path(__file__).parent / "Restaurants_in_Kuala_Lumpur_159_records.csv"

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
                shop = RestaurantModel(
                    name=row["Name"].strip(),
                    rating=float(row["Average Rating"]) if row["Average Rating"] else None,
                    cuisine= cuisine if row.get("Categories") else [],
                    about=about,
                    latitude=float(row["Latitude"]),
                    longitude=float(row["Longitude"]),
                    address=address,
                    opening_hours=opening_hours,
                    google_place_id=row.get("Place Id"),
                    contact_no= contact_no,
                    timezone=None,
                    start_time=None,
                    close_time=None,
                    days_opened=[]
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
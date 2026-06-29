import csv
from pathlib import Path

from src.database.connection import SessionLocal
from src.database.schemas.test import TestModel

CSV_PATH = Path(__file__).parent / "Restaurants_in_Kuala_Lumpur_159_records.csv"

def seed():
    db = SessionLocal()
    try:
        with CSV_PATH.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                shop = TestModel(
                    name=row["Name"].strip(),
                    rating=float(row["Average Rating"]) if row["Average Rating"] else None,
                    cuisine=row["Categories"].split(";")[0].strip() if row.get("Categories") else None,
                    about=row.get("About"),
                    latitude=float(row["Latitude"]),
                    longitude=float(row["Longitude"]),
                    address=row.get("Fulladdress"),
                    opening_hours=row.get("Opening Hours"),
                    type="red",
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
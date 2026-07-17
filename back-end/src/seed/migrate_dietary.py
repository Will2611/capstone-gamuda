import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.database.connection import SessionLocal
from src.database.models.restaurants import RestaurantModel

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

def migrate():
    db = SessionLocal()
    try:
        restaurants = db.query(RestaurantModel).all()
        updated_count = 0
        for r in restaurants:
            tags = extract_dietary_tags(r.about, r.cuisine)
            if tags != r.dietary:
                r.dietary = tags
                updated_count += 1
        db.commit()
        print(f"Migration completed successfully. Updated dietary tags for {updated_count} restaurants.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

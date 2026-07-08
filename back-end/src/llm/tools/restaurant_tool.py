from langchain_core.tools import tool
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from src.database.models.restaurants import RestaurantModel

def make_restaurant_search_tool(db: Session):
    @tool
    def search_restaurants_by_cuisine(cuisine: str, limit: int = 3) -> list[dict]:
        """
        Search the food_db shops table for restaurants matching a cuisine type.
        Returns top restaurants by highest rating.
        Example cuisine values: Japanese, Malaysian, Italian, Indian.
        """
        rows = (
            db.query(RestaurantModel)
            .filter(func.array_to_string(RestaurantModel.cuisine, ',').ilike(f"%{cuisine.strip()}%"))
            .filter(RestaurantModel.rating.isnot(None))
            .order_by(desc(RestaurantModel.rating))
            .limit(limit)
            .all()
        )

        # rows = (
        #     db.query(TestModel)
        #     .filter(TestModel.cuisine.ilike(f"%{cuisine.strip()}%"))
        #     .filter(TestModel.rating.isnot(None))
        #     .order_by(desc(TestModel.rating))
        #     .limit(limit)
        #     .all()
        # )
        
        return [
            {
                "id":r.id,
                "name":r.name,
                "cuisine":','.join([str(r.cuisine)]),
                "rating":r.rating,
                "address":','.join([str(r.address)]),
                "latitude":r.latitude,
                "longitude":r.longitude,
            }
            for r in rows
        ]

    return search_restaurants_by_cuisine

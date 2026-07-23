import os
import requests
import pygeohash as gh
import time
from typing import List, Dict, Any
from fastapi import HTTPException

from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

# Global rate limiting for external API calls to avoid API key exhaustion
# Limit: at most 5 external search calls per 60 seconds
EXTERNAL_API_LIMIT = 5
EXTERNAL_API_WINDOW = 60.0

_external_api_calls: List[float] = []

class ExternalRateLimitException(HTTPException):
    def __init__(self, detail: str = "External search rate limit exceeded. Please try again in a few moments."):
        super().__init__(status_code=429, detail=detail)

def enforce_external_rate_limit() -> None:
    global _external_api_calls
    now = time.time()
    # Filter out calls older than the window
    _external_api_calls = [t for t in _external_api_calls if now - t < EXTERNAL_API_WINDOW]
    if len(_external_api_calls) >= EXTERNAL_API_LIMIT:
        raise ExternalRateLimitException()
    _external_api_calls.append(now)

def get_env_var(name: str, default: str = None) -> str:
    return os.getenv(name, default)

def search_external_restaurants(cuisine: str, latitude: float, longitude: float, radius: int = 10000) -> List[Dict[str, Any]]:
    """
    Searches for restaurants of a specific cuisine within a given radius using Google Places or SerpAPI.
    Returns normalized dictionaries ready to be inserted into the database.
    """
    enforce_external_rate_limit()

    provider = get_env_var("PLACES_PROVIDER", "serpapi")
    google_key = get_env_var("GOOGLE_PLACES_API_KEY")
    serpapi_key = get_env_var("SERPAPI_API_KEY")
    
    if provider == "google" and google_key:
        try:
            return search_google_places(cuisine, latitude, longitude, radius, google_key)
        except Exception as e:
            print(f"Google Places API search failed: {e}. Falling back to SerpAPI if available.")
            if serpapi_key:
                return search_serpapi(cuisine, latitude, longitude, radius, serpapi_key)
    elif provider == "serpapi" and serpapi_key:
        try:
            return search_serpapi(cuisine, latitude, longitude, radius, serpapi_key)
        except Exception as e:
            print(f"SerpAPI search failed: {e}. Falling back to Google Places if available.")
            if google_key:
                return search_google_places(cuisine, latitude, longitude, radius, google_key)
    
    # If no providers configured or both failed, return empty list
    return []
    
    # If no providers configured or both failed, return empty list
    return []

def search_google_places(cuisine: str, latitude: float, longitude: float, radius: int, key: str) -> List[Dict[str, Any]]:
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{latitude},{longitude}",
        "radius": radius,
        "keyword": f"{cuisine} restaurant",
        "type": "restaurant",
        "key": key
    }
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    results = data.get("results", [])
    normalized = []
    for place in results:
        # Ignore places without coordinates or place_id
        place_id = place.get("place_id")
        loc = place.get("geometry", {}).get("location", {})
        lat = loc.get("lat")
        lng = loc.get("lng")
        if not place_id or lat is None or lng is None:
            continue
            
        normalized.append(normalize_google_place(place, cuisine, lat, lng))
    return normalized

def normalize_google_place(place: dict, cuisine: str, lat: float, lng: float) -> dict:
    place_id = place.get("place_id")
    name = place.get("name")
    vicinity = place.get("vicinity")
    address = [vicinity] if vicinity else None
    
    rating = place.get("rating")
    if rating is not None:
        rating = float(rating)
        
    review_count = place.get("user_ratings_total")
    price_level = place.get("price_level")
    business_status = place.get("business_status")
    
    photos = []
    if "photos" in place:
        for p in place["photos"]:
            photo_ref = p.get("photo_reference")
            if photo_ref:
                photos.append(photo_ref)
                
    geohash = gh.encode(lat, lng)
    
    return {
        "google_place_id": place_id,
        "name": name,
        "cuisine": [cuisine],
        "latitude": lat,
        "longitude": lng,
        "geohash": geohash,
        "address": address,
        "rating": rating,
        "review_count": review_count,
        "price_level": price_level,
        "business_status": business_status,
        "photos": photos,
        "source": "Google Places",
        "about": "No description available.",
        "timezone_offset": 480
    }

def search_serpapi(cuisine: str, latitude: float, longitude: float, radius: int, key: str) -> List[Dict[str, Any]]:
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps",
        "q": f"{cuisine} restaurant",
        "ll": f"@{latitude},{longitude},14z",
        "type": "search",
        "api_key": key
    }
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    results = data.get("local_results", [])
    normalized = []
    for place in results:
        place_id = place.get("place_id")
        gps = place.get("gps_coordinates", {})
        lat = gps.get("latitude")
        lng = gps.get("longitude")
        if not place_id or lat is None or lng is None:
            continue
            
        normalized.append(normalize_serpapi_place(place, cuisine, lat, lng))
    return normalized

def normalize_serpapi_place(place: dict, cuisine: str, lat: float, lng: float) -> dict:
    place_id = place.get("place_id")
    name = place.get("title")
    address_str = place.get("address")
    address = [address_str] if address_str else None
    
    rating = place.get("rating")
    if rating is not None:
        rating = float(rating)
        
    review_count = place.get("reviews")
    price_level = None
    price_str = place.get("price")
    if price_str:
        # e.g., "$$" length is 2
        price_level = len(price_str)
        
    phone_number = place.get("phone")
    website = place.get("website")
    
    summary = place.get("description") or place.get("snippet") or "No description available."
    
    photos = []
    thumbnail = place.get("thumbnail")
    if thumbnail:
        photos.append(thumbnail)
        
    geohash = gh.encode(lat, lng)
    
    return {
        "google_place_id": place_id,
        "name": name,
        "cuisine": [cuisine],
        "latitude": lat,
        "longitude": lng,
        "geohash": geohash,
        "address": address,
        "rating": rating,
        "review_count": review_count,
        "price_level": price_level,
        "business_status": "OPERATIONAL",
        "contact_no": phone_number,
        "website": website,
        "summary": summary,
        "about": summary,
        "photos": photos,
        "source": "SerpAPI",
        "timezone_offset": 480
    }

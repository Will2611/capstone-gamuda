"""Unit tests for restaurant search refinements (rate limiting, DB prioritization, and slicing limits)."""
import datetime
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

import src.services.external_search as ext_search
from src.services.external_search import (
    enforce_external_rate_limit,
)
from src.services.restaurant_retrieval import (
    _external_mutual_fill,
    retrieve_top_restaurants_for_pair,
)


def test_rate_limiter():
    # Clear rate limit bucket
    ext_search._external_api_calls.clear()

    # Call enforce_external_rate_limit 5 times, should pass
    for _ in range(5):
        enforce_external_rate_limit()

    # 6th call should raise HTTPException with 429
    with pytest.raises(HTTPException) as excinfo:
        enforce_external_rate_limit()
    assert excinfo.value.status_code == 429


def test_external_mutual_fill_needed_slice():
    db_mock = MagicMock()

    # Mock search_external_restaurants to return a list of 10 items
    dummy_external_results = [
        {"google_place_id": f"place_{i}", "name": f"Restaurant {i}", "cuisine": ["Italian"]}
        for i in range(10)
    ]

    # Mock DB query to check existing place IDs and names
    # First query check existing place_ids: let's return place_0 and place_1
    # Second query check existing names: let's return "Restaurant 0" and "Restaurant 1"
    query_mock = db_mock.query.return_value.filter.return_value.all
    query_mock.side_effect = [
        [("place_0",), ("place_1",)],
        [("Restaurant 0",), ("Restaurant 1",)]
    ]

    with patch("src.services.restaurant_retrieval.search_external_restaurants", return_value=dummy_external_results) as mock_search, \
         patch("src.services.restaurant_retrieval._upsert_deduped") as mock_upsert:

        # We need 3 fresh restaurants
        _external_mutual_fill(
            db_mock,
            shared_cuisine=["Italian"],
            mid_lat=3.1390,
            mid_lng=101.6869,
            pull_radius=10.0,
            needed=3
        )

        # Verify search was called
        mock_search.assert_called_once()

        # Verify upsert was called with exactly 3 fresh items: place_2, place_3, place_4
        # (place_0 and place_1 were skipped as they were in existing_pids/existing_names)
        mock_upsert.assert_called_once()
        called_args = mock_upsert.call_args[0][1]
        assert len(called_args) == 3
        assert called_args[0]["google_place_id"] == "place_2"
        assert called_args[1]["google_place_id"] == "place_3"
        assert called_args[2]["google_place_id"] == "place_4"


def test_retrieve_top_restaurants_local_db_priority():
    db_mock = MagicMock()

    client_a = MagicMock()
    client_a.recent_latitude = 3.1390
    client_a.recent_longitude = 101.6869
    client_a.cuisine = ["Italian"]
    client_a.dietary = []
    client_a.distance_limit = 10
    client_a.price_limit = []

    client_b = MagicMock()
    client_b.recent_latitude = 3.1391
    client_b.recent_longitude = 101.6870
    client_b.cuisine = ["Italian"]
    client_b.dietary = []
    client_b.distance_limit = 10
    client_b.price_limit = []

    # Mock _score_local to return 2 scored candidates
    dummy_scored = [
        ((4.5, 100, -0.1, 1.0, 0.5), {"id": "res_1", "name": "Local Italian 1"}),
        ((4.2, 50, -0.2, 1.0, 0.5), {"id": "res_2", "name": "Local Italian 2"}),
    ]

    with patch("src.services.restaurant_retrieval._score_local", return_value=dummy_scored), \
         patch("src.services.restaurant_retrieval._external_mutual_fill") as mock_external_fill:

        results = retrieve_top_restaurants_for_pair(
            db_mock,
            client_a,
            client_b,
            on_date=datetime.date(2026, 7, 26),
            meeting_time=datetime.time(19, 0),
            window_end=datetime.time(21, 0),
            top_k=5
        )

        # Since there are local DB results, external fill MUST NOT be called!
        mock_external_fill.assert_not_called()
        assert len(results) == 2
        assert results[0]["id"] == "res_1"
        assert results[1]["id"] == "res_2"

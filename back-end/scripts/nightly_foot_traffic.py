"""
Minimal nightly job — aggregate Visit trackers into foot_traffic_hourly.

Flow:
  trackers (Visit) → filter by date window → hourly counts → upsert foot_traffic_hourly

Only restaurant+date pairs that have Visit events are rewritten.
Dates with no Visits keep existing seeded hourly rows (safe for demos).

Run from back-end/:
  python scripts/nightly_foot_traffic.py
  python scripts/nightly_foot_traffic.py --days 7
  python scripts/nightly_foot_traffic.py --days 1 --dry-run
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import and_

from src.database.connection import SessionLocal, engine
from src.database.migrate_visibility import ensure_visibility_schema
from src.database.models.trackers import TrackerModel
from src.database.models.visibility import FootTrafficHourlyModel
from src.database.traffic_analytics import (
    aggregate_visits_by_hour,
    day_name_and_type,
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Aggregate Visit trackers into foot_traffic_hourly.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=1,
        help="How many calendar days ending yesterday to process (default: 1 = yesterday only).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print counts without writing to the database.",
    )
    return parser.parse_args()


def _window(days: int) -> tuple[datetime, datetime, date, date]:
    """Inclusive date window ending yesterday (typical nightly)."""
    if days < 1:
        raise ValueError("--days must be >= 1")
    today = date.today()
    end_date = today - timedelta(days=1)
    start_date = end_date - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time())
    # Exclusive upper bound: start of today (UTC-naive, matches server_default timestamps)
    end_dt = datetime.combine(today, datetime.min.time())
    return start_dt, end_dt, start_date, end_date


def run_nightly(*, days: int = 1, dry_run: bool = False) -> dict[str, int]:
    ensure_visibility_schema(engine)
    start_dt, end_dt, start_date, end_date = _window(days)

    db = SessionLocal()
    stats = {
        "visit_events": 0,
        "buckets": 0,
        "restaurant_days": 0,
        "rows_written": 0,
        "rows_deleted": 0,
    }

    try:
        visit_rows = (
            db.query(TrackerModel.restaurant_id, TrackerModel.created_at)
            .filter(
                TrackerModel.tracked_type == "Visit",
                TrackerModel.created_at >= start_dt,
                TrackerModel.created_at < end_dt,
            )
            .all()
        )
        stats["visit_events"] = len(visit_rows)

        if not visit_rows:
            print(
                f"No Visit trackers between {start_date} and {end_date}. "
                "Seeded foot_traffic_hourly left unchanged."
            )
            return stats

        counts = aggregate_visits_by_hour(
            (row.restaurant_id, row.created_at) for row in visit_rows
        )
        stats["buckets"] = len(counts)

        by_restaurant_day: dict[tuple, dict[int, int]] = defaultdict(dict)
        for (restaurant_id, traffic_date, hour), visitors in counts.items():
            by_restaurant_day[(restaurant_id, traffic_date)][hour] = visitors

        stats["restaurant_days"] = len(by_restaurant_day)

        print(
            f"Window {start_date} → {end_date}: "
            f"{stats['visit_events']} Visits → "
            f"{stats['buckets']} hour buckets across "
            f"{stats['restaurant_days']} restaurant-days"
        )

        if dry_run:
            for (restaurant_id, traffic_date), hours in sorted(
                by_restaurant_day.items(),
                key=lambda item: (str(item[0][0]), item[0][1]),
            ):
                total = sum(hours.values())
                print(
                    f"  [dry-run] {restaurant_id} {traffic_date}: "
                    f"{total} visitors across {len(hours)} hours"
                )
            return stats

        for (restaurant_id, traffic_date), hour_counts in by_restaurant_day.items():
            deleted = (
                db.query(FootTrafficHourlyModel)
                .filter(
                    and_(
                        FootTrafficHourlyModel.restaurant_id == restaurant_id,
                        FootTrafficHourlyModel.traffic_date == traffic_date,
                    )
                )
                .delete(synchronize_session=False)
            )
            stats["rows_deleted"] += int(deleted or 0)

            day_name, day_type = day_name_and_type(traffic_date)
            for hour, visitors in sorted(hour_counts.items()):
                db.add(
                    FootTrafficHourlyModel(
                        restaurant_id=restaurant_id,
                        traffic_date=traffic_date,
                        day_name=day_name,
                        day_type=day_type,
                        hour=hour,
                        visitors=visitors,
                    )
                )
                stats["rows_written"] += 1

        db.commit()
        print(
            f"Upsert complete: deleted {stats['rows_deleted']} old rows, "
            f"wrote {stats['rows_written']} hourly rows. "
            f"Ran at {datetime.now(timezone.utc).isoformat()}"
        )
        return stats
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    args = _parse_args()
    run_nightly(days=args.days, dry_run=args.dry_run)

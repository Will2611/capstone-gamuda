"""Rule-based foot traffic analytics — chart and insights from per-date hourly counts."""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from src.database.schemas.visibility import ChartDayTrafficItem, TrafficInsightItem

CHART_DAY_COUNT = 7

SEGMENT_HOURS: dict[str, list[int]] = {
    "morning": [8, 9, 10, 11],
    "lunch": [12, 13, 14],
    "afternoon": [15, 16, 17],
    "dinner": [18, 19, 20],
    "lateNight": [21, 22, 23],
}

SEGMENT_LABELS: dict[str, str] = {
    "morning": "Morning (8–11 AM)",
    "lunch": "Lunch (12–3 PM)",
    "afternoon": "Afternoon (3–5 PM)",
    "dinner": "Dinner (6–9 PM)",
    "lateNight": "Late Night (9–11 PM)",
}

HourlyRow = tuple[date, str, str, int, int]


def _segment_totals(hour_visitors: dict[int, int]) -> tuple[int, int, int, int, int]:
    morning = sum(hour_visitors.get(h, 0) for h in SEGMENT_HOURS["morning"])
    lunch = sum(hour_visitors.get(h, 0) for h in SEGMENT_HOURS["lunch"])
    afternoon = sum(hour_visitors.get(h, 0) for h in SEGMENT_HOURS["afternoon"])
    dinner = sum(hour_visitors.get(h, 0) for h in SEGMENT_HOURS["dinner"])
    late_night = sum(hour_visitors.get(h, 0) for h in SEGMENT_HOURS["lateNight"])
    return morning, lunch, afternoon, dinner, late_night


def build_chart_days(rows: list[HourlyRow]) -> list[ChartDayTrafficItem]:
    """Sum visitors per traffic_date into chart segments (no averaging)."""
    by_date: dict[date, dict] = {}

    for traffic_date, day_name, day_type, hour, visitors in rows:
        if traffic_date not in by_date:
            by_date[traffic_date] = {
                "day_name": day_name,
                "day_type": day_type,
                "hours": {},
            }
        by_date[traffic_date]["hours"][hour] = (
            by_date[traffic_date]["hours"].get(hour, 0) + int(visitors)
        )

    chart_days: list[ChartDayTrafficItem] = []
    for day_index, traffic_date in enumerate(sorted(by_date.keys())):
        info = by_date[traffic_date]
        morning, lunch, afternoon, dinner, late_night = _segment_totals(info["hours"])
        total = morning + lunch + afternoon + dinner + late_night
        chart_days.append(
            ChartDayTrafficItem(
                trafficDate=traffic_date.isoformat(),
                dayName=info["day_name"],
                dayType=info["day_type"],
                dayIndex=day_index,
                morning=morning,
                lunch=lunch,
                afternoon=afternoon,
                dinner=dinner,
                lateNight=late_night,
                total=total,
            )
        )
    return chart_days


def _format_hour(hour: int) -> str:
    suffix = "PM" if hour >= 12 else "AM"
    h12 = 12 if hour % 12 == 0 else hour % 12
    return f"{h12} {suffix}"


def _peak_hour_in_rows(
    rows: list[HourlyRow],
    hours: list[int],
    day_type: str | None = None,
) -> tuple[int, int]:
    best_hour = hours[0]
    best_val = 0
    for _traffic_date, _day_name, dt, hour, visitors in rows:
        if hour not in hours:
            continue
        if day_type is not None and dt != day_type:
            continue
        val = int(visitors)
        if val >= best_val:
            best_val = val
            best_hour = hour
    return best_hour, best_val


def _format_chart_range(chart_days: list[ChartDayTrafficItem]) -> str:
    if not chart_days:
        return ""
    if len(chart_days) == 1:
        return chart_days[0].trafficDate
    return f"{chart_days[0].trafficDate} – {chart_days[-1].trafficDate}"


def build_traffic_insights(
    chart_days: list[ChartDayTrafficItem],
    raw_rows: list[HourlyRow],
) -> list[TrafficInsightItem]:
    if not chart_days or all(d.total == 0 for d in chart_days):
        return [
            TrafficInsightItem(
                id="empty",
                type="tip",
                title="No traffic data yet",
                body="Seed foot traffic hourly data to see insights for the chart week.",
            )
        ]

    weekday_days = [d for d in chart_days if d.dayType == "Weekday"]
    weekend_days = [d for d in chart_days if d.dayType == "Weekend"]
    weekday_total = sum(d.total for d in weekday_days)
    weekend_total = sum(d.total for d in weekend_days)

    lunch_peak_h, lunch_peak_v = _peak_hour_in_rows(
        raw_rows, SEGMENT_HOURS["lunch"], day_type="Weekday"
    )
    dinner_peak_h, dinner_peak_v = _peak_hour_in_rows(
        raw_rows, SEGMENT_HOURS["dinner"], day_type="Weekend"
    )

    busiest = max(chart_days, key=lambda d: d.total)
    friday = next((d for d in chart_days if d.dayName == "Friday"), None)
    saturday = next((d for d in chart_days if d.dayName == "Saturday"), None)
    friday_dinner = friday.dinner if friday else 0
    saturday_dinner = saturday.dinner if saturday else 0
    date_range = _format_chart_range(chart_days)

    insights: list[TrafficInsightItem] = [
        TrafficInsightItem(
            id="weekday-summary",
            type="weekday",
            title=f"Weekdays — {weekday_total} total visitors ({len(weekday_days)} days)",
            body=(
                f"Lunch peak at {_format_hour(lunch_peak_h)} "
                f"({lunch_peak_v} visitors that hour). "
                f"Chart week: {date_range}."
            ),
        ),
        TrafficInsightItem(
            id="weekend-summary",
            type="weekend",
            title=f"Weekends — {weekend_total} total visitors ({len(weekend_days)} days)",
            body=(
                f"Dinner peak at {_format_hour(dinner_peak_h)} "
                f"({dinner_peak_v} visitors that hour). "
                f"Chart week: {date_range}."
            ),
        ),
        TrafficInsightItem(
            id="busiest-day",
            type="peak",
            title=f"Busiest day: {busiest.dayName} ({busiest.total} visits)",
            body=(
                f"{busiest.trafficDate} had the highest traffic. "
                f"Dinner contributed {busiest.dinner} visits — "
                f"prioritise that window in staffing."
            ),
            linkedDayIndex=busiest.dayIndex,
            linkedSegment="dinner" if busiest.dinner >= busiest.lunch else "lunch",
        ),
        TrafficInsightItem(
            id="scheduling-tip",
            type="tip",
            title="Scheduling tip",
            body=(
                f"Friday dinner ({friday_dinner} visits) vs Saturday dinner "
                f"({saturday_dinner} visits). "
                + (
                    "Treat Friday evening like a weekend shift."
                    if friday_dinner >= saturday_dinner * 0.85
                    else "Saturday remains the priority surge shift."
                )
            ),
            linkedDayIndex=friday.dayIndex if friday and friday_dinner >= saturday_dinner * 0.85 else (
                saturday.dayIndex if saturday else None
            ),
            linkedSegment="dinner",
        ),
    ]
    return insights

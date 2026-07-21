"""Rule-based foot traffic analytics — chart, insights, and staffing forecast from hourly data."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from src.database.schemas.visibility import (
    HourlyTrafficItem,
    StaffingShiftItem,
    TrafficInsightItem,
)

DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

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

VISITORS_PER_STAFF = 18

# Chart week is Jun 1–7; recommended shifts forecast the following week.
FORECAST_WEEK_START = date(2026, 6, 8)


def forecast_date_for_day(day_index: int) -> str:
    """Schedule date for day_index 0–6 → Jun 8–14, 2026."""
    return (FORECAST_WEEK_START + timedelta(days=day_index)).strftime("%d %b %Y")


@dataclass
class DayStackRow:
    day_index: int
    day: str
    is_weekend: bool
    morning: int
    lunch: int
    afternoon: int
    dinner: int
    late_night: int

    @property
    def total(self) -> int:
        return self.morning + self.lunch + self.afternoon + self.dinner + self.late_night

    def segment_value(self, segment: str) -> int:
        return {
            "morning": self.morning,
            "lunch": self.lunch,
            "afternoon": self.afternoon,
            "dinner": self.dinner,
            "lateNight": self.late_night,
        }.get(segment, 0)


def _hour_avg(hourly: list[HourlyTrafficItem], hour: int, is_weekend: bool) -> float:
    row = next((h for h in hourly if h.hour == hour), None)
    if row is None:
        return 0.0
    return row.weekendAvg if is_weekend else row.weekdayAvg


def _sum_hours(hourly: list[HourlyTrafficItem], hours: list[int], is_weekend: bool) -> int:
    return max(0, sum(round(_hour_avg(hourly, h, is_weekend)) for h in hours))


def build_day_rows(hourly: list[HourlyTrafficItem]) -> list[DayStackRow]:
    if not hourly:
        return [
            DayStackRow(i, day, i >= 5, 0, 0, 0, 0, 0) for i, day in enumerate(DAYS)
        ]

    rows: list[DayStackRow] = []
    for i, day in enumerate(DAYS):
        is_weekend = i >= 5
        rows.append(
            DayStackRow(
                day_index=i,
                day=day,
                is_weekend=is_weekend,
                morning=_sum_hours(hourly, SEGMENT_HOURS["morning"], is_weekend),
                lunch=_sum_hours(hourly, SEGMENT_HOURS["lunch"], is_weekend),
                afternoon=_sum_hours(hourly, SEGMENT_HOURS["afternoon"], is_weekend),
                dinner=_sum_hours(hourly, SEGMENT_HOURS["dinner"], is_weekend),
                late_night=_sum_hours(hourly, SEGMENT_HOURS["lateNight"], is_weekend),
            )
        )
    return rows


def _format_hour(hour: int) -> str:
    suffix = "PM" if hour >= 12 else "AM"
    h12 = 12 if hour % 12 == 0 else hour % 12
    return f"{h12} {suffix}"


def _peak_hour_in_hours(hourly: list[HourlyTrafficItem], hours: list[int], is_weekend: bool) -> tuple[int, int]:
    best_hour = hours[0]
    best_val = 0
    for hour in hours:
        val = round(_hour_avg(hourly, hour, is_weekend))
        if val >= best_val:
            best_val = val
            best_hour = hour
    return best_hour, best_val


def build_traffic_insights(
    hourly: list[HourlyTrafficItem],
    weekday_avg: float,
    weekend_avg: float,
) -> list[TrafficInsightItem]:
    rows = build_day_rows(hourly)
    if not hourly or all(r.total == 0 for r in rows):
        return [
            TrafficInsightItem(
                id="empty",
                type="tip",
                title="No traffic data yet",
                body="Seed foot traffic hourly data to see insights linked to the chart.",
            )
        ]

    lunch_peak_h, lunch_peak_v = _peak_hour_in_hours(
        hourly, SEGMENT_HOURS["lunch"], is_weekend=False
    )
    dinner_peak_h, dinner_peak_v = _peak_hour_in_hours(
        hourly, SEGMENT_HOURS["dinner"], is_weekend=True
    )

    busiest = max(rows, key=lambda r: r.total)
    friday = rows[4]
    saturday = rows[5]
    friday_dinner = friday.dinner
    saturday_dinner = saturday.dinner

    insights: list[TrafficInsightItem] = [
        TrafficInsightItem(
            id="weekday-summary",
            type="weekday",
            title=f"Weekdays (Mon–Fri) — avg {weekday_avg} visitors/day",
            body=(
                f"Lunch peak around {_format_hour(lunch_peak_h)} "
                f"({lunch_peak_v} visitors/hr). Staff lunch service "
                f"{SEGMENT_LABELS['lunch']} on weekdays."
            ),
            linkedDayIndex=2,
            linkedSegment="lunch",
        ),
        TrafficInsightItem(
            id="weekend-summary",
            type="weekend",
            title=f"Weekends (Sat–Sun) — avg {weekend_avg} visitors/day",
            body=(
                f"Dinner peak around {_format_hour(dinner_peak_h)} "
                f"({dinner_peak_v} visitors/hr). Scale kitchen and floor staff "
                f"for {SEGMENT_LABELS['dinner']} on weekends."
            ),
            linkedDayIndex=6 if dinner_peak_v else 5,
            linkedSegment="dinner",
        ),
        TrafficInsightItem(
            id="busiest-day",
            type="peak",
            title=f"Busiest day: {busiest.day} ({busiest.total} visits)",
            body=(
                f"Highest total traffic is on {busiest.day}. "
                f"Dinner segment contributes {busiest.dinner} visits — "
                f"prioritise that window in next week's roster."
            ),
            linkedDayIndex=busiest.day_index,
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
            linkedDayIndex=4 if friday_dinner >= saturday_dinner * 0.85 else 5,
            linkedSegment="dinner",
        ),
    ]
    return insights


def build_next_week_schedule(hourly: list[HourlyTrafficItem]) -> list[StaffingShiftItem]:
    rows = build_day_rows(hourly)
    if not hourly:
        return []

    shift_defs = [
        ("lunch", "11:00–14:00", 11, 14, ["lunch"]),
        ("dinner", "18:00–21:00", 18, 21, ["dinner", "lateNight"]),
    ]

    expected_values: list[int] = []
    draft: list[tuple[DayStackRow, str, str, int, int, list[str], int]] = []

    for row in rows:
        for segment_key, shift_label, start_h, end_h, segment_keys in shift_defs:
            expected = sum(row.segment_value(k) for k in segment_keys)
            expected_values.append(expected)
            draft.append((row, segment_key, shift_label, start_h, end_h, segment_keys, expected))

    if not expected_values:
        return []

    sorted_vals = sorted(expected_values)
    p75_idx = max(0, int(len(sorted_vals) * 0.75) - 1)
    threshold_high = sorted_vals[p75_idx] if sorted_vals else 0
    threshold_med = sorted_vals[max(0, len(sorted_vals) // 2 - 1)] if sorted_vals else 0

    schedule: list[StaffingShiftItem] = []
    for row, segment_key, shift_label, start_h, end_h, _keys, expected in draft:
        if expected <= 0:
            continue
        staff = max(2, (expected + VISITORS_PER_STAFF - 1) // VISITORS_PER_STAFF)
        if expected >= threshold_high:
            priority = "high"
        elif expected >= threshold_med:
            priority = "medium"
        else:
            priority = "low"

        schedule.append(
            StaffingShiftItem(
                day=row.day,
                dayIndex=row.day_index,
                date=forecast_date_for_day(row.day_index),
                shift=shift_label,
                segment=segment_key,
                shiftStart=start_h,
                shiftEnd=end_h,
                expectedVisitors=expected,
                staffSuggested=staff,
                priority=priority,
            )
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    schedule.sort(key=lambda s: (priority_order.get(s.priority, 9), -s.expectedVisitors))
    return schedule[:14]

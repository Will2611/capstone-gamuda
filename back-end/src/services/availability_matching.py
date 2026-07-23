"""Deterministic availability matching (Agent 1) — no LLM."""
from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Optional

MIN_MEETUP_MINUTES = 60
SUGGESTED_WINDOW_MINUTES = 120


@dataclass
class TimeSlot:
    available_date: datetime.date
    start_time: datetime.time
    end_time: datetime.time


@dataclass
class OverlapResult:
    has_overlap: bool
    overlap_date: Optional[datetime.date] = None
    overlap_start: Optional[datetime.time] = None
    overlap_end: Optional[datetime.time] = None
    meeting_time: Optional[datetime.time] = None  # Method A: start of overlap
    suggested_date: Optional[datetime.date] = None
    suggested_start: Optional[datetime.time] = None
    suggested_end: Optional[datetime.time] = None
    suggested_meeting_time: Optional[datetime.time] = None  # Method B: midpoint
    rationale: str = ""


def _to_minutes(t: datetime.time) -> int:
    return t.hour * 60 + t.minute


def _from_minutes(m: int) -> datetime.time:
    m = max(0, min(m, 23 * 60 + 59))
    return datetime.time(hour=m // 60, minute=m % 60)


def _duration_minutes(start: datetime.time, end: datetime.time) -> int:
    return _to_minutes(end) - _to_minutes(start)


def compute_overlap(slot_a: TimeSlot, slot_b: TimeSlot) -> OverlapResult:
    """
    Method A (overlap): meeting_time = start of overlap.
    Method B (no overlap): suggested window centered on midpoint between slots.
    """
    if slot_a.available_date != slot_b.available_date:
        # Different days — suggest partner's day midpoint between preferred windows conceptually
        # Use the earlier calendar date's end and later date's start is not comparable;
        # suggest day of slot_a with midpoint-of-day heuristic from both time ranges.
        mid_a = (_to_minutes(slot_a.start_time) + _to_minutes(slot_a.end_time)) // 2
        mid_b = (_to_minutes(slot_b.start_time) + _to_minutes(slot_b.end_time)) // 2
        mid = (mid_a + mid_b) // 2
        half = SUGGESTED_WINDOW_MINUTES // 2
        return OverlapResult(
            has_overlap=False,
            suggested_date=slot_a.available_date,
            suggested_start=_from_minutes(mid - half),
            suggested_end=_from_minutes(mid + half),
            suggested_meeting_time=_from_minutes(mid),
            rationale=(
                "No matching day. Suggested a midpoint window on your date "
                "based on both preferred time ranges (method B)."
            ),
        )

    start = max(_to_minutes(slot_a.start_time), _to_minutes(slot_b.start_time))
    end = min(_to_minutes(slot_a.end_time), _to_minutes(slot_b.end_time))

    if end - start >= MIN_MEETUP_MINUTES:
        overlap_start = _from_minutes(start)
        overlap_end = _from_minutes(end)
        return OverlapResult(
            has_overlap=True,
            overlap_date=slot_a.available_date,
            overlap_start=overlap_start,
            overlap_end=overlap_end,
            meeting_time=overlap_start,  # Method A
            rationale="Overlap found. Meeting time set to start of overlap.",
        )

    # No usable overlap — Method B: midpoint of the gap (or between centers)
    a_start, a_end = _to_minutes(slot_a.start_time), _to_minutes(slot_a.end_time)
    b_start, b_end = _to_minutes(slot_b.start_time), _to_minutes(slot_b.end_time)

    if a_end <= b_start:
        gap_mid = (a_end + b_start) // 2
    elif b_end <= a_start:
        gap_mid = (b_end + a_start) // 2
    else:
        # Overlap too short — expand around midpoint of short intersection
        gap_mid = (start + end) // 2 if end > start else (a_start + a_end + b_start + b_end) // 4

    half = SUGGESTED_WINDOW_MINUTES // 2
    return OverlapResult(
        has_overlap=False,
        suggested_date=slot_a.available_date,
        suggested_start=_from_minutes(gap_mid - half),
        suggested_end=_from_minutes(gap_mid + half),
        suggested_meeting_time=_from_minutes(gap_mid),
        rationale=(
            "No matching availability found. Suggested closest midpoint window "
            "between your schedules (method B). Accept the suggestion or edit availability."
        ),
    )


def validate_slot(slot: TimeSlot, *, today: Optional[datetime.date] = None) -> Optional[str]:
    today = today or datetime.date.today()
    if slot.available_date < today:
        return "available_date must be today or in the future"
    if slot.end_time <= slot.start_time:
        return "end_time must be after start_time"
    if _duration_minutes(slot.start_time, slot.end_time) < MIN_MEETUP_MINUTES:
        return f"Availability window must be at least {MIN_MEETUP_MINUTES} minutes"
    return None

"""Unit tests for deterministic availability matching (Agent 1)."""
import datetime

from src.services.availability_matching import TimeSlot, compute_overlap, validate_slot


def test_overlap_method_a_meeting_at_start():
    a = TimeSlot(datetime.date(2026, 7, 26), datetime.time(14, 0), datetime.time(19, 0))
    b = TimeSlot(datetime.date(2026, 7, 26), datetime.time(17, 0), datetime.time(21, 0))
    result = compute_overlap(a, b)
    assert result.has_overlap is True
    assert result.overlap_start == datetime.time(17, 0)
    assert result.overlap_end == datetime.time(19, 0)
    assert result.meeting_time == datetime.time(17, 0)  # Method A


def test_no_overlap_method_b_suggestion():
    a = TimeSlot(datetime.date(2026, 7, 26), datetime.time(14, 0), datetime.time(16, 0))
    b = TimeSlot(datetime.date(2026, 7, 26), datetime.time(18, 0), datetime.time(21, 0))
    result = compute_overlap(a, b)
    assert result.has_overlap is False
    assert result.suggested_meeting_time is not None
    assert result.suggested_start is not None
    assert result.suggested_end is not None
    # Midpoint of gap 16:00–18:00 is 17:00
    assert result.suggested_meeting_time == datetime.time(17, 0)


def test_validate_slot_rejects_short_window():
    slot = TimeSlot(datetime.date(2026, 7, 26), datetime.time(14, 0), datetime.time(14, 30))
    assert validate_slot(slot, today=datetime.date(2026, 7, 1)) is not None

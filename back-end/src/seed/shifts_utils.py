import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def parse_time_string(time_str: str) -> datetime.time:
    """Parses a single time string into a datetime.time object."""
    clean_str = time_str.replace('\u00A0', ' ').strip()
    
    # Define formats to try
    formats = [
        "%I:%M %p",  # 2:30 PM
        "%I %p",     # 2 PM
        "%H:%M",     # 14:30
        "%H",        # 14
        "%I:%M",     # 2:30 (no AM/PM)
        "%I"         # 2 (no AM/PM)
    ]
    
    for fmt in formats:
        try:
            return datetime.datetime.strptime(clean_str, fmt).time()
        except ValueError:
            continue
            
    raise ValueError(f"Unable to parse time: {time_str}")

def parse_time_ranges_no_regex(time_ranges: list[str]) -> list[tuple[datetime.time, datetime.time]]:
    results = []
    
    for item in time_ranges:
        # 1. Normalize spaces and dashes
        # Replace non-breaking spaces, en-dashes, and em-dashes with standard equivalents
        clean_item = item.replace('\u00A0', ' ').replace('–', '-').replace('—', '-')
        
        # 2. Detect global meridiem (AM/PM) at the very end of the string
        global_meridiem = ""
        upper_item = clean_item.upper()
        if upper_item.endswith(" AM"):
            global_meridiem = " AM"
        elif upper_item.endswith(" PM"):
            global_meridiem = " PM"
        
        # 3. Split by the first hyphen found
        # We assume the format is "Start - End", so splitting by '-' works if times don't contain hyphens
        if '-' not in clean_item:
            raise ValueError(f"Invalid range format (no separator): {item}")
            
        parts = clean_item.split('-', 1) # Split only on the first hyphen
        if len(parts) != 2:
            raise ValueError(f"Invalid range format: {item}")
            
        start_str, end_str = parts[0].strip(), parts[1].strip()
        
        # 4. Inherit Meridiem for End Time
        # If end_str doesn't have AM/PM but the whole string did, append it
        if not (end_str.upper().endswith(" AM") or end_str.upper().endswith(" PM")):
            if global_meridiem:
                end_str += global_meridiem
        
        # 5. Inherit Meridiem for Start Time
        # If start_str doesn't have AM/PM, inherit from global or extracted end meridiem
        if not (start_str.upper().endswith(" AM") or start_str.upper().endswith(" PM")):
            if global_meridiem:
                start_str += global_meridiem
            elif end_str.upper().endswith(" AM"):
                start_str += " AM"
            elif end_str.upper().endswith(" PM"):
                start_str += " PM"
        
        start_time = parse_time_string(start_str)
        end_time = parse_time_string(end_str)
        
        results.append((start_time, end_time))
            
    return results

# Test Cases
# data = ['12 - 3 AM', '3 - 6 PM', '12–2:30 PM', '1 AM–12:30 PM']
# parsed = parse_time_ranges_no_regex(data)
# print(parsed)


def testZoneInfoType(input:str|None)->bool:
    if not input:
        return False
    try:
        ZoneInfo(input)
        return True
    except ZoneInfoNotFoundError:
        return False




def splitShifts(shifts:list[str])->list[tuple[datetime.time,datetime.time]]:
    if shifts[0].strip().lower()=='closed':
        return []
    if shifts[0].strip()=="Open 24 hours":
        return [(datetime.time(0,0), datetime.time(23,59))]
    return parse_time_ranges_no_regex(shifts)

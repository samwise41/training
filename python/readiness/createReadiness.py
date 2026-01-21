import json
import re
import datetime
from pathlib import Path

# --- Configuration ---
# distinct paths relative to this script location
BASE_DIR = Path(__file__).parent.parent.parent
LOG_PATH = BASE_DIR / "data" / "training_log.json"
PLAN_PATH = BASE_DIR / "endurance_plan.md"
OUTPUT_PATH = BASE_DIR / "data" / "readiness" / "readiness.json"

# Ensure output directory exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

def parse_duration(val):
    """
    Normalizes duration to minutes.
    """
    if val is None:
        return 0
    if isinstance(val, (int, float)):
        return float(val)
    
    val = str(val).lower().strip()
    if val == '-' or val == 'n/a':
        return 0
    
    mins = 0
    if 'h' in val:
        parts = val.split('h')
        try:
            mins += float(parts[0]) * 60
            if len(parts) > 1 and 'm' in parts[1]:
                mins += float(parts[1].replace('m', '').strip())
        except ValueError:
            pass
    elif ':' in val:
        parts = val.split(':')
        try:
            mins += float(parts[0]) * 60 + float(parts[1])
        except ValueError:
            pass
    else:
        try:
            # Extract number only
            clean_num = re.sub(r"[^0-9.]", "", val)
            if clean_num:
                mins += float(clean_num)
        except ValueError:
            pass
            
    return mins

def check_sport(activity_sport, target_sport):
    """
    Replicates the JS logic for sport categorization.
    """
    sport = str(activity_sport or "").upper()
    target = target_sport.upper()

    if target == 'BIKE':
        return 'BIKE' in sport or 'CYCLING' in sport
    if target == 'RUN':
        return 'RUN' in sport
    if target == 'SWIM':
        return 'SWIM' in sport or 'POOL' in sport
    return False

def get_training_stats(log_data):
    """
    Calculates max durations and elevation for the last 30 days.
    Converts elevation from Meters to Feet.
    """
    stats = {
        "maxSwim": 0,
        "maxBike": 0,
        "maxRun": 0,
        "maxBikeElev": 0
    }
    
    today = datetime.datetime.now()
    lookback_date = today - datetime.timedelta(days=30)
    
    METERS_TO_FEET = 3.28084

    for entry in log_data:
        # 1. Parse Date
        try:
            entry_date_str = entry.get('date')
            if not entry_date_str:
                continue
            entry_date = datetime.datetime.strptime(entry_date_str, "%Y-%m-%d")
        except ValueError:
            continue
            
        # Filter: Only look at last 30 days
        if entry_date < lookback_date:
            continue

        # 2. Get Duration
        dur = 0
        if 'actualDuration' in entry and isinstance(entry['actualDuration'], (int, float)):
            dur = entry['actualDuration']
        elif 'duration' in entry and isinstance(entry['duration'], (int, float)):
            dur = entry['duration'] / 60.0 
        else:
            dur = parse_duration(entry.get('actualDuration') or entry.get('duration'))

        # 3. Get Elevation (Convert Meters to Feet)
        elev_ft = 0
        if entry.get('elevationGain'):
            try:
                # Parse the raw meter value
                elev_m = float(str(entry['elevationGain']).replace(',', ''))
                # Convert to feet
                elev_ft = elev_m * METERS_TO_FEET
            except ValueError:
                elev_ft = 0

        # 4. Update Stats based on Sport
        actual_sport = entry.get('actualSport')
        
        if check_sport(actual_sport, 'SWIM'):
            stats['maxSwim'] = max(stats['maxSwim'], dur)
        elif check_sport(actual_sport, 'BIKE'):
            stats['maxBike'] = max(stats['maxBike'], dur)
            stats['maxBikeElev'] = max(stats['maxBikeElev'], elev_ft)
        elif check_sport(actual_sport, 'RUN'):
            stats['maxRun'] = max(stats['maxRun'], dur)
            
    # Round elevation for cleaner display
    stats['maxBikeElev'] = round(stats['maxBikeElev'])
            
    return stats

def clean_cell(cell):
    """Removes markdown bold/italic and whitespace."""
    if not cell:
        return ""
    return cell.replace('*', '').strip()

def flexible_date_parse(date_str):
    """
    Handles formats like 'June 20, 2026', 'Aug 15, 2026', 'Sept 11, 2026'.
    """
    clean_str = clean_cell(date_str)
    
    # fix non-standard abbreviations
    clean_str = clean_str.replace("Sept ", "Sep ")
    
    formats = [
        "%B %d, %Y",  # Full month: June 20, 2026
        "%b %d, %Y",  # Abbrev month: Aug 15, 2026
        "%Y-%m-%d",   # ISO: 2026-06-20
    ]
    
    for fmt in formats:
        try:
            return datetime.datetime.strptime(clean_str, fmt)
        except ValueError:
            continue
    return None

def parse_events(plan_md):
    """
    Parses the Markdown table in the 'Event Schedule' section extracting all columns.
    """
    events = []
    lines = plan_md.split('\n')
    in_table = False
    col_map = {}
    
    today = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for line in lines:
        stripped = line.strip()
        lower_line = stripped.lower()

        # Detect Header Row (must contain Date and Event Type/Event)
        if '|' in lower_line and 'date' in lower_line and ('event' in lower_line or 'race' in lower_line):
            in_table = True
            headers = [h.strip().lower() for h in stripped.strip('|').split('|')]
            
            # Helper to find index safely
            def get_idx(keywords):
                for k in keywords:
                    for i, h in enumerate(headers):
                        if k in h:
                            return i
                return -1

            col_map = {
                'date': get_idx(['date']),
                'type': get_idx(['event type', 'event', 'race']),
                # Explicitly exclude "swim goal" etc when looking for generic "goal"
                'goal': next((i for i, h in enumerate(headers) if 'goal' in h and 'swim' not in h and 'bike' not in h and 'run' not in h and 'elev' not in h), -1),
                'priority': get_idx(['priority']),
                'profile': get_idx(['course profile', 'profile']),
                'implication': get_idx(['training implication', 'implication']),
                
                'swim_dist': get_idx(['swim distance', 'swim dist']),
                'swim_goal': get_idx(['swim goal']),
                
                'bike_dist': get_idx(['bike distance', 'bike dist']),
                'bike_goal': get_idx(['bike goal']),
                
                'run_dist': get_idx(['run distance', 'run dist']),
                'run_goal': get_idx(['run goal']),
                
                'elev_goal': get_idx(['elevation goal', 'elevation', 'climb'])
            }
            continue

        # Skip separator line (e.g. | :--- |)
        if in_table and set(stripped.replace('|', '').replace(':', '').replace('-', '').replace(' ', '')) == set():
            continue
        
        # Stop at empty line
        if in_table and not stripped:
            in_table = False
            continue

        # Parse Row
        if in_table and stripped.startswith('|'):
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            
            # Ensure we have enough columns (based on max index we found)
            max_idx = max(col_map.values())
            if len(cols) <= max_idx:
                # pad with empty strings if row is short
                cols += [''] * (max_idx - len(cols) + 1)

            if col_map['date'] > -1:
                raw_date = cols[col_map['date']]
                event_dt = flexible_date_parse(raw_date)
                
                if event_dt:
                    if event_dt >= today:
                        event_obj = {
                            "dateStr": clean_cell(raw_date),
                            "name": clean_cell(cols[col_map['type']]) if col_map['type'] > -1 else "Unknown Event",
                            "goal": clean_cell(cols[col_map['goal']]) if col_map['goal'] > -1 else "",
                            "priority": clean_cell(cols[col_map['priority']]) if col_map['priority'] > -1 else "C",
                            "courseProfile": clean_cell(cols[col_map['profile']]) if col_map['profile'] > -1 else "",
                            "trainingImplication": clean_cell(cols[col_map['implication']]) if col_map['implication'] > -1 else "",
                            
                            "swimDist": clean_cell(cols[col_map['swim_dist']]) if col_map['swim_dist'] > -1 else "",
                            "swimGoal": clean_cell(cols[col_map['swim_goal']]) if col_map['swim_goal'] > -1 else "",
                            
                            "bikeDist": clean_cell(cols[col_map['bike_dist']]) if col_map['bike_dist'] > -1 else "",
                            "bikeGoal": clean_cell(cols[col_map['bike_goal']]) if col_map['bike_goal'] > -1 else "",
                            "bikeElevGoal": clean_cell(cols[col_map['elev_goal']]) if col_map['elev_goal'] > -1 else "",
                            
                            "runDist": clean_cell(cols[col_map['run_dist']]) if col_map['run_dist'] > -1 else "",
                            "runGoal": clean_cell(cols[col_map['run_goal']]) if col_map['run_goal'] > -1 else "",
                            
                            "timestamp": event_dt.timestamp()
                        }
                        events.append(event_obj)
                else:
                    # Fallback for events with TBD dates or unparseable dates
                    pass

    # Sort by date
    events.sort(key=lambda x: x['timestamp'])
    
    # Remove timestamp helper
    for e in events:
        del e['timestamp']
        
    return events

def main():
    print("🚀 Generating Readiness Data...")
    
    # 1. Load Data
    try:
        with open(LOG_PATH, 'r', encoding='utf-8') as f:
            log_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Log file not found at {LOG_PATH}")
        log_data = []

    try:
        with open(PLAN_PATH, 'r', encoding='utf-8') as f:
            plan_md = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Plan file not found at {PLAN_PATH}")
        plan_md = ""

    # 2. Process
    stats = get_training_stats(log_data)
    upcoming_events = parse_events(plan_md)

    output_data = {
        "generatedAt": datetime.datetime.now().isoformat(),
        "trainingStats": stats,
        "upcomingEvents": upcoming_events
    }

    # 3. Save
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Readiness data saved to: {OUTPUT_PATH}")
    print(f"   - Stats: {stats}")
    print(f"   - Events Found: {len(upcoming_events)}")
    if len(upcoming_events) > 0:
        print(f"   - Next Event: {upcoming_events[0]['name']} on {upcoming_events[0]['dateStr']}")

if __name__ == "__main__":
    main()

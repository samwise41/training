import json
import os
import re
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN_FILE = os.path.join(BASE_DIR, 'endurance_plan.md')
PHASES_FILE = os.path.join(BASE_DIR, 'data', 'phases.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'top_cards.json')

def load_current_phase_from_json():
    """
    Loads phases.json and finds the current phase/block based on today's date.
    Returns: (phase_string, block_string) or (None, None)
    """
    if not os.path.exists(PHASES_FILE):
        return None, None

    try:
        with open(PHASES_FILE, 'r', encoding='utf-8') as f:
            schedule = json.load(f)
        
        # Ensure we are looking at 'today'
        today = datetime.now().date()
        
        # Sort schedule just in case
        # Assumes date format YYYY-MM-DD in json keys or 'date' field
        # Adjusting logic to handle likely list structure based on standard generation
        # Structure assumption: List of dicts with 'date' or 'week_ending'
        
        sorted_weeks = []
        for entry in schedule:
            # Handle different potential key names from the generator
            d_str = entry.get('date') or entry.get('week_ending') or entry.get('Week Ending')
            if d_str:
                try:
                    d_obj = datetime.strptime(d_str, "%Y-%m-%d").date()
                    sorted_weeks.append((d_obj, entry))
                except ValueError:
                    continue
        
        sorted_weeks.sort(key=lambda x: x[0])

        # Find the first week-ending date that is >= today
        current_entry = None
        for week_date, data in sorted_weeks:
            if week_date >= today:
                current_entry = data
                break
        
        # If no future weeks found, maybe we are in the last week or plan ended?
        # Fallback to the last entry if today is after the last plan date
        if not current_entry and sorted_weeks:
            current_entry = sorted_weeks[-1][1]

        if current_entry:
            # Extract fields with fallbacks
            p = current_entry.get('Phase') or current_entry.get('phase') or "Unknown Phase"
            b = current_entry.get('Block') or current_entry.get('block') or ""
            m = current_entry.get('Microcycle Type') or current_entry.get('microcycle') or ""
            
            # Construct the Block string (e.g., "Block 1 (Loading)")
            block_display = f"{b} ({m})" if m else b
            
            return p, block_display

    except Exception as e:
        print(f"⚠️ Warning: Could not parse phases.json: {e}")
    
    return None, None

def get_phase_from_markdown(content):
    """Fallback: Regex parsing from the markdown header"""
    status_match = re.search(r'\*\*Status:\*\*\s*(.*)', content)
    full_status = status_match.group(1).strip() if status_match else "Unknown Phase"
    
    phase_part = "Unknown Phase"
    block_part = ""
    
    if " - " in full_status:
        parts = full_status.split(" - ")
        phase_part = parts[0].strip()
        block_part = parts[1].strip()
    else:
        phase_part = full_status
        
    return phase_part, block_part

def main():
    if not os.path.exists(PLAN_FILE):
        print(f"Error: {PLAN_FILE} not found.")
        return

    with open(PLAN_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    content = "".join(lines)

    # 1. Determine Phase & Block
    # Priority: JSON File -> Markdown Fallback
    phase_part, block_part = load_current_phase_from_json()
    
    if not phase_part:
        print("   -> phases.json not found or invalid. Using Markdown fallback.")
        phase_part, block_part = get_phase_from_markdown(content)

    # 2. Flexible Table Parsing for Races
    events = []
    today = datetime.now()
    
    for line in lines:
        if not line.strip().startswith('|'): continue
        if 'Date' in line or '---' in line: continue
        
        cols = [c.strip() for c in line.split('|') if c.strip()]
        if len(cols) < 4: continue
        
        date_str = cols[0]
        event_name = cols[1]
        
        # Clean priority string (e.g., "**A-Race**" -> "A")
        priority_raw = cols[3].upper()
        priority = "None"
        if 'A-' in priority_raw or 'A ' in priority_raw: priority = 'A'
        elif 'B-' in priority_raw or 'B ' in priority_raw: priority = 'B'
        elif 'C-' in priority_raw or 'C ' in priority_raw: priority = 'C'

        try:
            # Handle "June 20, 2026"
            date_val = datetime.strptime(date_str, "%B %d, %Y")
            if date_val.date() >= today.date(): # Compare dates only
                events.append({
                    "name": event_name,
                    "date": date_val,
                    "priority": priority,
                    "days_out": (date_val - today).days
                })
        except ValueError:
            continue

    # 3. Apply Priority Logic: Earliest A -> B -> C
    next_event = "No Event"
    next_event_name = "No Event"
    days_to_go = "--"
    
    # Sort events by date first to find the absolute next one per category
    events.sort(key=lambda x: x['date'])

    found_event = None
    # Check A, then B, then C
    for level in ['A', 'B', 'C']:
        level_events = [e for e in events if e['priority'] == level]
        if level_events:
            found_event = level_events[0]
            break
            
    # If no rated events found, take the very next one (unrated)
    if not found_event and events:
        found_event = events[0]

    if found_event:
        p_label = f" ({found_event['priority']} Race)" if found_event['priority'] != "None" else ""
        next_event = f"{found_event['name']}{p_label}"
        next_event_name = found_event['name']
        days_to_go = found_event['days_out']

    # 4. Save to JSON
    result = {
        "phase": phase_part,
        "block": block_part,
        "next_event": next_event,
        "next_event_name": next_event_name,
        "days_to_go": days_to_go,
        "last_updated": datetime.now().isoformat()
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=4)
        
    print(f"✅ Top cards generated: {phase_part} | {block_part}")

if __name__ == "__main__":
    main()

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
        
        today = datetime.now().date()
        
        sorted_weeks = []
        for entry in schedule:
            # Handle keys from different generator versions
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
        
        # Fallback: If we are just past the last date (within 7 days), use the last entry
        if not current_entry and sorted_weeks:
            last_date = sorted_weeks[-1][0]
            if (today - last_date).days < 7:
                 current_entry = sorted_weeks[-1][1]

        if current_entry:
            # 1. PHASE
            p = current_entry.get('Phase') or current_entry.get('phase') or "Unknown Phase"
            
            # 2. BLOCK (Robust Key Search)
            b = (current_entry.get('Block') or 
                 current_entry.get('block') or 
                 current_entry.get('Block / Focus') or 
                 "")
            
            # 3. MICROCYCLE
            m = (current_entry.get('Microcycle Type') or 
                 current_entry.get('microcycle') or 
                 current_entry.get('Microcycle') or 
                 "")
            
            # Construct Display String
            if b and m:
                block_display = f"{b} ({m})"
            elif b:
                block_display = b
            elif m:
                block_display = m
            else:
                block_display = ""
            
            return p, block_display

    except Exception as e:
        print(f"⚠️ Warning: Could not parse phases.json: {e}")
    
    return None, None

def main():
    # 1. Determine Phase & Block (JSON ONLY)
    phase_part, block_part = load_current_phase_from_json()
    
    # STRICT FALLBACK: If phases.json fails, go straight to Offseason.
    if not phase_part or phase_part == "Unknown Phase":
        print("   -> No active phase found in phases.json. Defaulting to Offseason.")
        phase_part = "Offseason"
        block_part = ""

    # 2. Flexible Table Parsing for Races (Still uses Markdown Plan)
    events = []
    
    if os.path.exists(PLAN_FILE):
        with open(PLAN_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        today = datetime.now()
        
        for line in lines:
            if not line.strip().startswith('|'): continue
            if 'Date' in line or '---' in line: continue
            
            cols = [c.strip() for c in line.split('|') if c.strip()]
            if len(cols) < 4: continue
            
            date_str = cols[0]
            event_name = cols[1]
            
            priority_raw = cols[3].upper()
            priority = "None"
            if 'A-' in priority_raw or 'A ' in priority_raw: priority = 'A'
            elif 'B-' in priority_raw or 'B ' in priority_raw: priority = 'B'
            elif 'C-' in priority_raw or 'C ' in priority_raw: priority = 'C'

            try:
                date_val = datetime.strptime(date_str, "%B %d, %Y")
                if date_val.date() >= today.date():
                    events.append({
                        "name": event_name,
                        "date": date_val,
                        "priority": priority,
                        "days_out": (date_val - today).days
                    })
            except ValueError:
                continue
    else:
        print(f"⚠️ Warning: Plan file not found at {PLAN_FILE}")

    # 3. Apply Priority Logic
    next_event = "No Event"
    next_event_name = "No Event"
    days_to_go = "--"
    
    events.sort(key=lambda x: x['date'])

    found_event = None
    for level in ['A', 'B', 'C']:
        level_events = [e for e in events if e['priority'] == level]
        if level_events:
            found_event = level_events[0]
            break
            
    if not found_event and events:
        found_event = events[0]

    if found_event:
        p_label = f" ({found_event['priority']} Race)" if found_event['priority'] != "None" else ""
        next_event = f"{found_event['name']}{p_label}"
        next_event_name = found_event['name']
        
        # Calculate Weeks and Days
        total_days = found_event['days_out']
        if total_days >= 0:
            weeks = total_days // 7
            rem_days = total_days % 7
            if weeks > 0:
                days_to_go = f"{weeks} Wks {rem_days} Days"
            else:
                days_to_go = f"{rem_days} Days"
        else:
            days_to_go = "Today!"

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
        
    print(f"✅ Top cards generated: {phase_part} | {block_part} | {days_to_go}")

if __name__ == "__main__":
    main()

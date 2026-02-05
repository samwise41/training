import json
import os
import re
from datetime import datetime, timedelta

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN_FILE = os.path.join(BASE_DIR, 'endurance_plan.md')
PHASES_FILE = os.path.join(BASE_DIR, 'data', 'phases.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'top_cards.json')

def parse_date(date_str):
    """Tries multiple formats to parse the date string."""
    formats = [
        "%Y-%m-%d",       # 2026-02-07
        "%b %d, %Y",      # Feb 07, 2026
        "%B %d, %Y",      # February 07, 2026
        "%d-%b-%Y",       # 07-Feb-2026
        "%m/%d/%Y"        # 02/07/2026
    ]
    
    for fmt in formats:
        try:
            # Add 23:59 to treat it as the end of the day
            return datetime.strptime(date_str.strip(), fmt) + timedelta(hours=23, minutes=59)
        except ValueError:
            continue
    return None

def load_current_phase_from_json():
    print(f"🔍 [DEBUG] Reading phases from: {PHASES_FILE}")
    
    if not os.path.exists(PHASES_FILE):
        print(f"❌ [DEBUG] File not found: {PHASES_FILE}")
        return None, None

    try:
        with open(PHASES_FILE, 'r', encoding='utf-8') as f:
            schedule = json.load(f)
        
        print(f"   -> Loaded {len(schedule)} entries from JSON.")
        if len(schedule) > 0:
            print(f"   -> Sample Entry keys: {list(schedule[0].keys())}")

        today = datetime.now()
        print(f"   -> Today's Date: {today.strftime('%Y-%m-%d')}")
        
        sorted_weeks = []
        for entry in schedule:
            # 1. FIND THE DATE KEY
            d_str = entry.get('date') or entry.get('week_ending') or entry.get('Week Ending')
            
            if not d_str:
                print("   -> [SKIP] Entry missing date/week_ending key.")
                continue

            # 2. PARSE DATE
            d_obj = parse_date(d_str)
            if d_obj:
                sorted_weeks.append((d_obj, entry))
            else:
                print(f"   -> [SKIP] Could not parse date: '{d_str}'")

        if not sorted_weeks:
            print("❌ [DEBUG] No valid dates found in phases.json.")
            return None, None

        # Sort by date
        sorted_weeks.sort(key=lambda x: x[0])
        print(f"   -> Date Range found: {sorted_weeks[0][0].strftime('%Y-%m-%d')} to {sorted_weeks[-1][0].strftime('%Y-%m-%d')}")

        # 3. FIND CURRENT WEEK
        current_entry = None
        for week_date, data in sorted_weeks:
            # Check if this week ends in the future (or is today)
            if week_date >= today:
                print(f"✅ [DEBUG] Found Active Week: {week_date.strftime('%Y-%m-%d')} (>= {today.strftime('%Y-%m-%d')})")
                current_entry = data
                break
        
        # Grace period logic
        if not current_entry:
            last_date = sorted_weeks[-1][0]
            days_diff = (today - last_date).days
            print(f"⚠️ [DEBUG] No future week found. Last plan date was {last_date.strftime('%Y-%m-%d')} ({days_diff} days ago).")
            if days_diff <= 7:
                 print("   -> Within 7-day grace period. Using last week.")
                 current_entry = sorted_weeks[-1][1]

        if current_entry:
            # 4. EXTRACT DATA (Robust Key Search)
            p = current_entry.get('Phase') or current_entry.get('phase') or "Unknown Phase"
            
            b = (current_entry.get('Block / Focus') or 
                 current_entry.get('Block') or 
                 current_entry.get('block') or 
                 "")
            
            m = (current_entry.get('Microcycle Type') or 
                 current_entry.get('microcycle') or 
                 current_entry.get('Microcycle') or 
                 "")
            
            print(f"   -> Raw Values Found: Phase='{p}', Block='{b}', Micro='{m}'")
            
            # Construct Block String
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
        print(f"❌ [DEBUG] Exception parsing phases.json: {e}")
    
    return None, None

def main():
    print("--- STARTING TOP CARD GENERATION ---")

    # 1. Determine Phase & Block
    phase_part, block_part = load_current_phase_from_json()
    
    # STRICT FALLBACK
    if not phase_part or phase_part == "Unknown Phase":
        print("⚠️ [DEBUG] No active phase returned. Defaulting to Offseason.")
        phase_part = "Offseason"
        block_part = ""

    # 2. Flexible Table Parsing for Races
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

            # Try parsing event date (supports Markdown formats usually)
            d_obj = parse_date(date_str)
            if d_obj and d_obj.date() >= today.date():
                events.append({
                    "name": event_name,
                    "date": d_obj,
                    "priority": priority,
                    "days_out": (d_obj - today).days
                })
    else:
        print(f"⚠️ Warning: Plan file not found at {PLAN_FILE}")

    # 3. Apply Priority Logic
    next_event = "No Event"
    next_event_name = "No Event"
    days_to_go = "--"
    
    if events:
        events.sort(key=lambda x: x['date'])
        found_event = None
        
        # Priority sort: A -> B -> C -> Next Available
        for level in ['A', 'B', 'C']:
            level_events = [e for e in events if e['priority'] == level]
            if level_events:
                found_event = level_events[0]
                break
        
        if not found_event:
            found_event = events[0]

        p_label = f" ({found_event['priority']} Race)" if found_event['priority'] != "None" else ""
        next_event = f"{found_event['name']}{p_label}"
        next_event_name = found_event['name']
        
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
        
    print(f"\n✅ SUCCESS: {phase_part} | {block_part} | {days_to_go}")

if __name__ == "__main__":
    main()

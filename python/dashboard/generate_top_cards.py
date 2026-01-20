import json
import os
import re
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN_FILE = os.path.join(BASE_DIR, 'endurance_plan.md')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'top_cards.json')

def main():
    if not os.path.exists(PLAN_FILE):
        print(f"Error: {PLAN_FILE} not found.")
        return

    with open(PLAN_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    content = "".join(lines)

    # 1. Parse Phase and Block
    status_match = re.search(r'\*\*Status:\*\*\s*(.*)', content)
    full_status = status_match.group(1).strip() if status_match else "Unknown Phase"
    
    # Split "Phase 1 (Base/Prep) - Block 2 Week 1 (Loading)" into two parts
    phase_part = "Unknown Phase"
    block_part = ""
    if " - " in full_status:
        parts = full_status.split(" - ")
        phase_part = parts[0].strip()
        block_part = parts[1].strip()
    else:
        phase_part = full_status

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
            if date_val >= today:
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
    days_to_go = "--"
    
    for level in ['A', 'B', 'C']:
        level_events = [e for e in events if e['priority'] == level]
        if level_events:
            level_events.sort(key=lambda x: x['date'])
            winner = level_events[0]
            next_event = f"{winner['name']} ({winner['priority']} Race)"
            days_to_go = winner['days_out']
            break

    # 4. Save to JSON
    result = {
        "phase": phase_part,
        "block": block_part,
        "next_event": next_event,
        "days_to_go": days_to_go,
        "last_updated": datetime.now().isoformat()
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=4)
        
    print(f"✅ Top cards generated: {phase_part} | {block_part}")

if __name__ == "__main__":
    main()
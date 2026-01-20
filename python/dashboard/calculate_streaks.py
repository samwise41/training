import json
import os
from datetime import datetime, timedelta

# Path Setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
LOG_FILE = os.path.join(root_dir, 'data', 'training_log.json')
OUTPUT_FILE = os.path.join(root_dir, 'data', 'dashboard', 'streaks.json')

def get_sunday_start(date_obj):
    """Returns the Sunday at the start of the given date's week."""
    # In Python, weekday() is 0 for Monday... 6 for Sunday.
    # To get Sunday, we check if it's already Sunday.
    days_to_subtract = (date_obj.weekday() + 1) % 7
    return date_obj - timedelta(days=days_to_subtract)

def main():
    if not os.path.exists(LOG_FILE):
        print(f"Error: {LOG_FILE} not found.")
        return

    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        logs = json.load(f)

    # 1. Group logs by Sunday of their week
    weeks_map = {}
    for entry in logs:
        if not entry.get('date'): continue
        
        # Parse date and find the Sunday starting that week
        dt = datetime.strptime(entry['date'].split('T')[0], '%Y-%m-%d')
        sunday_str = get_sunday_start(dt).strftime('%Y-%m-%d')
        
        if sunday_str not in weeks_map:
            weeks_map[sunday_str] = {'planned': 0, 'actual': 0, 'failed': False, 'has_planned': False}
        
        plan_dur = entry.get('plannedDuration', 0) or 0
        act_dur = entry.get('actualDuration', 0) or 0
        status = (entry.get('status') or '').upper()

        weeks_map[sunday_str]['planned'] += plan_dur
        weeks_map[sunday_str]['actual'] += act_dur
        
        if plan_dur > 0:
            weeks_map[sunday_str]['has_planned'] = True
            # Week fails if a workout was planned but missed or had no duration
            if status == 'MISSED' or (act_dur == 0 and status != 'COMPLETED'):
                weeks_map[sunday_str]['failed'] = True

    # 2. Sort weeks descending (newest first)
    sorted_sundays = sorted(weeks_map.keys(), reverse=True)
    
    # Define "This Sunday" to identify the current incomplete week
    today_sunday = get_sunday_start(datetime.now()).strftime('%Y-%m-%d')
    
    daily_streak = 0
    volume_streak = 0
    
    # 3. Calculate Daily Streak (Perfect Weeks: Sun-Sat)
    for s in sorted_sundays:
        if s >= today_sunday: continue # Skip current week
        if not weeks_map[s]['has_planned']: continue # Skip weeks with no plan
        
        if not weeks_map[s]['failed']:
            daily_streak += 1
        else:
            break # Streak broken

    # 4. Calculate Volume Streak (>95% compliance: Sun-Sat)
    for s in sorted_sundays:
        if s >= today_sunday: continue
        stats = weeks_map[s]
        
        if stats['planned'] == 0:
            volume_streak += 1
        else:
            if (stats['actual'] / stats['planned']) >= 0.95:
                volume_streak += 1
            else:
                break # Streak broken

    # Save Result
    result = {
        "daily_streak": daily_streak,
        "volume_streak": volume_streak,
        "week_type": "Sunday-Saturday",
        "last_updated": datetime.now().isoformat()
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=4)
    
    print(f"✅ Streaks Updated (Sun-Sat): Daily={daily_streak}, Volume={volume_streak}")

if __name__ == "__main__":
    main()
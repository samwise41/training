import sys
import os
import json
import pandas as pd
from garminconnect import Garmin

# --- IMPORT FIX ---
# Add current directory to path so we can import 'config' from the same folder
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import config

# --- CONFIGURATION ---
JSON_FILE = config.GARMIN_JSON
MASTER_DB = config.MASTER_DB

def get_credentials():
    email = os.environ.get('GARMIN_EMAIL')
    password = os.environ.get('GARMIN_PASSWORD')
    return email, password

def fetch_specific_activity(activity_id):
    """
    1. Checks if the activity is already in the JSON file.
    2. If not, logs into Garmin, performs a Deep Fetch, and appends it to JSON.
    """
    print(f"🔎 Looking for Activity {activity_id}...")
    
    data = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    
    # Check if exists in local JSON
    match = next((x for x in data if str(x.get('activityId')) == str(activity_id)), None)
    
    if match:
        print("   ✅ Found in local JSON cache.")
        return match
    
    # Not found, fetch from Garmin
    print("   ⚠️ Not found locally. Fetching from Garmin...")
    email, password = get_credentials()
    if not email or not password:
        print("   ❌ Error: Credentials missing. Cannot fetch from Garmin.")
        return None
        
    try:
        client = Garmin(email, password)
        client.login()
        activity = client.get_activity(activity_id) # Deep fetch by default
        
        # Normalize RPE/Feeling from Deep Data immediately
        if 'summaryDTO' in activity:
            raw_rpe = activity['summaryDTO'].get('directWorkoutRpe')
            raw_feel = activity['summaryDTO'].get('directWorkoutFeel')
            if raw_rpe: activity['perceivedEffort'] = int(raw_rpe / 10)
            if raw_feel: activity['feeling'] = int((raw_feel / 25) + 1)
        
        # Save to JSON
        data.append(activity)
        data.sort(key=lambda x: x.get('startTimeLocal', ''), reverse=True)
        
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print("   💾 Fetched from Garmin and saved to JSON.")
        return activity
        
    except Exception as e:
        print(f"   ❌ Garmin Fetch Error: {e}")
        return None

def update_database_row(activity_id, garmin_data):
    """
    Reads the Master DB, finds the row with the matching activityId, 
    and updates all metrics, name, and duration.
    """
    print(f"📝 Hydrating Master Database row for ID: {activity_id}...")
    
    if not os.path.exists(MASTER_DB):
        print("   ❌ Database not found.")
        return

    with open(MASTER_DB, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if len(lines) < 2: return
    header = [h.strip() for h in lines[0].strip('|').split('|')]
    col_map = {name: i for i, name in enumerate(header)}
    
    # Columns to sync
    cols_to_sync = [
        'duration', 'distance', 'averageHR', 'maxHR', 
        'aerobicTrainingEffect', 'anaerobicTrainingEffect', 'trainingEffectLabel',
        'avgPower', 'maxPower', 'normPower', 'trainingStressScore', 'intensityFactor',
        'averageSpeed', 'maxSpeed', 'vO2MaxValue', 'calories', 'elevationGain',
        'averageBikingCadenceInRevPerMinute', 
        'averageRunningCadenceInStepsPerMinute',
        'avgStrideLength', 'avgVerticalOscillation', 'avgGroundContactTime'
    ]

    updated_lines = []
    row_found = False
    
    for line in lines:
        if '|' not in line or '---' in line or 'Status' in line:
            updated_lines.append(line)
            continue
            
        cols = [c.strip() for c in line.strip('|').split('|')]
        
        current_id = ""
        if 'activityId' in col_map and col_map['activityId'] < len(cols):
            current_id = cols[col_map['activityId']]
            
        if current_id == str(activity_id):
            row_found = True
            print("   ✅ Found matching row in DB. Updating...")
            
            while len(cols) < len(header):
                cols.append("")

            # 1. Update Name & Type
            g_type = garmin_data.get('activityType', {}).get('typeKey', '').lower()
            prefix = "[RUN]" if 'run' in g_type else "[BIKE]" if 'cycl' in g_type or 'virt' in g_type else "[SWIM]" if 'swim' in g_type else ""
            raw_name = garmin_data.get('activityName', 'Activity')
            
            if prefix and prefix not in raw_name: new_name = f"{prefix} {raw_name}"
            else: new_name = raw_name
            
            if 'Actual Workout' in col_map: cols[col_map['Actual Workout']] = new_name
            if 'activityType' in col_map: cols[col_map['activityType']] = g_type
            if 'sportTypeId' in col_map: cols[col_map['sportTypeId']] = str(garmin_data.get('sportTypeId', ''))

            # 2. Update Duration
            if 'Actual Duration' in col_map:
                try:
                    dur_sec = float(garmin_data.get('duration', 0))
                    cols[col_map['Actual Duration']] = f"{dur_sec/60:.1f}"
                except: pass

            # 3. Update Metrics
            for key in cols_to_sync:
                if key in col_map and key in garmin_data:
                    val = garmin_data[key]
                    if val is not None:
                        cols[col_map[key]] = str(val)

            # 4. Update RPE/Feeling
            if 'RPE' in col_map:
                rpe = garmin_data.get('perceivedEffort')
                if rpe: cols[col_map['RPE']] = str(rpe)
            
            if 'Feeling' in col_map:
                feel = garmin_data.get('feeling')
                if feel: cols[col_map['Feeling']] = str(feel)

            new_line = "| " + " | ".join(cols) + " |\n"
            updated_lines.append(new_line)
        else:
            updated_lines.append(line)

    if row_found:
        with open(MASTER_DB, 'w', encoding='utf-8') as f:
            f.writelines(updated_lines)
        print("   ✅ Database updated successfully.")
    else:
        print(f"   ❌ Could not find row with activityId {activity_id} in Master DB.")

def main():
    if len(sys.argv) > 1:
        act_id = sys.argv[1]
    else:
        try:
            act_id = input("Enter Activity ID to Hydrate: ").strip()
        except:
            print("❌ No input provided.")
            return

    if not act_id:
        print("❌ Error: Activity ID is required.")
        return

    data = fetch_specific_activity(act_id)
    if data:
        update_database_row(act_id, data)

if __name__ == "__main__":
    main()

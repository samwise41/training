import pandas as pd
import numpy as np
import json
import os
import re
import ast
from datetime import datetime, timedelta
from . import config

# --- CONFIGURATION ---
SYNC_WINDOW_DAYS = 60  

def load_master_db():
    if not os.path.exists(config.MASTER_DB): 
        return pd.DataFrame(columns=config.MASTER_COLUMNS)
    
    with open(config.MASTER_DB, 'r', encoding='utf-8') as f: 
        lines = f.readlines()
    
    if len(lines) < 3: 
        return pd.DataFrame(columns=config.MASTER_COLUMNS)
    
    header = [h.strip() for h in lines[0].strip('|').split('|')]
    data = []
    for line in lines[2:]:
        if '|' not in line: continue
        row = [c.strip() for c in line.strip('|').split('|')]
        if len(row) < len(header): 
            row += [''] * (len(header) - len(row))
        data.append(dict(zip(header, row)))
    
    return pd.DataFrame(data)

def clean_corrupt_data(df):
    if 'activityType' in df.columns:
        def fix_type(val):
            val = str(val).strip()
            if val.startswith("{") and "typeKey" in val:
                try:
                    d = ast.literal_eval(val)
                    return d.get('typeKey', '')
                except:
                    match = re.search(r"'typeKey':\s*'([^']+)'", val)
                    return match.group(1) if match else val
            return val
        df['activityType'] = df['activityType'].apply(fix_type)
    return df

# --- HELPER: FORMAT ACTIVITY NAME WITH PREFIX ---
def format_activity_name(raw_name, type_key):
    """
    Ensures the activity name has the correct [TAG].
    """
    raw_name = raw_name or "Activity"
    t = str(type_key).lower()
    
    prefix = ""
    if 'run' in t: prefix = "[RUN]"
    elif 'cycl' in t or 'bik' in t or 'virt' in t: prefix = "[BIKE]"
    elif 'swim' in t: prefix = "[SWIM]"
    
    # Only add prefix if not already present
    if prefix and prefix not in raw_name:
        return f"{prefix} {raw_name}"
    return raw_name

def extract_weekly_table():
    if not os.path.exists(config.PLAN_FILE): return pd.DataFrame()
    with open(config.PLAN_FILE, 'r', encoding='utf-8') as f: lines = f.readlines()
    
    table_lines, found_header = [], False
    for line in lines:
        s = line.strip()
        if not found_header:
            if s.startswith('#') and 'weekly schedule' in s.lower(): found_header = True
            continue
        if (s.startswith('# ') or s.startswith('## ')) and len(table_lines) > 2: break
        if '|' in s: table_lines.append(s)
            
    if not found_header or not table_lines: return pd.DataFrame()
    
    raw_header = [h.strip() for h in table_lines[0].strip('|').split('|')]
    col_map = {}
    for i, h in enumerate(raw_header):
        clean_h = h.lower().replace(' ', '')
        if 'date' in clean_h: col_map['Date'] = i
        elif 'day' in clean_h: col_map['Day'] = i
        elif 'plannedworkout' in clean_h: col_map['Planned Workout'] = i
        elif 'plannedduration' in clean_h or 'dur(min)' in clean_h: col_map['Planned Duration'] = i
        elif 'notes' in clean_h: col_map['Notes'] = i
        
    data = []
    for line in table_lines[1:]:
        if '---' in line: continue
        row_vals = [c.strip() for c in line.strip('|').split('|')]
        row_dict = {}
        for col_name, idx in col_map.items():
            if idx < len(row_vals): row_dict[col_name] = row_vals[idx]
            else: row_dict[col_name] = ""
        data.append(row_dict)
    return pd.DataFrame(data)

def detect_sport(text):
    t = text.upper()
    if '[RUN]' in t or 'RUN' in t or 'JOG' in t: return 'RUN'
    if '[BIKE]' in t or 'BIKE' in t or 'CYCLE' in t or 'RIDE' in t or 'ZWIFT' in t: return 'BIKE'
    if '[SWIM]' in t or 'SWIM' in t or 'POOL' in t: return 'SWIM'
    return 'OTHER'

def is_value_different(db_val, json_val):
    str_db = str(db_val).strip()
    if not str_db or str_db.lower() == 'nan': return False
    try:
        f_db = float(str_db)
        f_json = float(json_val)
        return abs(f_db - f_json) > 0.1
    except:
        return str_db != str(json_val).strip()

def bundle_activities(activities):
    if not activities: return None
    activities.sort(key=lambda x: x.get('duration', 0), reverse=True)
    main_act = activities[0]
    combined = main_act.copy()
    
    combined['duration'] = sum(a.get('duration', 0) for a in activities)
    combined['distance'] = sum(a.get('distance', 0) for a in activities)
    combined['calories'] = sum(a.get('calories', 0) for a in activities)
    combined['elevationGain'] = sum(a.get('elevationGain', 0) for a in activities)
    
    def weighted_avg(key):
        numerator = 0
        denominator = 0
        for a in activities:
            val = a.get(key)
            dur = a.get('duration', 0)
            if val is not None and dur > 0:
                numerator += val * dur
                denominator += dur
        return numerator / denominator if denominator > 0 else None

    avg_power = weighted_avg('avgPower')
    norm_power = weighted_avg('normPower') 
    avg_hr = weighted_avg('averageHR')
    avg_speed = weighted_avg('averageSpeed')
    avg_cadence_bike = weighted_avg('averageBikingCadenceInRevPerMinute')
    avg_cadence_run = weighted_avg('averageRunningCadenceInStepsPerMinute')
    
    combined['maxHR'] = max((a.get('maxHR', 0) for a in activities), default=0)
    combined['maxPower'] = max((a.get('maxPower', 0) for a in activities), default=0)
    combined['maxSpeed'] = max((a.get('maxSpeed', 0) for a in activities), default=0)

    rpe = None
    feeling = None
    for a in activities:
        if a.get('perceivedEffort') is not None: 
            rpe = a.get('perceivedEffort')
            break
    for a in activities:
        if a.get('feeling') is not None: 
            feeling = a.get('feeling')
            break

    if avg_power: combined['avgPower'] = avg_power
    if norm_power: combined['normPower'] = norm_power
    if avg_hr: combined['averageHR'] = avg_hr
    if avg_speed: combined['averageSpeed'] = avg_speed
    if avg_cadence_bike: combined['averageBikingCadenceInRevPerMinute'] = avg_cadence_bike
    if avg_cadence_run: combined['averageRunningCadenceInStepsPerMinute'] = avg_cadence_run
    
    if rpe is not None: combined['perceivedEffort'] = rpe
    if feeling is not None: combined['feeling'] = feeling

    if len(activities) > 1:
        combined['activityName'] = f"{main_act.get('activityName')} (+{len(activities)-1})"
        combined['activityId'] = ",".join(str(a.get('activityId')) for a in activities)

    return combined

def extract_ftp(text):
    if not text: return None
    pattern = r"Cycling FTP[:\*]*\s*(\d+)"
    match = re.search(pattern, text, re.IGNORECASE)
    if match: return int(match.group(1))
    return None

def get_current_ftp():
    if not os.path.exists(config.PLAN_FILE): return None
    try:
        with open(config.PLAN_FILE, 'r', encoding='utf-8') as f: 
            content = f.read()
        return extract_ftp(content)
    except: return None

def sync():
    print(f"🔄 SYNC: Merging Plan and Garmin Data (Last {SYNC_WINDOW_DAYS} Days Only)...")
    
    df_master = load_master_db()
    df_master = clean_corrupt_data(df_master)
    
    for col in config.MASTER_COLUMNS:
        if col not in df_master.columns:
            df_master[col] = ""
            
    df_plan = extract_weekly_table()
    
    if not os.path.exists(config.GARMIN_JSON):
        print("❌ Garmin JSON missing.")
        return None
        
    with open(config.GARMIN_JSON, 'r', encoding='utf-8') as f: 
        garmin_data = json.load(f)
        
    garmin_by_date = {}
    for g in garmin_data:
        d = g.get('startTimeLocal', '')[:10]
        if d not in garmin_by_date: garmin_by_date[d] = []
        garmin_by_date[d].append(g)

    today = datetime.now()
    cutoff_date = today - timedelta(days=SYNC_WINDOW_DAYS)
    cutoff_str = cutoff_date.strftime('%Y-%m-%d')
    today_str = today.strftime('%Y-%m-%d')

    # 1. Sync Plan to Master
    if not df_plan.empty:
        count_added = 0
        df_master['Date_Norm'] = pd.to_datetime(df_master['Date'], errors='coerce').dt.strftime('%Y-%m-%d')
        df_plan['Date_Norm'] = pd.to_datetime(df_plan['Date'], errors='coerce').dt.strftime('%Y-%m-%d')
        
        existing_keys = set(zip(df_master['Date_Norm'], df_master['Planned Workout'].str.strip()))
        
        for _, p_row in df_plan.iterrows():
            p_date_norm = p_row['Date_Norm']
            p_workout = str(p_row.get('Planned Workout', '')).strip()
            
            if pd.isna(p_date_norm) or p_date_norm < cutoff_str: 
                continue
            
            p_clean = re.sub(r'[^a-zA-Z0-9\s]', '', p_workout.lower())
            if 'rest day' in p_clean or p_clean in ['rest', 'off', 'day off']: continue
            
            if (p_date_norm, p_workout) not in existing_keys:
                new_row = {c: "" for c in config.MASTER_COLUMNS}
                new_row.update({
                    'Date': p_date_norm,
                    'Day': p_row.get('Day', ''),
                    'Planned Workout': p_workout,
                    'Planned Duration': p_row.get('Planned Duration', ''),
                    'Notes / Targets': p_row.get('Notes', ''),
                    'Status': 'Pending'
                })
                df_master = pd.concat([df_master, pd.DataFrame([new_row])], ignore_index=True)
                existing_keys.add((p_date_norm, p_workout))
                count_added += 1
                
        if 'Date_Norm' in df_master.columns: 
            df_master.drop(columns=['Date_Norm'], inplace=True)
        print(f"   + Added {count_added} new planned workouts.")

    # 2. Link Garmin Data
    claimed_ids = set()
    
    for _, row in df_master.iterrows():
        eid = str(row.get('activityId', '')).strip()
        if eid and eid.lower() != 'nan':
            for sub_id in eid.split(','):
                claimed_ids.add(sub_id.strip())

    cols_to_map = [
        'duration', 'distance', 'averageHR', 'maxHR', 
        'aerobicTrainingEffect', 'anaerobicTrainingEffect', 'trainingEffectLabel',
        'avgPower', 'maxPower', 'normPower', 'trainingStressScore', 'intensityFactor',
        'averageSpeed', 'maxSpeed', 'vO2MaxValue', 'calories', 'elevationGain',
        'activityName', 'sportTypeId',
        'averageBikingCadenceInRevPerMinute', 
        'averageRunningCadenceInStepsPerMinute',
        'avgStrideLength', 'avgVerticalOscillation', 'avgGroundContactTime'
    ]

    for idx, row in df_master.iterrows():
        date_str = str(row.get('Date', '')).strip()
        try: 
            date_obj = pd.to_datetime(date_str)
            date_key = date_obj.strftime('%Y-%m-%d')
        except: continue
        
        if date_key < cutoff_str:
            continue

        candidates = garmin_by_date.get(date_key, [])
        if not candidates: continue

        planned_txt = str(row.get('Planned Workout', '')).upper()
        planned_type = detect_sport(planned_txt)
        
        matches = []
        current_id_str = str(row.get('activityId', '')).strip()
        current_ids = []
        if current_id_str and current_id_str.lower() != 'nan':
             current_ids = [cid.strip() for cid in current_id_str.split(',') if cid.strip()]
        
        for cand in candidates:
            cand_id = str(cand.get('activityId'))
            if cand_id in claimed_ids and cand_id not in current_ids: continue 
            
            is_match = False
            if cand_id in current_ids:
                is_match = True
            elif not current_ids:
                g_type_str = cand.get('activityType', {}).get('typeKey', '').lower()
                g_sport = 'OTHER'
                if 'running' in g_type_str: g_sport = 'RUN'
                elif 'cycling' in g_type_str or 'biking' in g_type_str or 'virtual' in g_type_str: g_sport = 'BIKE'
                elif 'swimming' in g_type_str: g_sport = 'SWIM'
                
                if planned_type != 'OTHER' and planned_type == g_sport:
                    is_match = True
            
            if is_match:
                matches.append(cand)

        if matches:
            composite_match = bundle_activities(matches)
            for m in matches:
                claimed_ids.add(str(m.get('activityId')))

            df_master.at[idx, 'Status'] = 'COMPLETED'
            if str(df_master.at[idx, 'Match Status']) != 'Linked (modified)':
                df_master.at[idx, 'Match Status'] = 'Linked'
            
            df_master.at[idx, 'activityId'] = str(composite_match.get('activityId'))
            
            # --- FIX: Apply Prefix Logic ---
            g_type_key = composite_match.get('activityType', {}).get('typeKey', '')
            raw_name = composite_match.get('activityName', 'Activity')
            new_name = format_activity_name(raw_name, g_type_key)
            # -------------------------------

            df_master.at[idx, 'Actual Workout'] = new_name
            df_master.at[idx, 'activityType'] = g_type_key
            
            try:
                dur_sec = float(composite_match.get('duration', 0))
                df_master.at[idx, 'Actual Duration'] = f"{dur_sec/60:.1f}"
            except: pass

            for col in cols_to_map:
                val = composite_match.get(col, '')
                current_db_val = str(df_master.at[idx, col]).strip()
                if (not current_db_val or current_db_val == 'nan') and val is not None and val != "":
                     df_master.at[idx, col] = val
                elif current_db_val and val is not None and val != "":
                    if is_value_different(current_db_val, val):
                        df_master.at[idx, col] = val 
            
            rpe_val = composite_match.get('perceivedEffort')
            feel_val = composite_match.get('feeling')
            if rpe_val is None and 'summaryDTO' in composite_match:
                raw = composite_match['summaryDTO'].get('directWorkoutRpe')
                if raw: rpe_val = int(raw / 10)
            if feel_val is None and 'summaryDTO' in composite_match:
                raw = composite_match['summaryDTO'].get('directWorkoutFeel')
                if raw: feel_val = int((raw / 25) + 1)
            if rpe_val is not None: df_master.at[idx, 'RPE'] = str(rpe_val)
            if feel_val is not None: df_master.at[idx, 'Feeling'] = str(feel_val)

    # 3. Handle Unplanned
    unplanned_rows = []
    all_garmin = [item for sublist in garmin_by_date.values() for item in sublist]
    
    for g in all_garmin:
        g_id = str(g.get('activityId'))
        g_date = g.get('startTimeLocal', '')[:10]
        
        if g_date < cutoff_str or g_date > today_str: continue

        c_type = g.get('activityType', {}).get('typeId')
        c_sport = g.get('sportTypeId')
        is_valid_type = False
        if c_type in config.ALLOWED_SPORT_TYPES: is_valid_type = True
        if c_sport in config.ALLOWED_SPORT_TYPES: is_valid_type = True
        
        if not is_valid_type: continue

        if g_id not in claimed_ids:
            new_row = {c: "" for c in config.MASTER_COLUMNS}
            new_row['Status'] = 'COMPLETED'
            new_row['Match Status'] = 'Unplanned'
            new_row['Date'] = g_date
            
            try:
                if g_date:
                    new_row['Day'] = pd.to_datetime(g_date).day_name()
            except: pass

            new_row['activityId'] = g_id
            
            # --- FIX: Apply Prefix Logic to Unplanned ---
            g_type_key = g.get('activityType', {}).get('typeKey', '')
            raw_name = g.get('activityName', 'Unplanned')
            new_row['Actual Workout'] = format_activity_name(raw_name, g_type_key)
            new_row['activityType'] = g_type_key
            # --------------------------------------------
            
            for col in cols_to_map:
                if col in g: new_row[col] = g[col]
            
            rpe_val = g.get('perceivedEffort')
            if rpe_val is None and 'summaryDTO' in g:
                 raw_rpe = g['summaryDTO'].get('directWorkoutRpe')
                 if raw_rpe: rpe_val = int(raw_rpe / 10)
            if rpe_val: new_row['RPE'] = str(rpe_val)

            feel_val = g.get('feeling')
            if feel_val is None and 'summaryDTO' in g:
                 raw_feel = g['summaryDTO'].get('directWorkoutFeel')
                 if raw_feel: feel_val = int((raw_feel / 25) + 1)
            if feel_val: new_row['Feeling'] = str(feel_val)

            try: new_row['Actual Duration'] = f"{float(g.get('duration', 0))/60:.1f}"
            except: pass
            
            unplanned_rows.append(new_row)

    if unplanned_rows:
        print(f"   + Added {len(unplanned_rows)} unplanned activities.")
        df_master = pd.concat([df_master, pd.DataFrame(unplanned_rows)], ignore_index=True)

    # 4. Hydrate TSS/IF
    current_ftp = get_current_ftp() or 241.0
    for idx, row in df_master.iterrows():
        r_date = str(row.get('Date', ''))
        if r_date < cutoff_str: continue

        act_type = str(row.get('activityType', '')).lower()
        if not ('run' in act_type or 'cycl' in act_type or 'bik' in act_type or 'virtual' in act_type): continue
        try:
            duration = float(row.get('duration', 0))
            np_val = float(row.get('normPower', 0))
        except: continue
        
        if duration > 0 and np_val > 0:
            intensity = np_val / current_ftp
            existing_if = str(row.get('intensityFactor', '')).strip()
            if not existing_if or existing_if == 'nan' or float(existing_if) == 0:
                 df_master.at[idx, 'intensityFactor'] = f"{intensity:.2f}"
            
            existing_tss = str(row.get('trainingStressScore', '')).strip()
            if not existing_tss or existing_tss == 'nan' or float(existing_tss) == 0:
                tss = (duration * np_val * intensity) / (current_ftp * 3600) * 100
                df_master.at[idx, 'trainingStressScore'] = f"{tss:.1f}"

    # 5. Save
    df_master['Date_Sort'] = pd.to_datetime(df_master['Date'], errors='coerce')
    df_master = df_master.sort_values(by='Date_Sort', ascending=False).drop(columns=['Date_Sort'])
    
    print(f"💾 Saving {len(df_master)} rows to Master DB...")
    with open(config.MASTER_DB, 'w', encoding='utf-8') as f:
        f.write("| " + " | ".join(config.MASTER_COLUMNS) + " |\n")
        f.write("| " + " | ".join(['---'] * len(config.MASTER_COLUMNS)) + " |\n")
        for _, row in df_master.iterrows():
            vals = []
            for c in config.MASTER_COLUMNS:
                val = str(row.get(c, ""))
                val = val.replace('\n', ' ').replace('\r', '').replace('|', '/')
                vals.append(val)
            f.write("| " + " | ".join(vals) + " |\n")
    
    return df_master

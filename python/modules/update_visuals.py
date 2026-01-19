import pandas as pd
import os
from . import config

def update_weekly_plan(df_master):
    if not os.path.exists(config.PLAN_FILE): 
        print("⚠️ Plan file not found.")
        return

    print("🎨 UPDATING VISUALS: Syncing Master DB to Plan Markdown...")
    
    # 1. Create a Lookup Dictionary (Date + Sport -> Actual Data)
    lookup = {}
    df_master['Date_Norm'] = pd.to_datetime(df_master['Date'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    for _, row in df_master.iterrows():
        d = row.get('Date_Norm')
        p_work = str(row.get('Planned Workout', '')).upper()
        
        # Determine Sport Tag from Plan
        sport_tag = None
        if '[RUN]' in p_work: sport_tag = 'RUN'
        elif '[BIKE]' in p_work: sport_tag = 'BIKE'
        elif '[SWIM]' in p_work: sport_tag = 'SWIM'
        
        a_work = str(row.get('Actual Workout', '')).strip()
        a_dur = str(row.get('Actual Duration', '')).strip()
        
        # Only add to lookup if we have actual data
        if d and sport_tag and (a_work or a_dur):
            if a_work.lower() == 'nan': a_work = ""
            if a_dur.lower() == 'nan': a_dur = ""
            
            # Key: (Date, Sport) -> Value: (Name, Duration, Status)
            lookup[(d, sport_tag)] = (a_work, a_dur, "COMPLETED")

    # 2. Read and Rewrite the Markdown File
    with open(config.PLAN_FILE, 'r', encoding='utf-8') as f: 
        lines = f.readlines()
        
    new_lines = []
    table_started = False
    header_indices = {}
    
    for line in lines:
        stripped = line.strip()
        
        # A. Detect Table Start
        if not table_started:
            if stripped.startswith('|') and 'date' in stripped.lower() and 'day' in stripped.lower():
                table_started = True
                headers = [h.strip().lower() for h in stripped.strip('|').split('|')]
                for i, h in enumerate(headers):
                    if 'date' in h: header_indices['date'] = i
                    elif 'planned workout' in h: header_indices['planned_workout'] = i
                    elif 'actual workout' in h: header_indices['actual_workout'] = i
                    elif 'actual duration' in h: header_indices['actual_duration'] = i
                    elif 'status' in h: header_indices['status'] = i
            new_lines.append(line)
            continue
            
        # B. Process Table Rows
        if table_started and stripped.startswith('|') and '---' not in stripped:
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            try:
                # Extract key data from the row
                if 'date' in header_indices and 'planned_workout' in header_indices:
                    row_date_raw = cols[header_indices['date']]
                    row_plan_raw = cols[header_indices['planned_workout']].upper()
                    row_date = pd.to_datetime(row_date_raw, errors='coerce').strftime('%Y-%m-%d')
                    
                    row_tag = None
                    if '[RUN]' in row_plan_raw: row_tag = 'RUN'
                    elif '[BIKE]' in row_plan_raw: row_tag = 'BIKE'
                    elif '[SWIM]' in row_plan_raw: row_tag = 'SWIM'
                    
                    key = (row_date, row_tag)
                    
                    # If we found a match in the Master DB, update this row
                    if key in lookup:
                        act_work, act_dur, status_update = lookup[key]
                        
                        if 'actual_workout' in header_indices: 
                            cols[header_indices['actual_workout']] = act_work
                        if 'actual_duration' in header_indices: 
                            cols[header_indices['actual_duration']] = act_dur
                        if 'status' in header_indices: 
                            cols[header_indices['status']] = status_update
                            
                        # Reconstruct the line
                        new_line = "| " + " | ".join(cols) + " |\n"
                        new_lines.append(new_line)
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            except:
                new_lines.append(line)
        else:
            # Outside the table, just copy the line
            new_lines.append(line)

    # 3. Write Changes
    with open(config.PLAN_FILE, 'w', encoding='utf-8') as f: 
        f.writelines(new_lines)
    
    print("✅ Visuals updated in endurance_plan.md")

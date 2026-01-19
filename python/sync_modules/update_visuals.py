import json
import os
import re
from . import config

def load_db():
    if not os.path.exists(config.MASTER_DB_JSON): return []
    with open(config.MASTER_DB_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    if not os.path.exists(config.PLAN_MARKDOWN): return

    db = load_db()
    # Create lookup: Date|ActivityType -> Record
    db_map = {f"{r['date']}|{r['activityType']}": r for r in db}

    with open(config.PLAN_MARKDOWN, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_table = False
    headers = []
    header_idx = {}

    for line in lines:
        stripped = line.strip()
        
        if '| Status |' in stripped and 'Planned Workout' in stripped:
            in_table = True
            headers = [h.strip() for h in stripped.strip('|').split('|')]
            header_idx = {h: i for i, h in enumerate(headers)}
            new_lines.append(line)
            continue

        if in_table:
            if not stripped.startswith('|'):
                in_table = False
                new_lines.append(line)
                continue
            
            if '---' in stripped:
                new_lines.append(line)
                continue

            # Process Row
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            
            # Guard against malformed rows
            if len(cols) < len(headers):
                new_lines.append(line)
                continue

            # Get Keys
            date_idx = header_idx.get('Date')
            p_work_idx = header_idx.get('Planned Workout')
            
            if date_idx is not None and p_work_idx is not None:
                r_date = cols[date_idx]
                p_work = cols[p_work_idx]
                
                # Determine Type
                act_type = 'Other'
                if '[BIKE]' in p_work: act_type = 'Bike'
                elif '[RUN]' in p_work: act_type = 'Run'
                elif '[SWIM]' in p_work: act_type = 'Swim'
                
                key = f"{r_date}|{act_type}"
                
                if key in db_map:
                    record = db_map[key]
                    
                    # Update Columns
                    if 'Actual Workout' in header_idx:
                        cols[header_idx['Actual Workout']] = record.get('actualWorkout', '') or ''
                    
                    if 'Actual Duration' in header_idx:
                        cols[header_idx['Actual Duration']] = str(record.get('actualDuration', ''))
                    
                    if 'Status' in header_idx:
                        cols[header_idx['Status']] = record.get('status', 'PLANNED')

                    # Rebuild Line
                    # Join with " | " and add leading/trailing pipes
                    new_line = "| " + " | ".join(cols) + " |\n"
                    new_lines.append(new_line)
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    with open(config.PLAN_MARKDOWN, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("   -> Endurance Plan Visuals Updated.")

if __name__ == "__main__":
    main()

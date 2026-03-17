import requests
import json

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch events: {e}")
        return

    events_data = response.json()
    all_events = []
    
    # 1=A, 2=B, 3=C, 4=D, 5=E
    category_map = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E'}

    for event in events_data:
        # Extract top-level details
        event_id = event.get("id")
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        start_str = event.get("eventStart", "")

        subgroups = event.get("eventSubgroups", [])
        
        category_details = {} 
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            # Grab distance (meters), duration (seconds), and laps
            dist = sg.get("distanceInMeters", 0)
            dur = sg.get("durationInSeconds", 0)
            laps = sg.get("laps", 0)

            if dist > max_distance:
                max_distance = dist
            if dur > max_duration:
                max_duration = dur

            # Safely grab the pen label integer
            raw_label = sg.get("label")
            try:
                label_num = int(raw_label) if raw_label is not None else None
            except (ValueError, TypeError):
                label_num = None

            # Map category and parse the ZRS "rangeAccessLabel" (e.g., "510-650")
            if label_num in category_map:
                cat_letter = category_map[label_num]
                
                range_label = sg.get("rangeAccessLabel", "")
                score_min = None
                score_max = None
                
                # Split the "510-650" string into min and max integers
                if range_label and isinstance(range_label, str):
                    parts = range_label.split("-")
                    if len(parts) == 2:
                        try:
                            score_min = float(parts[0])
                            score_max = float(parts[1])
                        except ValueError:
                            pass
                    elif "+" in range_label: # In case they use formats like "650+"
                        try:
                            score_min = float(range_label.replace("+", ""))
                            score_max = 1000.0 # Standard max score ceiling
                        except ValueError:
                            pass
                
                category_details[cat_letter] = {
                    "score_min": score_min,
                    "score_max": score_max,
                    "raw_score_label": range_label, # Keeping the raw string just in case
                    "distance_km": round(dist / 1000, 1),
                    "laps": laps
                }

        # Append all parsed data to our main list
        all_events.append({
            "id": event_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": category_details,
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"Successfully saved {len(all_events)} events to events.json")

if __name__ == "__main__":
    build_event_list()

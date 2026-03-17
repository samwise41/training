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

    for event in events_data:
        # 1. Grab Parent Event Details
        parent_id = event.get("id")
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        start_str = event.get("eventStart", "")

        # 2. Look at the subgroups (the individual pens inside the parent event)
        subgroups = event.get("eventSubgroups", [])
        
        categories = {} 
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

            # MAGIC FIX: Grab the letter directly from the subgroupLabel (e.g., "A", "B")
            cat_letter = sg.get("subgroupLabel", "Unknown")

            # Parse the ZRS "rangeAccessLabel" (e.g., "510-650")
            range_label = sg.get("rangeAccessLabel", "")
            score_min = None
            score_max = None
            
            if range_label and isinstance(range_label, str):
                parts = range_label.split("-")
                if len(parts) == 2:
                    try:
                        score_min = float(parts[0])
                        score_max = float(parts[1])
                    except ValueError:
                        pass
                elif "+" in range_label: # Handing formats like "650+"
                    try:
                        score_min = float(range_label.replace("+", ""))
                        score_max = 1000.0
                    except ValueError:
                        pass
            
            # Fallback for standard pace-based rides
            if score_min is None:
                score_min = sg.get("raceScoreMin")
            if score_max is None:
                score_max = sg.get("raceScoreMax")

            # 3. Add this specific pen to our categories dictionary
            categories[cat_letter] = {
                "subgroup_id": sg.get("id"), # The unique ID you found!
                "score_min": score_min,
                "score_max": score_max,
                "raw_score_label": range_label,
                "distance_km": round(dist / 1000, 1),
                "laps": laps
            }

        # 4. Group all categories together under the single Parent Event
        all_events.append({
            "parent_event_id": parent_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": categories, # Groups A, B, C etc. under this one event
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"Successfully saved {len(all_events)} events to events.json")

if __name__ == "__main__":
    build_event_list()

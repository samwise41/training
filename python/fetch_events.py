import requests
import json

# ==========================================
# ROUTE DATABASE (Your "Join" Table)
# Since Zwift has no route API, map known routeIds here.
# Format: routeId: {"name": "Route Name", "lap_km": X.X, "leadin_km": Y.Y}
# ==========================================
ROUTE_DB = {
    # The event from your screenshot:
    3536020075: {"name": "Three Step Sisters", "lap_km": 37.7, "leadin_km": 0.5},
    
    # Examples of other popular routes (you can add more!):
    1: {"name": "Figure 8", "lap_km": 29.8, "leadin_km": 0.2},
    3: {"name": "Flat Route", "lap_km": 10.3, "leadin_km": 0.5},
}

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
        parent_id = event.get("id")
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        start_str = event.get("eventStart", "")

        subgroups = event.get("eventSubgroups", [])
        
        categories = {} 
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            dist = sg.get("distanceInMeters", 0)
            dur = sg.get("durationInSeconds", 0)
            laps = sg.get("laps", 0)
            route_id = sg.get("routeId")

            # Update our max trackers
            if dist > max_distance:
                max_distance = dist
            if dur > max_duration:
                max_duration = dur

            cat_letter = sg.get("subgroupLabel", "Unknown")
            range_label = sg.get("rangeAccessLabel", "")
            score_min, score_max = None, None
            
            # ZRS Parsing
            if range_label and isinstance(range_label, str):
                parts = range_label.split("-")
                if len(parts) == 2:
                    try:
                        score_min = float(parts[0])
                        score_max = float(parts[1])
                    except ValueError:
                        pass
                elif "+" in range_label: 
                    try:
                        score_min = float(range_label.replace("+", ""))
                        score_max = 1000.0
                    except ValueError:
                        pass
            
            if score_min is None:
                score_min = sg.get("raceScoreMin")
            if score_max is None:
                score_max = sg.get("raceScoreMax")

            # ==========================================
            # THE ROUTE JOIN & MATH LOGIC
            # ==========================================
            calculated_distance_km = 0.0
            route_name = "Unknown Route"

            if dist > 0:
                # If Zwift gives us the distance natively, use it!
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_id in ROUTE_DB:
                # If distance is 0, but we have laps AND we know the route!
                route_info = ROUTE_DB[route_id]
                route_name = route_info["name"]
                
                # Math: (Laps * Lap Distance) + Lead-in
                total_km = (laps * route_info["lap_km"]) + route_info["leadin_km"]
                calculated_distance_km = round(total_km, 1)

            # Add it all to the dictionary
            categories[cat_letter] = {
                "subgroup_id": sg.get("id"),
                "route_id": route_id,
                "route_name_mapped": route_name,
                "score_min": score_min,
                "score_max": score_max,
                "raw_score_label": range_label,
                "distance_km": calculated_distance_km, # Now contains the real math!
                "laps": laps
            }

        # Group it all under the Parent Event
        all_events.append({
            "parent_event_id": parent_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": categories, 
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"Successfully saved {len(all_events)} events to events.json")

if __name__ == "__main__":
    build_event_list()

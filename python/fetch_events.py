import requests
import json
import os

# Put the raw JSON URL of your community source here
COMMUNITY_URL = "https://raw.githubusercontent.com/YOUR_COMMUNITY_SOURCE_HERE/routes.json"

def load_json(filename):
    if os.path.exists(filename):
        with open(filename, "r") as f:
            return json.load(f)
    return {}

def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"💾 Saved updates to {filename}")

def fetch_community_routes():
    print("🌐 Checking community source for updated routes...")
    try:
        response = requests.get(COMMUNITY_URL, timeout=10)
        if response.status_code == 200:
            return response.json()
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Could not fetch community routes: {e}")
    return {}

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch events: {e}")
        return

    events_data = response.json()
    
    # 1. Load all databases
    local_routes = load_json("routes.json")
    unknown_routes = load_json("unknown_routes.json")
    community_routes = fetch_community_routes()
    
    routes_updated = False
    unknown_updated = False
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

            if dist > max_distance: max_distance = dist
            if dur > max_duration: max_duration = dur

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
                    except ValueError: pass
                elif "+" in range_label: 
                    try:
                        score_min = float(range_label.replace("+", ""))
                        score_max = 1000.0
                    except ValueError: pass
            
            if score_min is None: score_min = sg.get("raceScoreMin")
            if score_max is None: score_max = sg.get("raceScoreMax")

            # ==========================================
            # DYNAMIC ROUTE JOIN, SYNC & BACKLOG LOGIC
            # ==========================================
            calculated_distance_km = 0.0
            route_name = "Unknown Route"

            if dist > 0:
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_id:
                str_route_id = str(route_id) 
                route_info = None
                
                # Check Community First
                if str_route_id in community_routes:
                    route_info = community_routes[str_route_id]
                    # If it's in the community but not local, sync it!
                    if str_route_id not in local_routes:
                        local_routes[str_route_id] = route_info
                        routes_updated = True
                        print(f"➕ Synced new route from community: {route_info.get('name', str_route_id)}")
                        
                        # Self-Cleaning: Remove it from unknown_routes if it was sitting there
                        if str_route_id in unknown_routes:
                            del unknown_routes[str_route_id]
                            unknown_updated = True
                            print(f"🧹 Removed {str_route_id} from unknown_routes.json (It was solved by the community!)")
                
                # If not in Community, check Local
                elif str_route_id in local_routes:
                    route_info = local_routes[str_route_id]
                
                # If we found info in either database, do the math
                if route_info:
                    route_name = route_info.get("name", "Unknown")
                    lap_km = route_info.get("lap_km", 0.0)
                    leadin_km = route_info.get("leadin_km", 0.0)
                    total_km = (laps * lap_km) + leadin_km
                    calculated_distance_km = round(total_km, 1)
                else:
                    # Missing from everywhere -> Add to our unknown backlog
                    if str_route_id not in unknown_routes:
                        unknown_routes[str_route_id] = {
                            "name": f"UNKNOWN_ROUTE (Found in: {name})",
                            "lap_km": 0.0,
                            "leadin_km": 0.0
                        }
                        unknown_updated = True
                        print(f"⚠️ Added ID '{str_route_id}' to unknown_routes.json")

            categories[cat_letter] = {
                "subgroup_id": sg.get("id"),
                "route_id": route_id,
                "route_name": route_name,
                "score_min": score_min,
                "score_max": score_max,
                "distance_km": calculated_distance_km,
                "laps": laps
            }

        all_events.append({
            "parent_event_id": parent_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": categories, 
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    # Save all the files
    save_json(all_events, "events.json")
    print(f"✅ Successfully saved {len(all_events)} events.")
    
    if routes_updated:
        save_json(local_routes, "routes.json")
    if unknown_updated:
        save_json(unknown_routes, "unknown_routes.json")
        print(f"🛠️ You have {len(unknown_routes)} routes sitting in your unknown_routes.json backlog to manually look up!")

if __name__ == "__main__":
    build_event_list()

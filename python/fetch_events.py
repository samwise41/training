import requests
import json
import os
import re

MJS_URL = "https://raw.githubusercontent.com/andipaetzold/zwift-data/main/data/routes.mjs"

def load_json(filename):
    if os.path.exists(filename):
        try:
            with open(filename, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"🚨 WARNING: {filename} has a syntax error. Returning empty dictionary.")
    return {}

def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"💾 Saved updates to {filename}")

def fetch_slug_map():
    """Fetches the .mjs file and builds a dictionary mapping routeId to slug & name."""
    print("🌐 Fetching slug map from GitHub...")
    slug_map = {}
    try:
        response = requests.get(MJS_URL, timeout=10)
        if response.status_code == 200:
            blocks = re.split(r'\}\s*,?', response.text)
            for block in blocks:
                id_match = re.search(r'(?:id|routeId):\s*([0-9]+)', block)
                slug_match = re.search(r'slug:\s*[\'"]([^\'"]+)[\'"]', block)
                name_match = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', block)
                
                if id_match and slug_match:
                    slug_map[id_match.group(1)] = {
                        "slug": slug_match.group(1),
                        "name": name_match.group(1) if name_match else "Unknown Route"
                    }
            return slug_map
    except Exception as e:
        print(f"⚠️ Failed to fetch slug map: {e}")
    return slug_map

def scrape_zwift_insider(slug):
    """Scrapes ZwiftInsider for the lap and lead-in distances."""
    url = f"https://zwiftinsider.com/route/{slug}/"
    print(f"🕵️ Scraping ZwiftInsider: {url}")
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if response.status_code == 200:
            # Strip all HTML tags from the page so we just have raw text
            clean_text = re.sub(r'<[^>]+>', ' ', response.text)
            
            # Use Regex to find "Length: 16.9 km" and "Lead-In: 0.4 km"
            length_match = re.search(r'Length:\s*([\d.]+)\s*km', clean_text, re.IGNORECASE)
            leadin_match = re.search(r'Lead-In:\s*([\d.]+)\s*km', clean_text, re.IGNORECASE)
            
            lap_km = float(length_match.group(1)) if length_match else 0.0
            leadin_km = float(leadin_match.group(1)) if leadin_match else 0.0
            
            return lap_km, leadin_km
    except Exception as e:
        print(f"⚠️ Failed to scrape ZwiftInsider for {slug}: {e}")
    return None, None

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
    
    local_routes = load_json("routes.json")
    unknown_routes = load_json("unknown_routes.json")
    
    # We will only fetch the slug map if we ACTUALLY encounter a missing route
    slug_map = None 
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
            
            if range_label and isinstance(range_label, str):
                parts = range_label.split("-")
                if len(parts) == 2:
                    try:
                        score_min, score_max = float(parts[0]), float(parts[1])
                    except ValueError: pass
                elif "+" in range_label: 
                    try:
                        score_min, score_max = float(range_label.replace("+", "")), 1000.0
                    except ValueError: pass
            
            if score_min is None: score_min = sg.get("raceScoreMin")
            if score_max is None: score_max = sg.get("raceScoreMax")

            # ==========================================
            # DYNAMIC ROUTE JOIN & AUTO-SCRAPER LOGIC
            # ==========================================
            calculated_distance_km = 0.0
            route_name = "Unknown Route"

            if dist > 0:
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_id:
                str_route_id = str(route_id) 
                
                # Check Local DB First
                if str_route_id in local_routes:
                    route_info = local_routes[str_route_id]
                    route_name = route_info.get("name", "Unknown")
                    lap_km = route_info.get("lap_km", 0.0)
                    leadin_km = route_info.get("leadin_km", 0.0)
                    calculated_distance_km = round((laps * lap_km) + leadin_km, 1)
                
                # Auto-Scrape Pipeline if missing
                else:
                    if slug_map is None:
                        slug_map = fetch_slug_map() # Only fetch if we need it!
                    
                    if str_route_id in slug_map:
                        route_data = slug_map[str_route_id]
                        route_name = route_data["name"]
                        slug = route_data["slug"]
                        
                        # Trigger the ZwiftInsider Scraper
                        lap_km, leadin_km = scrape_zwift_insider(slug)
                        
                        if lap_km is not None:
                            # SUCCESS! Save to local database so we never scrape it again
                            local_routes[str_route_id] = {
                                "name": route_name,
                                "lap_km": lap_km,
                                "leadin_km": leadin_km
                            }
                            routes_updated = True
                            calculated_distance_km = round((laps * lap_km) + leadin_km, 1)
                            print(f"✨ Auto-Scraped successfully: {route_name} ({lap_km}km lap)")
                            
                            # Clean up backlog if it was in there
                            if str_route_id in unknown_routes:
                                del unknown_routes[str_route_id]
                                unknown_updated = True
                        else:
                            # Scrape failed (maybe ZwiftInsider formatted the page weird)
                            if str_route_id not in unknown_routes:
                                unknown_routes[str_route_id] = {"name": route_name, "lap_km": 0.0, "leadin_km": 0.0}
                                unknown_updated = True
                    else:
                        # Missing from GitHub .mjs file entirely
                        if str_route_id not in unknown_routes:
                            unknown_routes[str_route_id] = {"name": f"UNKNOWN (Event: {name})", "lap_km": 0.0, "leadin_km": 0.0}
                            unknown_updated = True

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

    # Save everything
    save_json(all_events, "events.json")
    print(f"\n✅ Successfully saved {len(all_events)} events.")
    
    if routes_updated:
        save_json(local_routes, "routes.json")
    if unknown_updated:
        save_json(unknown_routes, "unknown_routes.json")
        print(f"🛠️ {len(unknown_routes)} routes are still missing and sitting in your backlog.")

if __name__ == "__main__":
    build_event_list()

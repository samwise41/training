import requests
import json

def run_diagnostic():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    response = requests.get(url, headers=headers)
    events = response.json()

    for event in events:
        # Search specifically for the event in your screenshot
        if "Three Step Sisters" in event.get("name", ""):
            print(f"--- RAW JSON FOR {event['name']} ---")
            
            # Grab the first subgroup (the 'A' pen) and print everything inside it
            subgroups = event.get("eventSubgroups", [])
            if subgroups:
                print(json.dumps(subgroups[0], indent=4))
            break

if __name__ == "__main__":
    run_diagnostic()

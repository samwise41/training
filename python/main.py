import sys
import os
import subprocess

# Ensure we can import local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.append(SCRIPT_DIR)

# --- Strava Paths ---
STRAVA_CYCLING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'cycling', 'process_cycling.py')
STRAVA_RUNNING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'running', 'process_running.py')

# --- Module Imports ---
from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

# --- Dashboard & Data Tabs ---
try:
    from readiness import createReadiness
    from gear import createGear
    from zones import createZones   
    from dashboard import calculateHeatmaps, calculate_streaks, generate_plannedWorkouts, generate_top_cards
    from Trends import createTrends
except ImportError as e:
    print(f"⚠️ Import Warning: {e}")

def main():
    print("🚀 STARTING DAILY TRAINING SYNC PIPELINE")
    print("==================================================")

    # 1. Fetch Garmin
    print("\n[STEP 1] Fetching Garmin Data...")
    try:
        fetch_garmin.main()
    except Exception as e:
        print(f"⚠️ Garmin Fetch Warning: {e}")

    # 1.5 Sync Strava
    print("\n[STEP 1.5] Syncing Strava...")
    try:
        if os.path.exists(STRAVA_CYCLING_SCRIPT):
            subprocess.run([sys.executable, STRAVA_CYCLING_SCRIPT], check=True)
        if os.path.exists(STRAVA_RUNNING_SCRIPT):
            subprocess.run([sys.executable, STRAVA_RUNNING_SCRIPT], check=True)
    except Exception as e:
        print(f"⚠️ Strava Sync Warning: {e}")

    # 2. Sync Database 
    print("\n[STEP 2] Syncing Databases...")
    try:
        sync_database.main()
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")
        return 

    # 2.5 Generate All Tab Data (THIS IS THE MISSING PIECE)
    print("\n[STEP 2.5] Generating Tab Data...")
    try:
        print("   -> Running Zones...")
        createZones.main() 
        
        print("   -> Running Gear...")
        createGear.main()
        
        print("   -> Running Readiness...")
        createReadiness.main()
        
        print("   -> Running Trends...")
        createTrends.main()

        print("   -> Running Dashboard Widgets...")
        calculateHeatmaps.main()
        calculate_streaks.main()
        generate_plannedWorkouts.main() 
        generate_top_cards.main()
        
    except Exception as e:
        print(f"⚠️ Tab Generation Warning: {e}")

    # 3. Analyze Trends
    print("\n[STEP 3] Analyzing Trends...")
    analyze_trends.main()

    # 4. Update Visuals
    print("\n[STEP 4] Updating Visuals...")
    update_visuals.main()

    # 5. Save to Git
    print("\n[STEP 5] Saving to Git...")
    git_ops.main()

    print("\n✅ PIPELINE COMPLETE")

if __name__ == "__main__":
    main()

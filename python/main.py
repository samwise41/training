import sys
import os
import time
import subprocess

# Ensure we can import local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR) # Moves up from /python/ to project root
sys.path.append(SCRIPT_DIR)

# --- Define Paths to Strava Scripts ---
STRAVA_CYCLING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'cycling', 'process_cycling.py')
STRAVA_RUNNING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'running', 'process_running.py')

# --- Original Imports ---
from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

# --- Dashboard Tab Imports ---
try:
    from readiness import createReadiness
    from gear import createGear
    from dashboard import calculateHeatmaps, calculate_streaks, generate_plannedWorkouts, generate_top_cards
    from Trends import createTrends
except ImportError as e:
    print(f"⚠️ Import Warning: Could not import one or more dashboard modules. {e}")

def main():
    print("🚀 STARTING DAILY TRAINING SYNC PIPELINE")
    print("==================================================")

    # STEP 1: Fetch from Garmin
    print("\n[STEP 1] Fetching Data from Garmin...")
    try:
        fetch_garmin.main()
    except Exception as e:
        print(f"⚠️ Garmin Fetch Warning (Non-blocking): {e}")

    # STEP 1.5: Fetch from Strava (Cycling & Running)
    print("\n[STEP 1.5] Syncing Strava Data...")
    try:
        # 1. Run Cycling Script
        if os.path.exists(STRAVA_CYCLING_SCRIPT):
            print("   🚴 Running Cycling Power Processor...")
            # uses sys.executable to ensure we use the same python environment
            subprocess.run([sys.executable, STRAVA_CYCLING_SCRIPT], check=True)
        else:
            print(f"   ⚠️ Script not found: {STRAVA_CYCLING_SCRIPT}")

        # 2. Run Running Script
        if os.path.exists(STRAVA_RUNNING_SCRIPT):
            print("   🏃 Running Running Pace Processor...")
            subprocess.run([sys.executable, STRAVA_RUNNING_SCRIPT], check=True)
        else:
            print(f"   ⚠️ Script not found: {STRAVA_RUNNING_SCRIPT}")

    except subprocess.CalledProcessError as e:
        print(f"   ⚠️ Strava Sync Execution Failed: {e}")
    except Exception as e:
        print(f"   ⚠️ Strava Sync General Error: {e}")

    # STEP 2: Database Synchronization
    print("\n[STEP 2] Syncing Databases (Plan + Actuals)...")
    try:
        sync_database.main()
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")
        return 

    # STEP 2.5: Generate Dashboard JSONs
    print("\n[STEP 2.5] Generating Dashboard Tab Data...")
    try:
        print("   -> Running Readiness...")
        createReadiness.main()
        
        print("   -> Running Gear...")
        createGear.main()
        
        print("   -> Running Dashboard Widgets...")
        calculateHeatmaps.main()
        calculate_streaks.main()
        generate_plannedWorkouts.main()
        generate_top_cards.main()
        
        print("   -> Running Trends...")
        createTrends.main()
        
    except Exception as e:
        print(f"⚠️ Dashboard Generation Warning: {e}")

    # STEP 3: Analyze Trends
    print("\n[STEP 3] Analyzing Trends & Generating Briefing...")
    try:
        analyze_trends.main()
    except Exception as e:
        print(f"⚠️ Analysis Warning: {e}")

    # STEP 4: Update Visuals
    print("\n[STEP 4] Updating Endurance Plan Markdown...")
    try:
        update_visuals.main()
    except Exception as e:
        print(f"⚠️ Visuals Update Warning: {e}")

    # STEP 5: Git Operations
    print("\n[STEP 5] Saving to Git...")
    try:
        # Note: git_ops.py typically has a specific list of files it adds.
        # Since we just added Strava files, we might want to ensure they are staged.
        # This command manually adds the strava_data folder to staging before git_ops runs.
        subprocess.run(["git", "add", "strava_data"], check=False)
        
        git_ops.main()
    except Exception as e:
        print(f"⚠️ Git Warning: {e}")

    print("\n==================================================")
    print("✅ PIPELINE COMPLETE")

if __name__ == "__main__":
    main()

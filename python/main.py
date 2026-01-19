import sys
import os
import time

# Ensure we can import local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

def main():
    print("🚀 STARTING DAILY TRAINING SYNC PIPELINE")
    print("==================================================")

    # STEP 1: Fetch from Garmin
    print("\n[STEP 1] Fetching Data from Garmin...")
    try:
        fetch_garmin.main()
    except Exception as e:
        print(f"⚠️ Garmin Fetch Warning (Non-blocking): {e}")

    # STEP 2: Database Synchronization
    print("\n[STEP 2] Syncing Databases (Plan + Actuals)...")
    try:
        sync_database.main()
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")
        # We generally stop here if the DB fails as downstream depends on it
        return 

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
        git_ops.main()
    except Exception as e:
        print(f"⚠️ Git Warning: {e}")

    print("\n==================================================")
    print("✅ PIPELINE COMPLETE")

if __name__ == "__main__":
    main()

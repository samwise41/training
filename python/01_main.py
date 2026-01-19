import sys
import os

# Ensure we can import from local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

# Import our new modular components
import _01_fetch_garmin
import _01_analyze_trends
from modules import config, sync_database, update_visuals, git_ops

def main():
    print("🚀 STARTING DAILY TRAINING SYNC")
    print("==================================================")

    # STEP 1: Fetch from Garmin
    # (Captures RPE, Feeling, and raw stats to JSON)
    try:
        _01_fetch_garmin.main()
    except Exception as e:
        print(f"⚠️ Garmin Fetch Warning: {e}")
        # We continue even if fetch fails, so we can re-process existing data

    # STEP 2: Sync Database
    # (Merges Plan + JSON -> Master DB)
    # Returns the DataFrame so we don't have to reload it
    df_master = sync_database.sync()

    # STEP 3: Analyze Trends
    # (Generates Coach Briefing from the fresh DB)
    try:
        # --- FIX: Use the correct module name ---
        _01_analyze_trends.main()
    except Exception as e:
        print(f"⚠️ Analysis Warning: {e}")

    # STEP 4: Update Visuals
    # (Updates checkmarks in the Markdown Plan)
    if df_master is not None and not df_master.empty:
        update_visuals.update_weekly_plan(df_master)

    # STEP 5: Save to GitHub
    try:
        git_ops.push_changes()
    except Exception as e:
        print(f"⚠️ Git Warning: {e}")

    print("\n==================================================")
    print("✅ DAILY SYNC COMPLETE")

if __name__ == "__main__":
    main()

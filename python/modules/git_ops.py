import subprocess
import os
from datetime import datetime
from . import config

def run_cmd(args):
    try:
        subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e.stderr.decode().strip()}")
        raise e

def main():
    # 1. Check Directory
    if not os.path.exists(os.path.join(config.BASE_DIR, '.git')):
        print("   -> Not a git repository. Skipping.")
        return

    # 2. Add Files
    # We want to add everything in data/ and the plan
    print("   -> Staging files...")
    files_to_add = [
        config.MASTER_DB_JSON,
        config.PLANNED_JSON,
        config.GARMIN_JSON,
        config.COACH_BRIEFING_MD,
        config.PLAN_MARKDOWN
    ]
    
    # Filter for existing
    cmd = ["git", "add"] + [f for f in files_to_add if os.path.exists(f)]
    run_cmd(cmd)

    # 3. Commit
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
    if not status.strip():
        print("   -> No changes to commit.")
        return

    msg = f"Auto-Update: Training Data {datetime.now().strftime('%Y-%m-%d')}"
    print(f"   -> Committing: {msg}")
    
    # Optional: Set user if running in generic env
    # run_cmd(["git", "config", "user.email", "bot@training.local"])
    # run_cmd(["git", "config", "user.name", "TrainingBot"])
    
    run_cmd(["git", "commit", "-m", msg])

    # 4. Sync
    print("   -> Pulling (rebase)...")
    run_cmd(["git", "pull", "--rebase"])
    
    print("   -> Pushing...")
    run_cmd(["git", "push"])
    print("   -> Git Sync Success.")

if __name__ == "__main__":
    main()

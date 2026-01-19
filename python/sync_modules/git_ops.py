import subprocess
import os
from datetime import datetime
from . import config

def run_cmd(args):
    try:
        # Run command and capture output for error reporting
        subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e.stderr.decode().strip()}")
        raise e

def main():
    # 1. Check Directory
    if not os.path.exists(os.path.join(config.BASE_DIR, '.git')):
        print("   -> Not a git repository. Skipping.")
        return

    # 2. Configure Git Identity (CRITICAL FIX)
    # This ensures the runner knows 'who' is committing
    print("   -> Configuring Git Identity...")
    try:
        run_cmd(["git", "config", "user.email", "github-actions@github.com"])
        run_cmd(["git", "config", "user.name", "github-actions"])
    except Exception as e:
        print(f"   -> Warning: Could not set git config (might already be set): {e}")

    # 3. Add Files
    print("   -> Staging files...")
    files_to_add = [
        config.MASTER_DB_JSON,
        config.PLANNED_JSON,
        config.GARMIN_JSON,
        config.COACH_BRIEFING_MD,
        config.PLAN_MARKDOWN
    ]
    
    # Filter for files that actually exist to avoid errors
    valid_files = [f for f in files_to_add if os.path.exists(f)]
    
    if valid_files:
        cmd = ["git", "add"] + valid_files
        run_cmd(cmd)

    # 4. Check Status
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
    if not status.strip():
        print("   -> No changes to commit.")
        return

    # 5. Commit
    msg = f"Auto-Update: Training Data {datetime.now().strftime('%Y-%m-%d')}"
    print(f"   -> Committing: {msg}")
    run_cmd(["git", "commit", "-m", msg])

    # 6. Sync (Pull Rebase -> Push)
    print("   -> Pulling (rebase)...")
    try:
        run_cmd(["git", "pull", "--rebase"])
    except Exception:
        print("   -> Rebase failed/conflict. Trying standard pull...")
        run_cmd(["git", "pull"])
    
    print("   -> Pushing...")
    run_cmd(["git", "push"])
    print("   -> Git Sync Success.")

if __name__ == "__main__":
    main()

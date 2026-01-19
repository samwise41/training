import os
import shutil
import subprocess
from datetime import datetime

# ================= CONFIGURATION =================

# 1. SOURCE: Where are the files coming FROM? (The Game Folder)
#    YOU MUST UPDATE THIS PATH below to match your real Zwift folder.
#    Example: r"C:\Users\samwi\Documents\Zwift\Workouts\123456"
SOURCE_DIR = r"C:\Users\samwi\OneDrive\Documents\Zwift\Workouts\7381990"

# 2. DESTINATION: Where are the files going TO? (The GitHub Repo)
#    I have updated this to the specific path you requested.
DEST_DIR = r"C:\Users\samwi\Documents\training-plan\zwift_library"

# =================================================

def sync_files():
    print(f"\n🚀 Starting Sync: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"   📂 FROM: {SOURCE_DIR}")
    print(f"   📂 TO:   {DEST_DIR}")

    # --- Safety Checks ---
    if not os.path.exists(SOURCE_DIR) or "PASTE_YOUR" in SOURCE_DIR:
        print(f"   ❌ Error: You forgot to set the SOURCE_DIR to your Zwift folder!")
        return

    # Create destination if it doesn't exist
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        print(f"   [+] Created destination folder.")

    files_copied = 0
    
    # --- Step 1: Copy Files ---
    # We walk through the source folder recursively to find all .zwo files
    for root, dirs, files in os.walk(SOURCE_DIR):
        for filename in files:
            if filename.endswith(".zwo"):
                src = os.path.join(root, filename)
                dst = os.path.join(DEST_DIR, filename)
                
                # Only copy if file is new or modified
                if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
                    shutil.copy2(src, dst)
                    files_copied += 1
                    print(f"   [+] Copied: {filename}")

    if files_copied == 0:
        print("   ✅ Files are already up to date locally.")
    else:
        print(f"   📂 Copied {files_copied} new/updated files.")

    # --- Step 2: Git Push ---
    if files_copied > 0:
        print("\n🐙 GIT: Pushing to GitHub...")
        try:
            # We assume the repo root is the parent of the destination folder
            # i.e., C:\Users\samwi\Documents\training-plan
            repo_root = os.path.dirname(DEST_DIR)
            os.chdir(repo_root)

            # Add the specific folder
            subprocess.run(["git", "add", "zwift_library/."], check=True)
            
            # Check status
            status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
            
            if status:
                subprocess.run(["git", "commit", "-m", f"Sync Workouts {datetime.now().strftime('%Y-%m-%d')}"], check=True)
                subprocess.run(["git", "push"], check=True)
                print("   ✅ Success: Workouts are on GitHub!")
            else:
                print("   ℹ️  Git status clean (No changes to push).")

        except Exception as e:
            print(f"   ⚠️ Git Error: {e}")
            print("   (Ensure you have GitHub Desktop installed or Git configured in this folder)")

if __name__ == "__main__":
    sync_files()
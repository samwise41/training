# 🏃‍♂️ Endurance Training Data Pipeline SOP (GitHub Edition)

## 1. Purpose
This document outlines the workflow for managing endurance training data using the automated GitHub Actions pipeline. Data is automatically synced from Garmin Connect to your Training Plan and Master Database.

---

## 2. System Architecture
The system operates on an automated "Push-to-Sync" model hosted entirely on GitHub.
* **Source:** `endurance_plan.md` (Planned workouts and trigger for sync)
* **Telemetry:** Garmin Connect (Actual performance data)
* **Automation:** GitHub Actions (Runs `migrate_weekly_data.py` & `fetch_garmin.py`)
* **Archive:** `MASTER_TRAINING_DATABASE.md` (Permanent history)

---

## 3. The Daily Workflow (No Code Required)

### Step A: Mark Workouts as Completed
The automation looks for specific triggers in your `endurance_plan.md` to know what to fetch.
1. Open `endurance_plan.md` on GitHub.com or your local editor.
2. Locate the table under **## Weekly Schedule**.
3. Ensure the **Date** column is in `YYYY-MM-DD` format.
4. Set the **Status** column to `COMPLETED` for the relevant day.
5. **Commit/Push** your changes to GitHub.

### Step B: Automated Sync
The pipeline triggers automatically in two ways:
1.  **Scheduled:** Runs daily at 6:00, 7:00, 8:00, and 10:15 AM MST.
2.  **Manual Kick-off:** * Navigate to the **Actions** tab in your GitHub repository.
    * Select **"Sync Training Data"** from the sidebar.
    * Click the **Run workflow** dropdown and select the green button.

### Step C: Verification
Once the "Pages build and deployment" turns green on GitHub, your dashboard will reflect:
* **Actual Workout:** Automatically prefixed with `[RUN]`, `[BIKE]`, or `[SWIM]`.
* **Actual Duration:** Populated from your Garmin telemetry.
* **Master DB:** A new row appended with full HR, Power, and GPS data.

---

## 4. Manual Data Correction
If a workout is archived but labeled as `Match Status: Manual`, the automation could not find a Garmin activity matching that specific date and sport type.

### How to Fix:
1.  **Find the ID:** Log in to Garmin Connect web, open the activity, and copy the ID from the URL.
2.  **Update Master DB:** Open `MASTER_TRAINING_DATABASE.md` on GitHub.
3.  **Edit:** Paste the ID into the `activityId` column for that row.
4.  **Sync:** The next automated run will "Hydrate" this row with full telemetry.

---

## 5. Troubleshooting the Pipeline

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **No "Actual" data in Plan** | Date mismatch | Ensure the date in the table is exactly `YYYY-MM-DD`. |
| **Workout mapped to wrong sport** | Keyword missing | Ensure "Planned Workout" contains the word "Run", "Bike", or "Swim". |
| **Action fails with "Auth Error"** | Expired Credentials | Update `GARMIN_PASSWORD` in Repository Secrets. |
| **Action runs but no push occurs** | Nothing to update | Ensure "Status" is `COMPLETED` and "Actual Duration" is empty. |

---

## 6. Maintenance & Security
* **Secrets:** Credentials (Email/Password) are stored in **Settings > Secrets > Actions**. They are never visible in the code.
* **JSON Backup:** `python/my_garmin_data_ALL.json` acts as a permanent backup of your Garmin history. If Garmin ever goes down, your data is safe in this repository.
* **Git Identity:** All automated changes are committed by `github-actions[bot]`.

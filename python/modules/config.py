import os
import sys

# --- PATHS ---
# Assumes this file is in python/modules/config.py
MODULES_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_DIR = os.path.dirname(MODULES_DIR) # python/
ROOT_DIR = os.path.dirname(PYTHON_DIR)    # Project Root

PLAN_FILE = os.path.join(ROOT_DIR, 'endurance_plan.md')
MASTER_DB = os.path.join(ROOT_DIR, 'MASTER_TRAINING_DATABASE.md')
BRIEF_FILE = os.path.join(ROOT_DIR, 'COACH_BRIEFING.md') 

# --- FIX: Point to the 'garmin_data' folder, NOT 'python' folder ---
GARMIN_JSON = os.path.join(ROOT_DIR, 'garmin_data', 'my_garmin_data_ALL.json')

# --- SCHEMA ---
# The Single Source of Truth for your Database Columns
MASTER_COLUMNS = [
    'Status', 'Day', 'Planned Workout', 'Planned Duration', 
    'Actual Workout', 'Actual Duration', 'Notes / Targets', 'Date', 'Match Status',
    'activityId', 'activityName', 'activityType', 'sportTypeId',
    'duration', 'distance', 'averageHR', 'maxHR', 
    'aerobicTrainingEffect', 'anaerobicTrainingEffect', 'trainingEffectLabel',
    'avgPower', 'maxPower', 'normPower', 'trainingStressScore', 'intensityFactor',
    'averageSpeed', 'maxSpeed', 
    'averageBikingCadenceInRevPerMinute', 'averageRunningCadenceInStepsPerMinute',
    'avgStrideLength', 'avgVerticalOscillation', 'avgGroundContactTime',
    'vO2MaxValue', 'calories', 'elevationGain', 'RPE', 'Feeling'
]

# --- SETTINGS ---
# Activities to include in the database
ALLOWED_SPORT_TYPES = [1, 2, 5, 255] # Run, Bike, Swim, Other

# Sport Detection Helpers
SPORT_IDS = {
    'RUN': [1],
    'BIKE': [2],
    'SWIM': [5, 26, 18] 
}

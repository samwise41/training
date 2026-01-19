import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.dates as mdates
import matplotlib.patches as mpatches
from matplotlib.patches import Rectangle

# ==========================================
# 🎨 COLOR CONFIGURATION
# ==========================================
C_SWIM = "#0ea5e9"  # Sky Blue
C_BIKE = "#8b5cf6"  # Violet
C_RUN  = "#ec4899"  # Pink
C_SAT  = "#ffffff"  # White line

PHASE_COLORS = {
    "Base":    "#94a3b8", 
    "Build":   "#3b82f6", 
    "Peak":    "#eab308", 
    "Century": "#f97316", 
    "70.3":    "#ef4444" 
}
# ==========================================

# --- DATES ---
START_DATE = datetime(2025, 12, 29)
END_DATE = datetime(2026, 9, 13)

RACE_DATES = {
    datetime(2026, 6, 20): "Jordanelle",
    datetime(2026, 8, 15): "Century",
    datetime(2026, 9, 11): "70.3"
}

def get_phase_name(date):
    d = date.month * 100 + date.day
    if d <= 228: return "Base"
    elif d <= 515: return "Build"
    elif d <= 620: return "Peak"
    elif d <= 816: return "Century"
    else: return "70.3"

# --- NEW: LOGIC FOR ALL SPORTS ---
def get_base_volumes(phase, month):
    """
    Returns base weekly hours for (Swim, Run, Weekday_Bike) based on Phase.
    Does NOT include the Saturday Long Ride (calculated separately).
    """
    if phase == "Base":
        # Foundation: Low volume, technique focus
        return 1.5, 2.0, 2.5 
    
    elif phase == "Build":
        # Ramping up durability
        return 1.75, 2.5, 3.0
    
    elif phase == "Peak":
        # Olympic Prep: Run volume holds, intensity rises
        return 1.75, 2.75, 3.0
    
    elif phase == "Century":
        # Bike Heavy: Run/Swim maintain to allow recovery for massive bike volume
        return 1.5, 2.25, 3.0 
    
    elif phase == "70.3":
        # 70.3 Prep: Run MUST increase (Long runs), Swim peaks
        return 2.0, 3.25, 2.5 
    
    return 1.5, 2.0, 2.5

def get_sat_volume(date, phase):
    if phase == "Base": return 2.0
    if phase == "Build":
        if date.month == 3: return 3.0
        if date.month == 4: return 3.5
        return 4.0
    if phase == "Peak": return 4.0
    if phase == "Century": return 5.5 # Spikes for Century
    return 4.5 # 70.3 Long Rides

# --- SIMULATION LOOP ---
weeks = []
current_date = START_DATE
week_num = 1

while current_date <= END_DATE:
    phase = get_phase_name(current_date)
    sat_hours = get_sat_volume(current_date, phase)
    
    # Get Dynamic Base Volumes
    base_swim, base_run, base_bike_weekday = get_base_volumes(phase, current_date.month)
    
    # Check Modifiers
    week_end = current_date + timedelta(days=6)
    is_race_week = any(current_date <= r <= week_end for r in RACE_DATES)
    is_deload = (week_num % 4 == 0)
    
    load_mod = 1.0
    note = ""
    
    if is_race_week:
        load_mod = 0.5
        note = "RACE"
    elif is_deload:
        load_mod = 0.6
        note = "Deload"
    
    # Apply Modifiers
    swim_vol = base_swim * load_mod
    run_vol = base_run * load_mod
    
    # Bike Calculation
    sat_bike = sat_hours * load_mod 
    bike_vol = (base_bike_weekday * load_mod) + sat_bike
    
    total_vol = swim_vol + run_vol + bike_vol

    weeks.append({
        "date": current_date,
        "label": f"{current_date.month}/{current_date.day}",
        "phase": phase,
        "swim": swim_vol,
        "run": run_vol,
        "bike": bike_vol,
        "total": total_vol,
        "sat_raw": sat_bike,
        "note": note
    })
    
    current_date += timedelta(days=7)
    week_num += 1

# --- PLOTTING ---
df = pd.DataFrame(weeks)
fig, ax1 = plt.subplots(figsize=(16, 9), facecolor='#0f172a')
ax1.set_facecolor('#0f172a')

# 1. STACKED BARS
ind = np.arange(len(df))
# Order: Run (Bottom) -> Swim (Middle) -> Bike (Top)
p1 = ax1.bar(ind, df['run'], width=0.6, color=C_RUN, label='Run', zorder=3)
p2 = ax1.bar(ind, df['swim'], bottom=df['run'], width=0.6, color=C_SWIM, label='Swim', zorder=3)
p3 = ax1.bar(ind, df['bike'], bottom=df['run']+df['swim'], width=0.6, color=C_BIKE, label='Bike', zorder=3)

# 2. SATURDAY LINE
ax2 = ax1.twinx()
ax2.plot(ind, df['sat_raw'], color=C_SAT, marker='o', linewidth=1.5, markersize=4, linestyle=':', label='Sat Long Ride', zorder=4)

# 3. AXIS LIMITS
max_y = df['total'].max()
ax1.set_ylim(0, max_y * 1.25)

# 4. PHASE BOXES
phase_changes = df['phase'].ne(df['phase'].shift()).cumsum()

for group_id, group in df.groupby(phase_changes):
    start_idx = group.index[0]
    end_idx = group.index[-1]
    phase_name = group.iloc[0]['phase']
    
    phase_max_h = group['total'].max()
    box_color = PHASE_COLORS.get(phase_name, "white")
    
    rect = Rectangle(
        (start_idx - 0.45, 0),       
        (end_idx - start_idx) + 0.9, 
        phase_max_h + 1.0,           
        linewidth=2, 
        edgecolor=box_color, 
        facecolor='none', 
        linestyle='--',
        zorder=5
    )
    ax1.add_patch(rect)
    
    mid_point = (start_idx + end_idx) / 2
    ax1.text(mid_point, phase_max_h + 1.5, phase_name.upper(), 
             color=box_color, ha='center', va='bottom', fontweight='bold', fontsize=11, 
             bbox=dict(facecolor='#0f172a', edgecolor='none', alpha=0.8, pad=0))

# 5. FORMATTING
ax1.set_ylabel('Weekly Hours', color='white', fontsize=12)
ax2.set_ylabel('Sat Ride Hours', color=C_SAT, fontsize=12)
ax1.set_title('2026 Training Load Projection (Realistic Progression)', color='white', fontsize=18, fontweight='bold', pad=40)

ax1.set_xticks(ind[::2])
ax1.set_xticklabels(df['label'][::2], rotation=45, color='#94a3b8')

ax1.tick_params(axis='y', colors='#94a3b8')
ax2.tick_params(axis='y', colors=C_SAT)
ax1.grid(color='#334155', linestyle=':', linewidth=0.5, axis='y', alpha=0.3, zorder=0)

for ax in [ax1, ax2]:
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_color('#334155')
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)

# 6. LEGEND
handles = [
    mpatches.Patch(color=C_BIKE, label='Bike'),
    mpatches.Patch(color=C_SWIM, label='Swim'),
    mpatches.Patch(color=C_RUN, label='Run'),
    plt.Line2D([], [], color=C_SAT, linestyle=':', marker='o', label='Sat Long Ride')
]
ax1.legend(handles=handles, loc='upper left', frameon=False, labelcolor='white', bbox_to_anchor=(0, 1.0), ncol=4)

# Note Labels
for i, row in df.iterrows():
    if row['note']:
        y_pos = row['total'] + 0.3
        txt = row['note']
        color = '#f472b6' if txt == "RACE" else '#64748b'
        weight = 'bold' if txt == "RACE" else 'normal'
        ax1.text(i, y_pos, txt, ha='center', va='bottom', color=color, fontsize=8, rotation=90, fontweight=weight, zorder=6)

plt.tight_layout()
plt.savefig('projected_volume_2026.png', dpi=300, bbox_inches='tight')
print("✅ Realistic Progression Chart Generated")

import json
import pandas as pd
import numpy as np
import os
from . import config

def load_data():
    if not os.path.exists(config.GARMIN_JSON): return pd.DataFrame()
    with open(config.GARMIN_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return pd.DataFrame(data)

def calculate_slope(series):
    """Calculates linear regression slope for a series."""
    if len(series) < 2: return 0
    y = series.values
    x = np.arange(len(y))
    slope, _ = np.polyfit(x, y, 1)
    return slope

def determine_trend_label(slope, metric_name):
    """
    Returns emoji label based on slope direction and metric type.
    EF/Power: Higher is better.
    HR (at same effort): Lower is better (handling this is complex without context, assuming EF handles it).
    """
    if abs(slope) < 0.001: return "➡️ Stable"
    if slope > 0: return "↗️ Improving"
    return "↘️ Declining"

def main():
    df = load_data()
    if df.empty:
        print("   -> No data to analyze.")
        return

    # Pre-processing
    df['startTimeLocal'] = pd.to_datetime(df['startTimeLocal'])
    df = df.sort_values('startTimeLocal')
    
    # Calculate derived metrics
    # EF (Efficiency Factor) = NormPower / AvgHR
    # Handle zeros to avoid div/0
    df['EF'] = df.apply(lambda x: x['normPower'] / x['averageHR'] if x.get('normPower') and x.get('averageHR') else None, axis=1)
    
    # Torque Efficiency (Power / Cadence)
    df['TorqueEff'] = df.apply(lambda x: x['avgPower'] / x['averageBikingCadenceInRevPerMinute'] if x.get('avgPower') and x.get('averageBikingCadenceInRevPerMinute') else None, axis=1)

    sports = ['Run', 'Bike'] # We mostly track trends for these
    
    md_output = "# Coach Briefing \n\n"
    md_output += f"**Generated:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    for sport_id in [1, 2]: # 1=Run, 2=Bike
        sport_name = "Run" if sport_id == 1 else "Bike"
        sport_df = df[df['sportTypeId'] == sport_id].copy()
        
        if sport_df.empty: continue
        
        md_output += f"## {sport_name} Trends\n"
        md_output += "| Metric | 30-Day Trend | 90-Day Trend | Status |\n"
        md_output += "| :--- | :--- | :--- | :--- |\n"
        
        metrics = []
        if sport_name == 'Bike':
            metrics = [('EF', 'Aerobic Efficiency'), ('TorqueEff', 'Torque Efficiency'), ('vO2MaxValue', 'VO2 Max')]
        else:
            metrics = [('vO2MaxValue', 'VO2 Max')]

        for col, label in metrics:
            if col not in sport_df.columns: continue
            
            # Get clean data
            valid = sport_df[['startTimeLocal', col]].dropna()
            if valid.empty: continue
            
            # Filter windows
            now = pd.Timestamp.now()
            d30 = valid[valid['startTimeLocal'] > (now - pd.Timedelta(days=30))]
            d90 = valid[valid['startTimeLocal'] > (now - pd.Timedelta(days=90))]
            
            s30 = calculate_slope(d30[col])
            s90 = calculate_slope(d90[col])
            
            status = determine_trend_label(s30, col)
            
            md_output += f"| {label} | {s30:.4f} | {s90:.4f} | {status} |\n"
        
        md_output += "\n"

    # --- DISABLED: WRITE TO FILE ---
    # with open(config.COACH_BRIEFING_MD, 'w', encoding='utf-8') as f:
    #     f.write(md_output)
    
    # print("   -> Coach Briefing generated.")
    print("   -> Trends analyzed (File output disabled).")

if __name__ == "__main__":
    main()

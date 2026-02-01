import { DataManager } from '../../utils/data.js';

// Replaces hardcoded definitions. 
// Requires Config to be passed in, or fetched if not present.

export const extractMetricData = (data, metricKey) => {
    // We assume the caller (updateCharts) passes filters, 
    // but if we are called directly, we might need to fetch the config logic from the Coaching View.
    // For simplicity in this architecture, we filter "zeros" by default, 
    // but strict filtering relies on the pre-processed Coaching View for the Table.
    // For the CHARTS, we want raw data but cleaned.
    
    return data.map(d => {
        let val = null;
        const p = d.avgPower, hr = d.averageHR, s = d.averageSpeed, rpe = d.RPE;
        const durationMin = d.durationInSeconds / 60;

        // Basic sanity check (Global filter)
        if (durationMin < 5) return null; // Ignore super short stuff

        if (metricKey === 'subjective_bike') {
            if (p && rpe) val = p / rpe;
        } else if (metricKey === 'endurance') {
            if (p && hr) val = p / hr;
        } else if (metricKey === 'subjective_run') {
            if (s && rpe) val = s / rpe;
        } else if (metricKey === 'run') {
            if (s && hr) val = (s * 60) / hr;
        } else if (metricKey === 'training_balance') {
             // Handled separately
             return null;
        } else {
            // Direct lookup
            val = d[metricKey] || d[mapKeys(metricKey)];
        }

        if (val === null || val === 0 || !isFinite(val)) return null;

        return {
            date: new Date(d.date),
            dateStr: d.date,
            val: val,
            name: d.title || 'Workout',
            breakdown: ''
        };
    }).filter(x => x !== null);
};

// Helper for mapping simple keys to JSON keys
const mapKeys = (k) => {
    const map = {
        'vo2max': 'vO2MaxValue',
        'tss': 'trainingStressScore',
        'anaerobic': 'anaerobicTrainingEffect',
        'calories': 'calories',
        'vert': 'avgVerticalOscillation',
        'gct': 'avgGroundContactTime'
    };
    return map[k] || k;
};

// Specific handler for Subjective Efficiency (Bike/Run/Swim)
export const calculateSubjectiveEfficiency = (data, sport) => {
    return data.filter(d => d.sport === sport).map(d => {
        let val = null;
        if (sport === 'Bike' && d.avgPower && d.RPE) val = d.avgPower / d.RPE;
        else if (sport === 'Run' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;
        else if (sport === 'Swim' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;

        if (!val || val === Infinity) return null;
        return {
            date: new Date(d.date),
            dateStr: d.date,
            val: val,
            name: d.title,
            breakdown: `RPE: ${d.RPE}`
        };
    }).filter(x => x !== null);
};

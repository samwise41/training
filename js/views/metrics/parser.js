import { DataManager } from '../../utils/data.js';

// --- MAIN NORMALIZER (The Missing Export) ---
export const normalizeMetricsData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(d => {
        // Basic sanity check
        if (!d.date) return null;

        // Raw Values
        const p   = d.avgPower || 0;
        const hr  = d.averageHR || 0;
        const s   = d.averageSpeed || 0;
        const rpe = d.RPE || 0;
        const cad = d.averageBikingCadenceInRevPerMinute || 0;
        const vert= d.avgVerticalOscillation || 0;
        const gct = d.avgGroundContactTime || 0;
        const dur = (d.durationInSeconds || 0) / 60; // Minutes

        // Ignore very short workouts (noise)
        if (dur < 10) return null;

        return {
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            
            // Raw Metrics
            vo2max: d.vO2MaxValue || 0,
            tss: d.trainingStressScore || 0,
            anaerobic: d.anaerobicTrainingEffect || 0,
            calories: d.calories || 0,
            
            // Derived Cycling Metrics
            subjective_bike: (p && rpe) ? p/rpe : 0,
            endurance: (p && hr) ? p/hr : 0,
            strength: (p && cad) ? p/cad : 0,
            
            // Derived Running Metrics
            subjective_run: (s && rpe) ? s/rpe : 0,
            run: (s && hr) ? (s * 60)/hr : 0,
            mechanical: (vert && gct) ? (vert/gct)*100 : 0,
            gct: gct,
            vert: vert,

            // Derived Swimming Metrics
            subjective_swim: (s && rpe) ? s/rpe : 0,
            swim: (s && hr) ? (s * 60)/hr : 0,

            // Load/Feeling
            feeling_load: {
                load: d.trainingStressScore || 0,
                feeling: d.Feeling || null
            },
            
            // Balance (Special Object)
            training_balance: d.zones || null,
            
            // Meta
            sport: d.sport || 'Other'
        };
    }).filter(d => d !== null).sort((a,b) => a.date - b.date);
};

// --- HELPER: Extract Single Metric for Charts ---
export const extractMetricData = (data, key) => {
    if (!data) return [];
    
    // Check if we need to filter by sport based on the metric key
    let sportFilter = null;
    if (['subjective_bike','endurance','strength'].includes(key)) sportFilter = 'Bike';
    if (['subjective_run','run','mechanical','gct','vert'].includes(key)) sportFilter = 'Run';
    if (['subjective_swim','swim'].includes(key)) sportFilter = 'Swim';

    return data
        .filter(d => {
            // Filter by Sport if needed
            if (sportFilter && d.sport !== sportFilter) return false;
            
            // Filter Zeros/Nulls
            const val = d[key];
            if (val === null || val === undefined || val === 0) return false;
            
            // Filter "Infinity" (Divide by Zero errors)
            if (!isFinite(val)) return false;

            return true;
        })
        .map(d => ({
            date: d.date,
            dateStr: d.dateStr,
            name: d.name,
            val: d[key],
            breakdown: '' // Optional text for tooltip
        }));
};

// --- HELPER: Subjective Efficiency ---
// (Kept for backward compatibility if needed, but normalizeMetricsData handles this now)
export const calculateSubjectiveEfficiency = (data, type) => {
    // Type is "bike", "run", "swim" (from key "subjective_bike")
    const key = `subjective_${type}`;
    return extractMetricData(data, key);
};

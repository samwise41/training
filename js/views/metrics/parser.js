import { DataManager } from '../../utils/data.js';

export const normalizeMetricsData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(d => {
        if (!d.date) return null;

        // 1. DATA MAPPING
        // The JSON uses 'actualSport', but the App expects 'sport'.
        // We read 'actualSport' first.
        const sourceSport = d.actualSport || d.sport || 'Other';
        
        // 2. NORMALIZATION
        // Ensure standard casing for the App's filters ("Bike", "Run", "Swim")
        let cleanSport = sourceSport;
        if (sourceSport === 'Ride' || sourceSport === 'Cycling') cleanSport = 'Bike';
        if (sourceSport === 'Running') cleanSport = 'Run';
        if (sourceSport === 'Swimming') cleanSport = 'Swim';

        // 3. DURATION
        let dur = 0;
        if (d.durationInSeconds) dur = d.durationInSeconds / 60;
        else if (d.duration) dur = d.duration / 60;

        // 4. METRIC EXTRACTION
        const p   = d.avgPower || 0;
        const hr  = d.averageHR || 0;
        const s   = d.averageSpeed || 0;
        const rpe = d.RPE || 0;
        const cad = d.averageBikingCadenceInRevPerMinute || 0;
        const vert= d.avgVerticalOscillation || 0;
        const gct = d.avgGroundContactTime || 0;

        return {
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            
            // CRITICAL: This is the field the charts filter by
            sport: cleanSport, 
            duration: dur,
            
            // Metrics
            vo2max: d.vO2MaxValue || 0,
            tss: d.trainingStressScore || 0,
            anaerobic: d.anaerobicTrainingEffect || 0,
            calories: d.calories || 0,
            
            // Calculated Efficiencies
            subjective_bike: (p && rpe) ? p/rpe : 0,
            endurance: (p && hr) ? p/hr : 0,
            strength: (p && cad) ? p/cad : 0,
            
            subjective_run: (s && rpe) ? s/rpe : 0,
            run: (s && hr) ? (s * 60)/hr : 0,
            mechanical: (vert && gct) ? (vert/gct)*100 : 0,
            gct: gct,
            vert: vert,

            subjective_swim: (s && rpe) ? s/rpe : 0,
            swim: (s && hr) ? (s * 60)/hr : 0,

            feeling_load: {
                load: d.trainingStressScore || 0,
                feeling: d.Feeling || null
            },
            
            training_balance: d.zones || null
        };
    }).filter(d => d !== null).sort((a,b) => a.date - b.date);
};

// --- HELPER: Extract Single Metric for Charts ---
export const extractMetricData = (data, key) => {
    if (!data) return [];
    
    // Filter definitions based on the 'sport' property we set above
    let requiredSport = null;
    if (['subjective_bike','endurance','strength'].includes(key)) requiredSport = 'Bike';
    if (['subjective_run','run','mechanical','gct','vert'].includes(key)) requiredSport = 'Run';
    if (['subjective_swim','swim'].includes(key)) requiredSport = 'Swim';

    return data
        .filter(d => {
            if (requiredSport && d.sport !== requiredSport) return false;
            
            const val = d[key];
            if (val === null || val === undefined || val === 0) return false;
            if (!isFinite(val)) return false;

            return true;
        })
        .map(d => ({
            date: d.date,
            dateStr: d.dateStr,
            name: d.name,
            val: d[key],
            breakdown: ''
        }));
};

export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};

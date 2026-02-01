import { DataManager } from '../../utils/data.js';

// --- HELPER: Week Aggregator (For TSS/Calories) ---
const aggregateWeekly = (data, valueKey) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.date) return;
        const date = new Date(d.date);
        // Get end of week (Saturday)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 6 ? 0 : 6); 
        const weekEnd = new Date(date.setDate(diff));
        weekEnd.setHours(0,0,0,0);
        const key = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += (d[valueKey] || 0);
    });

    return Object.keys(weeks).map(k => ({
        date: new Date(k),
        dateStr: k,
        val: weeks[k],
        name: 'Week Ending ' + k
    })).sort((a,b) => a.date - b.date);
};

// --- MAIN NORMALIZER (Calculates Everything Once) ---
export const normalizeMetricsData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(d => {
        if (!d.date) return null;

        // 1. Sport Mapping
        const sourceSport = d.actualSport || d.sport || 'Other';
        let cleanSport = sourceSport;
        if (sourceSport === 'Ride' || sourceSport === 'Cycling') cleanSport = 'Bike';
        if (sourceSport === 'Running') cleanSport = 'Run';
        if (sourceSport === 'Swimming') cleanSport = 'Swim';

        // 2. Raw Values
        const p   = d.avgPower || 0;
        const hr  = d.averageHR || 0;
        const s   = d.averageSpeed || 0;
        const rpe = d.RPE || 0;
        const cad = d.averageBikingCadenceInRevPerMinute || 0;
        const vert= d.avgVerticalOscillation || 0;
        const gct = d.avgGroundContactTime || 0;
        const dur = (d.durationInSeconds || d.duration || 0) / 60;

        // 3. Construct Normalized Object
        return {
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            sport: cleanSport,
            duration: dur,
            
            // Raw Metrics
            vo2max: d.vO2MaxValue || 0,
            tss: d.trainingStressScore || 0,
            anaerobic: d.anaerobicTrainingEffect || 0,
            calories: d.calories || 0,
            
            // Derived Cycling
            subjective_bike: (p && rpe) ? p/rpe : 0,
            endurance: (p && hr) ? p/hr : 0,
            strength: (p && cad) ? p/cad : 0,
            
            // Derived Running
            subjective_run: (s && rpe) ? s/rpe : 0,
            run: (s && hr) ? (s * 60)/hr : 0,
            mechanical: (vert && gct) ? (vert/gct)*100 : 0,
            gct: gct,
            vert: vert,

            // Derived Swimming
            subjective_swim: (s && rpe) ? s/rpe : 0,
            swim: (s && hr) ? (s * 60)/hr : 0,

            // Special Objects
            feeling_load: {
                load: d.trainingStressScore || 0,
                feeling: d.Feeling || null
            },
            training_balance: d.zones || null
        };
    }).filter(d => d !== null).sort((a,b) => a.date - b.date);
};

// --- CHART DATA EXTRACTOR (Reads Pre-Calculated Values) ---
export const extractMetricData = (data, key) => {
    if (!data) return [];

    // --- CASE 1: Weekly Aggregations ---
    if (key === 'tss') return aggregateWeekly(data, 'tss');
    if (key === 'calories') return aggregateWeekly(data, 'calories');

    // --- CASE 2: Special Charts ---
    if (key === 'training_balance') {
        return data.filter(d => d.training_balance).map(d => ({
            date: d.date, dateStr: d.dateStr, name: d.name,
            distribution: d.training_balance,
            val: 0
        }));
    }
    if (key === 'feeling_load') {
        return data.filter(d => d.feeling_load.load > 0 || d.feeling_load.feeling != null).map(d => ({
            date: d.date, dateStr: d.dateStr, name: d.name,
            load: d.feeling_load.load,
            feeling: d.feeling_load.feeling,
            val: d.feeling_load.load
        }));
    }

    // --- CASE 3: Standard Metrics (The Fix) ---
    // We strictly filter based on sport to prevent "Run" data appearing in "Bike" charts
    let reqSport = null;
    if (['subjective_bike','endurance','strength'].includes(key)) reqSport = 'Bike';
    if (['subjective_run','run','mechanical','gct','vert'].includes(key)) reqSport = 'Run';
    if (['subjective_swim','swim'].includes(key)) reqSport = 'Swim';

    return data
        .filter(d => {
            // 1. Sport Filter
            if (reqSport && d.sport !== reqSport) return false;
            
            // 2. Value Filter (Must exist and be valid)
            // Note: We access d[key] directly because normalizeMetricsData already calculated it!
            const val = d[key];
            if (val === null || val === undefined || val === 0) return false;
            if (!isFinite(val)) return false;
            
            return true;
        })
        .map(d => ({
            date: d.date,
            dateStr: d.dateStr,
            name: d.name,
            val: d[key], // Simply read the value
            breakdown: ''
        }));
};

export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};

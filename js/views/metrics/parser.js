console.log("--- PARSER V5 (RESTORED) LOADED ---");
import { DataManager } from '../../utils/data.js';

// --- HELPER: Safely determine sport (Checks actualSport first) ---
const getSport = (d) => {
    // 1. Look for 'actualSport' (This is what your JSON uses)
    if (d.actualSport) {
        const s = d.actualSport.toLowerCase();
        if (s === 'cycling' || s === 'ride' || s === 'bike') return 'Bike';
        if (s === 'running' || s === 'run') return 'Run';
        if (s === 'swimming' || s === 'swim') return 'Swim';
    }
    // 2. Fallback to 'sport' (Legacy support)
    if (d.sport) {
        const s = d.sport.toLowerCase();
        if (s.includes('bike') || s.includes('cycl')) return 'Bike';
        if (s.includes('run')) return 'Run';
        if (s.includes('swim')) return 'Swim';
    }
    return 'Other';
};

// --- HELPER: Weekly Aggregator (Sums Raw Values) ---
const aggregateWeekly = (data, valueKey) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.date) return;
        
        // Calculate Saturday of this week
        const date = new Date(d.date);
        const day = date.getDay(); // 0=Sun
        const diff = 6 - day; 
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        weekEnd.setHours(0,0,0,0);
        
        const key = weekEnd.toISOString().split('T')[0];
        if (!weeks[key]) weeks[key] = 0;
        
        // Sum the RAW value (e.g. d.trainingStressScore)
        weeks[key] += (d[valueKey] || 0);
    });

    return Object.keys(weeks).map(k => ({
        date: new Date(k),
        dateStr: k,
        val: weeks[k],
        name: 'Week Ending ' + k
    })).sort((a,b) => a.date - b.date);
};

// --- EXPORT 1: Normalizer (Pass-through) ---
// We restore this to a simple pass-through to ensure compatibility
export const normalizeMetricsData = (data) => {
    if (!data) return [];
    // Just sort by date, don't change structure
    return [...data].sort((a,b) => new Date(a.date) - new Date(b.date));
};

// --- EXPORT 2: Extract Data (The Logic Engine) ---
export const extractMetricData = (data, key) => {
    if (!data) return [];

    // --- A. Weekly Charts ---
    if (key === 'tss') return aggregateWeekly(data, 'trainingStressScore');
    if (key === 'calories') return aggregateWeekly(data, 'calories');

    // --- B. Balance Chart ---
    if (key === 'training_balance') {
        return data.filter(d => d.zones).map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            distribution: d.zones, // Expected by Charts.js
            val: 0
        }));
    }

    // --- C. Feeling Chart ---
    if (key === 'feeling_load') {
        return data.filter(d => d.trainingStressScore > 0 || d.Feeling).map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            load: d.trainingStressScore || 0, // Expected by Charts.js
            feeling: d.Feeling || null,      // Expected by Charts.js
            val: d.trainingStressScore || 0
        }));
    }

    // --- D. Standard Metrics ---
    return data
        .filter(d => {
            const sport = getSport(d);

            // 1. Sport Filtering (Strict)
            if (['subjective_bike','endurance','strength'].includes(key) && sport !== 'Bike') return false;
            if (['subjective_run','run','mechanical','gct','vert'].includes(key) && sport !== 'Run') return false;
            if (['subjective_swim','swim'].includes(key) && sport !== 'Swim') return false;

            // 2. Value Calculation (Raw Math on the fly)
            let val = null;

            // General
            if (key === 'vo2max') val = d.vO2MaxValue;
            if (key === 'anaerobic') val = d.anaerobicTrainingEffect;

            // Bike
            if (key === 'subjective_bike' && d.avgPower && d.RPE) val = d.avgPower / d.RPE;
            if (key === 'endurance' && d.avgPower && d.averageHR) val = d.avgPower / d.averageHR;
            if (key === 'strength' && d.avgPower && d.averageBikingCadenceInRevPerMinute) val = d.avgPower / d.averageBikingCadenceInRevPerMinute;

            // Run
            if (key === 'subjective_run' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;
            if (key === 'run' && d.averageSpeed && d.averageHR) val = (d.averageSpeed * 60) / d.averageHR;
            if (key === 'mechanical' && d.avgVerticalOscillation && d.avgGroundContactTime) val = (d.avgVerticalOscillation / d.avgGroundContactTime) * 100;
            if (key === 'gct') val = d.avgGroundContactTime;
            if (key === 'vert') val = d.avgVerticalOscillation;

            // Swim
            if (key === 'subjective_swim' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;
            if (key === 'swim' && d.averageSpeed && d.averageHR) val = (d.averageSpeed * 60) / d.averageHR;

            // 3. Validity Check
            if (val === null || val === undefined || !isFinite(val) || val === 0) return false;

            // Temp store for map
            d._calcVal = val;
            return true;
        })
        .map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            val: d._calcVal,
            breakdown: ''
        }));
};

// Legacy support
export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};

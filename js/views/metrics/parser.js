import { Formatters } from '../../utils/formatting.js'; 

// --- 1. MAPPINGS & HELPERS ---
const KEYS = {
    hr: 'averageHR',
    spd: 'averageSpeed',
    pwr: 'avgPower',
    cad_bike: 'averageBikingCadenceInRevPerMinute',
    cad_run: 'averageRunningCadenceInStepsPerMinute',
    rpe: 'RPE',
    gct: 'avgGroundContactTime',
    vert: 'avgVerticalOscillation',
    vo2: 'vO2MaxValue',
    ana: 'anaerobicTrainingEffect',
    tss: 'trainingStressScore',
    cals: 'calories',
    effect: 'trainingEffectLabel',
    feeling: 'Feeling'
};

// Robust Sport Check
const checkSport = (d, type) => {
    const s = (d.actualSport || d.sport || '').toLowerCase();
    const t = type.toLowerCase();
    if (t === 'bike') return s.includes('bike') || s.includes('cycl') || s.includes('ride') || s.includes('spin');
    if (t === 'run') return s.includes('run') || s.includes('jog') || s.includes('treadmill');
    if (t === 'swim') return s.includes('swim') || s.includes('pool');
    return false;
};

// Safe Value Extractor
const getVal = (item, key) => {
    // Only use formatter if the value is a string that looks like a duration (e.g., "01:30:00")
    // If it's a number, we want to treat it as a number immediately.
    if ((key === 'duration' || key === 'time' || key === 'moving_time') && typeof item[key] === 'string') {
        return Formatters.parseDuration(item[key]);
    }
    const val = item[key];
    if (val === null || val === undefined || val === '') return 0;
    
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num; // Never return NaN
};

// --- 2. NORMALIZER ---
export const normalizeMetricsData = (rawData) => {
    if (!rawData) return [];
    
    return rawData.map(item => {
        // --- DURATION FIX ---
        // 1. Try 'durationInSeconds' (Standard)
        // 2. Try 'duration' (Garmin/Strava Raw Seconds)
        // 3. Try 'actualDuration' (Often minutes in planning logs, so * 60)
        let durSecs = 0;
        if (item.durationInSeconds != null) {
            durSecs = parseFloat(item.durationInSeconds);
        } else if (item.duration != null) {
            durSecs = parseFloat(item.duration);
        } else if (item.actualDuration != null) {
            durSecs = parseFloat(item.actualDuration) * 60;
        }

        const out = { 
            ...item, 
            // Create a reliable Date Object once
            dateObj: new Date(item.date),
            // Store standardized duration in minutes
            _dur: durSecs / 60 
        };
        
        // Map keys
        Object.entries(KEYS).forEach(([short, raw]) => {
            out[`_${short}`] = getVal(item, raw);
        });
        
        out._zones = item.zones || null;
        out._feeling = item.Feeling || null;
        return out;
    }).sort((a, b) => a.dateObj - b.dateObj);
};

// --- 3. AGGREGATORS ---
const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.dateObj || isNaN(d.dateObj)) return;
        
        const date = d.dateObj; 
        const day = date.getDay(); // 0=Sun, 6=Sat
        const diff = 6 - day; 
        
        const weekEnd = new Date(date.valueOf());
        weekEnd.setDate(date.getDate() + diff);
        weekEnd.setHours(0,0,0,0);
        
        const k = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[k]) weeks[k] = 0;
        if (d._tss > 0) weeks[k] += d._tss; 
    });

    return Object.keys(weeks).map(k => ({ 
        date: new Date(k), 
        dateStr: k, 
        val: weeks[k], 
        name: 'Week Ending ' + k 
    })).sort((a, b) => a.date - b.date);
};

const aggregateWeeklyCalories = (data) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.dateObj) return;
        const date = d.dateObj;
        const day = date.getDay();
        const diff = 6 - day; 
        const weekEnd = new Date(date.valueOf());
        weekEnd.setDate(date.getDate() + diff);
        const k = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[k]) weeks[k] = 0;
        weeks[k] += d._cals;
    });
    return Object.keys(weeks).map(k => ({ date: new Date(k), dateStr: k, val: weeks[k], name: 'Week Ending ' + k }));
};

const aggregateWeeklyBalance = (data) => {
    return data.filter(d => d._zones).map(d => ({
        date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', distribution: d._zones, val: 0
    }));
};

const aggregateFeelingVsLoad = (data) => {
    return data.filter(d => d._tss > 0 || d._feeling).map(d => ({
        date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', 
        load: d._tss, feeling: d._feeling, val: d._tss
    }));
};

// --- 4. EXTRACTOR ---
export const extractMetricData = (data, key) => {
    switch (key) {
        case 'subjective_bike': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._pwr / d._rpe, breakdown: `${Math.round(d._pwr)}W / ${d._rpe}` };
            }).filter(Boolean);
            
        case 'endurance': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._hr) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._pwr / d._hr, breakdown: `${Math.round(d._pwr)}W / ${d._hr}bpm` };
            }).filter(Boolean);

        case 'strength': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._cad_bike) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._pwr / d._cad_bike, breakdown: `${Math.round(d._pwr)}W / ${d._cad_bike}rpm` };
            }).filter(Boolean);

        case 'subjective_run': 
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._spd || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._spd / d._rpe, breakdown: `${d._spd.toFixed(1)} / ${d._rpe}` };
            }).filter(Boolean);

        case 'run': 
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._spd || !d._hr) return null;
                // Running Economy: (Speed * 60) / HR -> Meters per beat (approx)
                const val = (d._spd * 60) / d._hr;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: val, breakdown: `${d._spd.toFixed(1)} m/s / ${d._hr}bpm` };
            }).filter(Boolean);

        case 'mechanical': 
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._vert || !d._gct) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: (d._vert / d._gct) * 100, breakdown: `${d._vert.toFixed(1)}cm / ${d._gct}ms` };
            }).filter(Boolean);

        case 'gct': return data.filter(d => checkSport(d, 'RUN') && d._gct).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._gct }));
        case 'vert': return data.filter(d => checkSport(d, 'RUN') && d._vert).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._vert }));

        case 'subjective_swim': 
            return data.map(d => {
                if (!checkSport(d, 'SWIM') || !d._spd || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._spd / d._rpe, breakdown: '' };
            }).filter(Boolean);

        case 'swim': 
            return data.map(d => {
                if (!checkSport(d, 'SWIM') || !d._spd || !d._hr) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: (d._spd * 60) / d._hr, breakdown: '' };
            }).filter(Boolean);

        case 'vo2max': return data.filter(d => d._vo2).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._vo2 }));
        case 'anaerobic': return data.filter(d => d._ana).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title || 'Workout', val: d._ana }));
        
        case 'tss': return aggregateWeeklyTSS(data);
        case 'calories': return aggregateWeeklyCalories(data);
        case 'training_balance': return aggregateWeeklyBalance(data);
        case 'feeling_load': return aggregateFeelingVsLoad(data);

        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return extractMetricData(allData, `subjective_${sportMode}`);
};

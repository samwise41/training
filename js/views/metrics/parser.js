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
    if (key === 'duration' || key === 'time' || key === 'moving_time') {
        return Formatters.parseDuration(item[key]);
    }
    const val = item[key];
    if (val === null || val === undefined || val === '') return 0;
    return parseFloat(val); 
};

// --- 2. NORMALIZER ---
export const normalizeMetricsData = (rawData) => {
    if (!rawData) return [];
    return rawData.map(item => {
        const out = { 
            ...item, 
            dateObj: new Date(item.date),
            _dur: getVal(item, 'durationInSeconds') / 60 
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
        if (!d.date) return;
        const date = new Date(d.date);
        const day = date.getDay();
        const diff = 6 - day; 
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        const k = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[k]) weeks[k] = 0;
        weeks[k] += d._tss; 
    });
    return Object.keys(weeks).map(k => ({ date: new Date(k), dateStr: k, val: weeks[k], name: 'Week Ending ' + k }));
};

const aggregateWeeklyCalories = (data) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.date) return;
        const date = new Date(d.date);
        const day = date.getDay();
        const diff = 6 - day; 
        const weekEnd = new Date(date);
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

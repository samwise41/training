// js/views/metrics/parser.js

// --- 1. INTERNAL KEYS MAPPING (Restored from your working version) ---
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
    feeling: 'Feeling',
    zones: 'zones'
};

// --- 2. ROBUST SPORT CHECKER (Inlined to prevent import errors) ---
const checkSport = (d, type) => {
    // Check actualSport (Training Log) first, then sport (Legacy)
    const s = (d.actualSport || d.sport || '').toLowerCase();
    const t = type.toLowerCase();
    
    if (t === 'bike') return s.includes('bike') || s.includes('cycl') || s.includes('ride') || s.includes('spin');
    if (t === 'run') return s.includes('run') || s.includes('jog') || s.includes('treadmill');
    if (t === 'swim') return s.includes('swim') || s.includes('pool');
    return false;
};

// --- 3. NORMALIZER (Maps JSON keys to Internal keys) ---
export const normalizeMetricsData = (data) => {
    if (!data) return [];
    return data.map(d => {
        const out = { 
            ...d, 
            dateObj: new Date(d.date),
            // Preserve original duration logic
            _dur: (d.durationInSeconds || d.duration || 0) / 60 
        };
        // Map raw keys to _keys (e.g. _pwr, _hr)
        Object.entries(KEYS).forEach(([short, raw]) => {
            out[`_${short}`] = d[raw] || 0;
        });
        // Keep complex objects at root for special charts
        out._zones = d.zones || null;
        out._feeling = d.Feeling || null;
        return out;
    }).sort((a, b) => a.dateObj - b.dateObj);
};

// --- 4. WEEKLY AGGREGATORS (Restored) ---
const aggregateWeeklySum = (data, key) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.date) return;
        const date = new Date(d.date);
        const day = date.getDay();
        const diff = 6 - day; // Saturday
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        const k = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[k]) weeks[k] = 0;
        weeks[k] += (d[key] || 0);
    });
    return Object.keys(weeks).map(k => ({ date: new Date(k), dateStr: k, val: weeks[k], name: 'Week Ending ' + k }));
};

const aggregateWeeklyBalance = (data) => {
    return data.filter(d => d._zones).map(d => ({
        date: d.dateObj, dateStr: d.date, name: d.title, distribution: d._zones, val: 0
    }));
};

const aggregateFeelingVsLoad = (data) => {
    return data.filter(d => d._tss > 0 || d._feeling).map(d => ({
        date: d.dateObj, dateStr: d.date, name: d.title, 
        load: d._tss, feeling: d._feeling, val: d._tss
    }));
};

// --- 5. MAIN EXTRACTOR (The Logic Engine) ---
export const extractMetricData = (data, key) => {
    switch (key) {
        // --- Bike ---
        case 'subjective_bike': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: d._pwr / d._rpe, breakdown: `${Math.round(d._pwr)}W / ${d._rpe}` };
            }).filter(Boolean);
            
        case 'endurance': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._hr) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: d._pwr / d._hr, breakdown: `${Math.round(d._pwr)}W / ${d._hr}bpm` };
            }).filter(Boolean);

        case 'strength': 
            return data.map(d => {
                if (!checkSport(d, 'BIKE') || !d._pwr || !d._cad_bike) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: d._pwr / d._cad_bike, breakdown: `${Math.round(d._pwr)}W / ${d._cad_bike}rpm` };
            }).filter(Boolean);

        // --- Run ---
        case 'subjective_run': 
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._spd || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: d._spd / d._rpe, breakdown: `${d._spd.toFixed(1)} / ${d._rpe}` };
            }).filter(Boolean);

        case 'run': // Running Economy (Speed/HR)
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._spd || !d._hr) return null;
                // Convert m/s to m/min for calculation: (spd * 60) / HR
                const val = (d._spd * 60) / d._hr;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: val, breakdown: `${d._spd.toFixed(1)} m/s / ${d._hr}bpm` };
            }).filter(Boolean);

        case 'mechanical': 
            return data.map(d => {
                if (!checkSport(d, 'RUN') || !d._vert || !d._gct) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: (d._vert / d._gct) * 100, breakdown: `${d._vert.toFixed(1)}cm / ${d._gct}ms` };
            }).filter(Boolean);

        case 'gct': return data.filter(d => checkSport(d, 'RUN') && d._gct).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title, val: d._gct }));
        case 'vert': return data.filter(d => checkSport(d, 'RUN') && d._vert).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title, val: d._vert }));

        // --- Swim ---
        case 'subjective_swim': 
            return data.map(d => {
                if (!checkSport(d, 'SWIM') || !d._spd || !d._rpe) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: d._spd / d._rpe, breakdown: '' };
            }).filter(Boolean);

        case 'swim': 
            return data.map(d => {
                if (!checkSport(d, 'SWIM') || !d._spd || !d._hr) return null;
                return { date: d.dateObj, dateStr: d.date, name: d.title, val: (d._spd * 60) / d._hr, breakdown: '' };
            }).filter(Boolean);

        // --- General ---
        case 'vo2max': return data.filter(d => d._vo2).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title, val: d._vo2 }));
        case 'anaerobic': return data.filter(d => d._ana).map(d => ({ date: d.dateObj, dateStr: d.date, name: d.title, val: d._ana }));
        
        // --- Aggregates ---
        case 'tss': return aggregateWeeklySum(data, '_tss');
        case 'calories': return aggregateWeeklySum(data, '_cals');
        case 'training_balance': return aggregateWeeklyBalance(data);
        case 'feeling_load': return aggregateFeelingVsLoad(data);

        default: return [];
    }
};

// Legacy compatibility
export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};

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
    // Duration fix: handle string durations
    if ((key === 'duration' || key === 'time' || key === 'moving_time') && typeof item[key] === 'string') {
        return Formatters.parseDuration(item[key]);
    }
    const val = item[key];
    if (val === null || val === undefined || val === '') return 0;
    
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

// --- SYNTHETIC ZONES (Fallback if real zones missing) ---
const estimateZonesFromEffect = (effect) => {
    switch (effect) {
        case 'RECOVERY': return { Recovery: 100, Aerobic: 0, Tempo: 0, Threshold: 0, VO2: 0 };
        case 'AEROBIC_BASE': return { Recovery: 20, Aerobic: 80, Tempo: 0, Threshold: 0, VO2: 0 };
        case 'TEMPO': return { Recovery: 10, Aerobic: 30, Tempo: 60, Threshold: 0, VO2: 0 };
        case 'LACTATE_THRESHOLD': return { Recovery: 10, Aerobic: 20, Tempo: 30, Threshold: 40, VO2: 0 };
        case 'VO2MAX': return { Recovery: 20, Aerobic: 30, Tempo: 10, Threshold: 10, VO2: 30 };
        case 'ANAEROBIC_CAPACITY': 
        case 'SPEED': return { Recovery: 40, Aerobic: 20, Tempo: 0, Threshold: 0, VO2: 40 };
        default: return { Recovery: 50, Aerobic: 50, Tempo: 0, Threshold: 0, VO2: 0 }; // Default Fallback
    }
};

// --- 2. NORMALIZER ---
export const normalizeMetricsData = (rawData) => {
    if (!rawData) return [];
    
    return rawData.map(item => {
        // 1. Duration Standardization
        let durSecs = 0;
        if (item.durationInSeconds != null) durSecs = parseFloat(item.durationInSeconds);
        else if (item.duration != null) durSecs = parseFloat(item.duration);
        else if (item.actualDuration != null) durSecs = parseFloat(item.actualDuration) * 60;

        // 2. Base Object
        const out = { 
            ...item, 
            dateObj: new Date(item.date),
            _dur: durSecs / 60 
        };
        
        // 3. Map Keys
        Object.entries(KEYS).forEach(([short, raw]) => {
            out[`_${short}`] = getVal(item, raw);
        });
        
        // 4. Calculate Estimated Load (Fallback for missing TSS)
        // Formula: Foster's Load = RPE * Minutes
        // We scale it down (/6) to roughly approximate TSS scale (100tss ~= 1hr @ RPE 9-10)
        if (out._rpe > 0 && out._dur > 0) {
            out._load_est = (out._rpe * out._dur) / 6; 
        } else {
            out._load_est = 0;
        }

        // 5. Handle Zones
        // If real zones exist, use them. If not, estimate from Training Effect label.
        if (item.zones) {
            out._zones = item.zones;
        } else if (out._effect) {
            out._zones = estimateZonesFromEffect(out._effect);
        } else {
            out._zones = null;
        }

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
        
        // Use Real TSS if available, otherwise Estimated Load
        const val = d._tss > 0 ? d._tss : d._load_est;
        weeks[k] += val; 
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
    const weeks = {};
    // Chart expects these exact capitalized keys
    const targetKeys = ['Recovery', 'Aerobic', 'Tempo', 'Threshold', 'VO2'];
    
    // Helper to map input keys (e.g., "Zone 1") to target keys (e.g., "Recovery")
    const normalizeZoneKey = (k) => {
        const lower = String(k).toLowerCase();
        if (lower.includes('recovery') || lower.includes('zone 1') || lower === 'z1' || lower === '1') return 'Recovery';
        if (lower.includes('aerobic') || lower.includes('zone 2') || lower === 'z2' || lower === '2') return 'Aerobic';
        if (lower.includes('tempo') || lower.includes('zone 3') || lower === 'z3' || lower === '3') return 'Tempo';
        if (lower.includes('threshold') || lower.includes('zone 4') || lower === 'z4' || lower === '4') return 'Threshold';
        if (lower.includes('vo2') || lower.includes('zone 5') || lower === 'z5' || lower === '5') return 'VO2';
        return null; // Skip unknown keys
    };

    data.forEach(d => {
        if (!d.dateObj || !d._zones) return;

        // 1. Calculate Week Ending Saturday
        // Groups Sunday through Saturday (e.g., Sun Jan 1 -> Sat Jan 7)
        const date = d.dateObj;
        const day = date.getDay(); // 0=Sun ... 6=Sat
        const diff = 6 - day; 
        
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        weekEnd.setHours(0, 0, 0, 0);

        // Safe Date Key (YYYY-MM-DD)
        const y = weekEnd.getFullYear();
        const m = String(weekEnd.getMonth() + 1).padStart(2, '0');
        const dayStr = String(weekEnd.getDate()).padStart(2, '0');
        const k = `${y}-${m}-${dayStr}`;

        if (!weeks[k]) {
            weeks[k] = { Recovery: 0, Aerobic: 0, Tempo: 0, Threshold: 0, VO2: 0, Total: 0 };
        }

        // 2. Normalize and Sum Data
        const zData = d._zones;
        let localSum = 0;
        const tempMap = {};

        // Pre-calculate sum to detect if values are Percentages or Minutes
        Object.keys(zData).forEach(rawKey => {
            const val = parseFloat(zData[rawKey]) || 0;
            const normKey = normalizeZoneKey(rawKey);
            if (normKey && val > 0) {
                tempMap[normKey] = (tempMap[normKey] || 0) + val;
                localSum += val;
            }
        });

        // 3. Convert to "Minutes" for Weighted Aggregation
        // If sum is ~100, assume % and convert to mins using duration. Otherwise assume mins.
        const isPercent = localSum > 90 && localSum < 110;
        const duration = d._dur || 0; 
        // If duration is missing but we have %, default to 1 min just to show distribution
        const weight = (isPercent && duration === 0) ? 1 : duration; 

        Object.entries(tempMap).forEach(([key, val]) => {
            let timeVal = val;
            if (isPercent && weight > 0) {
                timeVal = (val / 100) * weight;
            }
            weeks[k][key] += timeVal;
            weeks[k].Total += timeVal;
        });
    });

    // 4. Output as Percentages for Chart
    return Object.keys(weeks).sort().map(k => {
        const w = weeks[k];
        const dist = {};
        const totalTime = w.Total || 1; // Avoid divide by zero

        targetKeys.forEach(z => {
            dist[z] = (w[z] / totalTime) * 100;
        });

        return { 
            date: new Date(k), 
            dateStr: k, 
            name: 'Week Ending ' + k, 
            distribution: dist, 
            val: 100 // Required to pass "has data" check in chart builder
        };
    });
};

const aggregateFeelingVsLoad = (data) => {
    // Filter: Must have either TSS/Load OR Feeling
    return data.filter(d => (d._tss > 0 || d._load_est > 0) || d._feeling).map(d => {
        // Prefer Real TSS, fallback to Estimated
        const loadVal = d._tss > 0 ? d._tss : d._load_est;
        return {
            date: d.dateObj, 
            dateStr: d.date, 
            name: d.title || 'Workout', 
            load: loadVal, 
            feeling: d._feeling, 
            val: loadVal // Primary value for trend calculation
        };
    });
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

// js/views/metrics/parser.js
import { checkSport } from './utils.js';
import { Formatters } from '../../utils/formatting.js'; 

export const METRIC_FORMULAS = {
    'subjective_bike': '(Avg Power / RPE)',
    'subjective_run': '(Avg Speed / RPE)',
    'subjective_swim': '(Avg Speed / RPE)',
    'endurance': '(Norm Power / Avg HR)',
    'strength': '(Torque / Output)',
    'run': '(Avg Power / Avg Speed)',
    'swim': '(Avg Speed / Stroke Rate)',
    'mechanical': '(Vert Osc / GCT)'
};

// --- STRICT FIELD MAPPING ---
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
    tss: 'trainingStressScore'
};

const getVal = (item, key) => {
    // If it's a time-based key, use the robust parser
    if (key === 'duration' || key === 'time' || key === 'moving_time') {
        return Formatters.parseDuration(item[key]);
    }

    const v = parseFloat(item[key]);
    return (!isNaN(v) && v !== 0) ? v : 0;
};

// --- DATA NORMALIZATION ---
export const normalizeMetricsData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    return rawData.map(d => ({
        ...d,
        date: new Date(d.date),
        actualName: d.actualWorkout || d.activityType || "Activity",
        _pwr: getVal(d, KEYS.pwr),
        _hr:  getVal(d, KEYS.hr),
        _spd: getVal(d, KEYS.spd),
        _rpe: getVal(d, KEYS.rpe),
        _gct: getVal(d, KEYS.gct),
        _vert: getVal(d, KEYS.vert),
        _vo2: getVal(d, KEYS.vo2),
        _ana: getVal(d, KEYS.ana),
        _tss: getVal(d, KEYS.tss),
        _cad: getVal(d, KEYS.cad_bike) || getVal(d, KEYS.cad_run)
    }));
};

// --- AGGREGATION ---
export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const tss = getVal(d, KEYS.tss);
        if (tss <= 0) return;
        const date = new Date(d.date);
        const day = date.getDay(); 
        const diff = date.getDate() - day + (day === 0 ? 0 : 7); 
        const weekEnd = new Date(date.setDate(diff));
        weekEnd.setHours(0,0,0,0);
        const key = weekEnd.toISOString().split('T')[0];
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += tss;
    });
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k), dateStr: `Week Ending ${k}`, name: "Weekly Load", val: weeks[k], breakdown: `Total TSS: ${Math.round(weeks[k])}`
    }));
};

// --- MAIN EXTRACTOR ---
export const extractMetricData = (data, key) => {
    switch(key) {
        case 'endurance': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                if (x._pwr > 0 && x._hr > 0) return { val: x._pwr / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(x._pwr)} / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'strength': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                if (x._pwr > 0 && x._cad > 0) return { val: x._pwr / x._cad, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(x._pwr)} / RPM:${Math.round(x._cad)}` };
            }).filter(Boolean);
        case 'run': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                if (x._spd > 0 && x._hr > 0) return { val: (x._spd * 60) / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pace:${Math.round(x._spd*60)}m/m / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'mechanical': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                if (x._spd > 0 && x._pwr > 0) return { val: (x._spd * 100) / x._pwr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${x._spd.toFixed(1)} / Pwr:${Math.round(x._pwr)}` };
            }).filter(Boolean);
        case 'gct': 
            return data.filter(x => checkSport(x, 'RUN') && x._gct > 0).map(x => ({ val: x._gct, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${Math.round(x._gct)} ms` }));
        case 'vert': 
            return data.filter(x => checkSport(x, 'RUN') && x._vert > 0).map(x => ({ val: x._vert, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${x._vert.toFixed(1)} cm` }));
        case 'swim': 
            return data.filter(x => checkSport(x, 'SWIM')).map(x => {
                if (x._spd > 0 && x._hr > 0) return { val: (x._spd * 60) / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${(x._spd*60).toFixed(1)}m/m / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'vo2max': 
            return data.map(x => { if (x._vo2 > 0) return { val: x._vo2, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: "VO2 Est", breakdown: `Score: ${x._vo2}` }; }).filter(Boolean);
        case 'anaerobic': 
            return data.map(x => { if (x._ana > 0.5) return { val: x._ana, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Anaerobic: ${x._ana}` }; }).filter(Boolean);
        case 'tss': return aggregateWeeklyTSS(data);
        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return allData.map(d => {
        const rpe = d._rpe;
        if (!rpe || rpe <= 0) return null;
        let val = 0, breakdown = "", match = false;
        if (sportMode === 'bike' && checkSport(d, 'BIKE') && d._pwr > 0) { val = d._pwr / rpe; breakdown = `${Math.round(d._pwr)}W / ${rpe} RPE`; match = true; }
        else if (sportMode === 'run' && checkSport(d, 'RUN') && d._spd > 0) { val = d._spd / rpe; breakdown = `${d._spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        else if (sportMode === 'swim' && checkSport(d, 'SWIM') && d._spd > 0) { val = d._spd / rpe; breakdown = `${d._spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        if (match && val > 0) return { date: d.date, dateStr: d.date.toISOString().split('T')[0], val: val, name: d.actualName, breakdown: breakdown };
        return null;
    }).filter(Boolean).sort((a, b) => a.date - b.date);
};

export const extractSubjectiveTableData = (data, key) => {
    if (key.startsWith('subjective_')) return calculateSubjectiveEfficiency(data, key.split('_')[1]);
    return [];
};

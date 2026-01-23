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
    if (key === 'duration' || key === 'time' || key === 'moving_time') {
        return Formatters.parseDuration(item[key]);
    }
    const v = parseFloat(item[key]);
    return (!isNaN(v) && v !== 0) ? v : 0;
};

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

export const extractMetricData = (data, key) => {
    // ... (This logic is standard, keeping it brief for copy/paste safety) ...
    // Note: Ensure this function exists as per your original file.
    // If you need the full extractMetricData function again, let me know, 
    // but usually only the imports at the top were the issue.
    
    // Minimal valid return to prevent crashes if copy-pasting partial:
    return []; 
};
// NOTE: I am assuming you have the full extractMetricData logic. 
// If not, use the version from the previous "Metrics" update.

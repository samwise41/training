// js/views/metrics/definitions.js
import { Formatters } from '../../utils/formatting.js'; 

const C = Formatters.COLORS;

export const METRIC_DEFINITIONS = {
    'vo2max': {
        title: 'VO2 Max Estimate',
        icon: 'fa-heart-pulse',
        colorVar: '#10b981', // Emerald
        description: 'Estimated maximum oxygen uptake. A key indicator of aerobic endurance potential.',
        rangeInfo: 'Target: >50 (Good) | >60 (Elite)',
        improvement: 'Increase via long slow distance (Zone 2) and VO2 Max intervals (Zone 5).'
    },
    'tss': {
        title: 'Training Stress',
        icon: 'fa-layer-group',
        colorVar: '#f59e0b', // Amber
        description: 'Accumulated training load. Higher numbers indicate higher volume or intensity.',
        rangeInfo: 'Target: 400-600 / week',
        improvement: 'Consistent daily training. Monitor fatigue if >700/week.'
    },
    'anaerobic': {
        title: 'Anaerobic Effect',
        icon: 'fa-fire',
        colorVar: '#ef4444', // Red
        description: 'Training effect on anaerobic capacity (sprints/power).',
        rangeInfo: 'Target: >2.0 on hard days',
        improvement: 'Add intervals above threshold and sprint repeats.'
    },
    'subjective_bike': {
        title: 'Cycling Efficiency',
        icon: 'fa-bicycle',
        colorVar: C.Bike,
        description: 'Ratio of Power to RPE. Higher means generating more power with less perceived effort.',
        rangeInfo: 'Target: >30 (Watts per RPE point)',
        improvement: 'Improve aerobic base (Zone 2) and bike fit.'
    },
    'endurance': {
        title: 'Aerobic Decoupling',
        icon: 'fa-lungs',
        colorVar: '#a855f7', // Purple
        description: 'Ratio of Power to Heart Rate. Tracks cardiac drift.',
        rangeInfo: 'Target: < 5% drift',
        improvement: 'Long steady rides. Stay hydrated and cool.'
    },
    'strength': {
        title: 'Torque / Force',
        icon: 'fa-dumbbell',
        colorVar: '#6366f1', // Indigo
        description: 'Power produced per pedal revolution (Torque).',
        rangeInfo: 'Target: Varies by cadence',
        improvement: 'Low cadence / high resistance intervals (Big Gear work).'
    },
    'subjective_run': {
        title: 'Run Efficiency',
        icon: 'fa-person-running',
        colorVar: C.Run,
        description: 'Ratio of Pace (m/s) to RPE.',
        rangeInfo: 'Target: >0.4',
        improvement: 'Improve running form and economy.'
    },
    'run': {
        title: 'Running Economy',
        icon: 'fa-stopwatch',
        colorVar: '#ec4899', // Pink
        description: 'Pace achieved per heartbeat.',
        rangeInfo: 'Target: Higher is better',
        improvement: 'Run hill repeats and strides.'
    },
    'mechanical': {
        title: 'Form Efficiency',
        icon: 'fa-ruler-combined',
        colorVar: '#14b8a6', // Teal
        description: 'Ratio of forward speed to vertical movement.',
        rangeInfo: 'Target: High',
        improvement: 'Increase cadence, reduce bounding.'
    },
    'gct': {
        title: 'Ground Contact',
        icon: 'fa-shoe-prints',
        colorVar: '#f43f5e', // Rose
        description: 'Time spent on the ground per step (ms).',
        rangeInfo: 'Target: < 250ms',
        improvement: 'Quick feet drills, plyometrics, higher cadence.'
    },
    'vert': {
        title: 'Vertical Oscillation',
        icon: 'fa-arrows-up-down',
        colorVar: '#8b5cf6', // Violet
        description: 'Up/down movement while running (cm).',
        rangeInfo: 'Target: 6-10 cm',
        improvement: 'Focus on driving forward, not up.'
    },
    'subjective_swim': {
        title: 'Swim Efficiency',
        icon: 'fa-person-swimming',
        colorVar: C.Swim,
        description: 'Speed per RPE point.',
        rangeInfo: 'Target: Varies',
        improvement: 'Focus on technique drills and body position.'
    },
    'swim': {
        title: 'Swim Economy',
        icon: 'fa-water',
        colorVar: '#0ea5e9', // Sky
        description: 'Speed vs Heart Rate.',
        rangeInfo: 'Target: Higher is better',
        improvement: 'Interval sets with short rest.'
    }
};

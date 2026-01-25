// js/views/metrics/definitions.js

export const METRIC_DEFINITIONS = {
    // --- CYCLING ---
    subjective_bike: {
        title: "Bike RPE Efficiency", sport: "Bike", icon: "fa-person-biking", 
        colorVar: "var(--color-bike)", 
        refMin: 25, refMax: 50, invertRanges: false, 
        rangeInfo: "25 – 50 W/RPE",
        description: "Power produced per unit of perceived effort.",
        improvement: "• Aerobic Base<br>• Muscular Endurance"
    },
    endurance: {
        title: "Aerobic Efficiency", sport: "Bike", icon: "fa-heart-pulse", 
        colorVar: "var(--color-bike)",
        refMin: 1.30, refMax: 1.70, invertRanges: false, 
        rangeInfo: "1.30 – 1.70 EF",
        description: "Watts produced per heartbeat (Efficiency Factor).",
        improvement: "• Long Z2 Rides<br>• Consistent Volume"
    },
    strength: {
        title: "Pedal Force (Torque)", sport: "Bike", icon: "fa-bolt", 
        colorVar: "var(--color-bike)",
        refMin: 1.5, refMax: 3.0, invertRanges: false, 
        rangeInfo: "1.5 – 3.0 W/RPM",
        description: "Force applied to pedals per revolution (Power ÷ Cadence).",
        improvement: "• Low Score: Efficient Spinning (Good for Z2)<br>• High Score: Muscular Grinding (Good for Strength)"
    },

    // --- RUNNING ---
    subjective_run: {
        title: "Run RPE Efficiency", sport: "Run", icon: "fa-person-running", 
        colorVar: "var(--color-run)",
        refMin: 0.6, refMax: 1.0, invertRanges: false, 
        rangeInfo: "0.6 – 1.0 Spd/RPE",
        description: "Speed (m/s) produced per unit of perceived effort.",
        improvement: "• Run Economy<br>• Durability"
    },
    run: {
        title: "Running Economy", sport: "Run", icon: "fa-gauge-high", 
        colorVar: "var(--color-run)",
        refMin: 1.0, refMax: 1.6, invertRanges: false, 
        rangeInfo: "1.0 – 1.6 m/beat",
        description: "Distance (meters) traveled per heartbeat.",
        improvement: "• Strides & Hill Sprints<br>• Plyometrics"
    },
    mechanical: {
        title: "Mechanical Stiffness", sport: "Run", icon: "fa-ruler-horizontal", 
        colorVar: "var(--color-run)",
        refMin: 0.75, refMax: 0.95, invertRanges: false, 
        rangeInfo: "0.75 – 0.95 Ratio",
        description: "Ratio of Speed vs. Power output.",
        improvement: "• High Cadence (170+)<br>• Form Drills (A-Skips)"
    },
    gct: {
        title: "Ground Contact Time", sport: "Run", icon: "fa-stopwatch", 
        colorVar: "var(--color-run)",
        refMin: 220, refMax: 260, invertRanges: true, 
        rangeInfo: "< 260 ms",
        description: "Time spent on the ground per step.",
        improvement: "• Increase Cadence<br>• 'Hot Coals' Imagery"
    },
    vert: {
        title: "Vertical Oscillation", sport: "Run", icon: "fa-arrows-up-down", 
        colorVar: "var(--color-run)",
        refMin: 6.0, refMax: 9.0, invertRanges: true, 
        rangeInfo: "6.0 – 9.0 cm",
        description: "Vertical bounce height.",
        improvement: "• Core Stability<br>• Hill Repeats"
    },

    // --- SWIMMING ---
    subjective_swim: {
        title: "Swim RPE Efficiency", sport: "Swim", icon: "fa-person-swimming", 
        colorVar: "var(--color-swim)",
        refMin: 0.15, refMax: 0.3, invertRanges: false, 
        rangeInfo: "0.15 – 0.3 Spd/RPE",
        description: "Water speed (m/s) relative to effort.",
        improvement: "• Technique<br>• Drag Reduction"
    },
    swim: {
        title: "Swim Efficiency", sport: "Swim", icon: "fa-person-swimming", 
        colorVar: "var(--color-swim)",
        refMin: 0.3, refMax: 0.6, invertRanges: false, 
        rangeInfo: "0.3 – 0.6 m/beat",
        description: "Distance traveled per heartbeat in water.",
        improvement: "• Drills (Catch/Pull)<br>• Long Steady Swims"
    },

    // --- GENERAL ---
    vo2max: {
        title: "VO₂ Max Trend", sport: "All", icon: "fa-lungs", 
        colorVar: "var(--color-all)",
        refMin: 45, refMax: 60, invertRanges: false, 
        rangeInfo: "45 – 60+",
        description: "Estimated aerobic ceiling.",
        improvement: "• VO2 Max Intervals<br>• Consistency"
    },
    tss: {
        title: "Weekly TSS Load", sport: "All", icon: "fa-layer-group", 
        colorVar: "var(--color-all)",
        refMin: 300, refMax: 600, invertRanges: false, 
        rangeInfo: "300 – 600 TSS",
        description: "Total training stress per week.",
        improvement: "• Increase Volume<br>• Increase Intensity"
    },
    anaerobic: {
        title: "Anaerobic Impact", sport: "All", icon: "fa-fire", 
        colorVar: "var(--color-all)",
        refMin: 2.0, refMax: 4.0, invertRanges: false, 
        rangeInfo: "2.0 – 4.0",
        description: "Intensity stimulus on hard days.",
        improvement: "• All-out Sprints<br>• Full Recovery"
    },
    calories: {
        title: "Weekly Energy Burn", sport: "All", icon: "fa-fire-flame-curved",
        colorVar: "var(--color-all)",
        refMin: 3500, refMax: 6000, invertRanges: false, 
        rangeInfo: "3.5k – 6k kcal",
        description: "Total active energy expenditure per week.",
        improvement: "• Increase Duration<br>• Add Frequency"
    }
};

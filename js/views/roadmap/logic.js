// js/views/roadmap/logic.js
import { Parser } from '../../parser.js';

/**
 * Generates the hardcoded volume progression data.
 * Matches the reference logic from the original roadmap.js
 */
export const generateVolumeData = () => {
    // 1. Setup Dates
    const startDate = new Date("2025-12-27T12:00:00"); 

    const weeks = [];
    const block1_sat = 2.0;
    const block2_sat = 2.5;
    const block3_sat = 3.0;

    // Helper: Add a week to the data array
    const addWeek = (wNum, vol, sat, type, phase) => {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + (wNum - 1) * 7);
        const dateStr = `${current.getMonth() + 1}/${current.getDate()}`;
        weeks.push({ w: wNum, vol, sat, type, phase, dateStr });
    };

    // --- Calculate Volume Progression ---
    
    // BLOCK 1: BASE
    let w1 = 6.0;
    let w2 = w1 * 1.05;
    let w3 = w2 * 1.05;
    let w4 = w3 * 0.60;
    addWeek(1, w1, block1_sat, 'normal', "Base");
    addWeek(2, w2, block1_sat, 'normal', "Base");
    addWeek(3, w3, block1_sat, 'normal', "Base");
    addWeek(4, w4, 1.5, 'deload', "Base");

    // BLOCK 2: BUILD
    let w5 = w3 + 0.5;
    let w6 = w5 * 1.05;
    let w7 = w6 * 1.05;
    let w8 = w7 * 0.60;
    addWeek(5, w5, block2_sat, 'step', "Build");
    addWeek(6, w6, block2_sat, 'normal', "Build");
    addWeek(7, w7, block2_sat, 'normal', "Build");
    addWeek(8, w8, 1.5, 'deload', "Build");

    // BLOCK 3: PEAK
    let w9 = w7 + 0.5;
    let w10 = w9 * 1.05;
    let w11 = w10 * 1.05;
    let w12 = w11 * 0.60;
    addWeek(9, w9, block3_sat, 'step', "Peak");
    addWeek(10, w10, block3_sat, 'normal', "Peak");
    addWeek(11, w11, block3_sat, 'normal', "Peak");
    addWeek(12, w12, 2.0, 'deload', "Peak");

    return weeks;
};

/**
 * Parses the "Periodization Phases" section from the Markdown.
 */
export const parsePhases = (planMd) => {
    const phasesSection = Parser.getSection(planMd, "Periodization Phases");
    if (!phasesSection) return [];

    const lines = phasesSection.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---') && !l.toLowerCase().includes('phase'));
    
    return lines.map(line => {
        const cols = line.split('|').map(c => c.trim()).filter(c => c);
        if (cols.length < 4) return null;
        return { 
            name: cols[0], 
            focus: cols[1], 
            dates: cols[2], 
            weeks: cols[3] 
        };
    }).filter(p => p);
};

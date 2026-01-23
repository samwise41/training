// js/utils/formatting.js

export const Formatters = {
    // --- 1. Centralized Colors ---
    COLORS: { 
        All: 'var(--color-all)', 
        Bike: 'var(--color-bike)',
        Run: 'var(--color-run)',
        Swim: 'var(--color-swim)',
        Gym: '#94a3b8' // Slate-400
    },

    // --- 2. Robust Time Parsing ---
    // Converts "1h 30m", "90m", "1:30", or raw numbers into MINUTES (Int)
    parseDuration(str) {
        if (!str || str === '-' || str.toLowerCase() === 'n/a') return 0;
        if (typeof str === 'number') return Math.round(str);
        
        let mins = 0;
        const clean = str.toString().toLowerCase().trim();
        
        // Format: "1h 30m" or "1.5h"
        if (clean.includes('h')) {
            const parts = clean.split('h');
            mins += parseFloat(parts[0]) * 60;
            if (parts[1] && parts[1].includes('m')) {
                mins += parseInt(parts[1].replace('m',''));
            }
        } 
        // Format: "1:30" (1 hr 30 mins)
        else if (clean.includes(':')) {
            const parts = clean.split(':');
            mins += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        } 
        // Format: "90" or "90m"
        else {
            mins += parseFloat(clean.replace(/[^\d.]/g, ''));
        }
        
        return Math.round(mins);
    },

    // --- 3. Standard Icons ---
    getIconForSport(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('bike') || t.includes('cycl')) return '<i class="fa-solid fa-bicycle icon-bike"></i>';
        if (t.includes('run')) return '<i class="fa-solid fa-person-running icon-run"></i>';
        if (t.includes('swim')) return '<i class="fa-solid fa-person-swimming icon-swim"></i>';
        if (t.includes('gym') || t.includes('strength')) return '<i class="fa-solid fa-dumbbell text-slate-400"></i>';
        return '<i class="fa-solid fa-chart-line icon-all"></i>';
    }
};

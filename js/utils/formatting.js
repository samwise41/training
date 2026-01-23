// js/utils/formatting.js

export const Formatters = {
    // --- 1. Colors ---
    COLORS: { 
        All: 'var(--color-all)', 
        Bike: 'var(--color-bike)',
        Run: 'var(--color-run)',
        Swim: 'var(--color-swim)',
        Gym: '#94a3b8' 
    },

    // --- 2. Duration Parsing ---
    parseDuration(str) {
        if (!str || str === '-' || str.toLowerCase() === 'n/a') return 0;
        if (typeof str === 'number') return Math.round(str);
        
        let mins = 0;
        const clean = str.toString().toLowerCase().trim();
        
        if (clean.includes('h')) {
            const parts = clean.split('h');
            mins += parseFloat(parts[0]) * 60;
            if (parts[1] && parts[1].includes('m')) {
                mins += parseInt(parts[1].replace('m',''));
            }
        } else if (clean.includes(':')) {
            const parts = clean.split(':');
            mins += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        } else {
            mins += parseFloat(clean.replace(/[^\d.]/g, ''));
        }
        return Math.round(mins);
    },

    // --- 3. Date Helpers (New) ---
    toLocalYMD(dateObj) {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        // Adjust for timezone offset to prevent "yesterday" bugs
        const offset = d.getTimezoneOffset() * 60000;
        const local = new Date(d.getTime() - offset);
        return local.toISOString().split('T')[0];
    },

    // --- 4. Icons & Styles ---
    getIconForSport(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('bike') || t.includes('cycl')) return '<i class="fa-solid fa-bicycle"></i>';
        if (t.includes('run')) return '<i class="fa-solid fa-person-running"></i>';
        if (t.includes('swim')) return '<i class="fa-solid fa-person-swimming"></i>';
        if (t.includes('gym') || t.includes('strength')) return '<i class="fa-solid fa-dumbbell"></i>';
        return '<i class="fa-solid fa-chart-line"></i>';
    },

    getSportColorVar(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('bike')) return this.COLORS.Bike;
        if (t.includes('run')) return this.COLORS.Run;
        if (t.includes('swim')) return this.COLORS.Swim;
        return this.COLORS.All;
    }
};

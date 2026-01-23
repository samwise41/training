export const Formatters = {
    // --- 1. Colors ---
    COLORS: { 
        All: 'var(--color-all)', 
        Bike: 'var(--color-bike)',
        Run: 'var(--color-run)',
        Swim: 'var(--color-swim)',
        Gym: '#94a3b8' 
    },

    // --- 2. Weather Map ---
    WEATHER: {
        0: ["Clear", "☀️"], 1: ["Partly Cloudy", "🌤️"], 2: ["Partly Cloudy", "🌤️"], 3: ["Cloudy", "☁️"],
        45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"], 51: ["Drizzle", "🌦️"], 
        61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"],
        71: ["Snow", "❄️"], 95: ["Storm", "⛈️"]
    },

    getWeatherInfo(code) {
        return this.WEATHER[code] || ["Unknown", "qm"];
    },

    // --- 3. Duration Parsing (Minutes) ---
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

    // --- 4. Date Helper ---
    toLocalYMD(dateObj) {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        const offset = d.getTimezoneOffset() * 60000;
        const local = new Date(d.getTime() - offset);
        return local.toISOString().split('T')[0];
    },

    // --- 5. Icon & Style Helpers ---
    getIconForSport(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('bike') || t.includes('cycl')) return '<i class="fa-solid fa-bicycle icon-bike"></i>';
        if (t.includes('run')) return '<i class="fa-solid fa-person-running icon-run"></i>';
        if (t.includes('swim')) return '<i class="fa-solid fa-person-swimming icon-swim"></i>';
        if (t.includes('gym') || t.includes('strength')) return '<i class="fa-solid fa-dumbbell text-slate-400"></i>';
        return '<i class="fa-solid fa-chart-line icon-all"></i>';
    }
};

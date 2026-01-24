// js/utils/formatting.js

// Helper to read CSS variables safely
const getCSS = (varName, fallback) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (val) return val;
    }
    return fallback;
};

export const Formatters = {
    // --- 1. Colors (Dynamic Source of Truth) ---
    // Instead of a static object, we use a getter to pull fresh values from CSS
    get COLORS() {
        return {
            All: getCSS('--color-all', '#34d399'),
            Bike: getCSS('--color-bike', '#c084fc'),
            Run: getCSS('--color-run', '#f472b6'),
            Swim: getCSS('--color-swim', '#22d3ee'),
            Gym: getCSS('--color-gym', '#94a3b8')
        };
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
    parseDuration(val) {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return Math.round(val);

        const str = String(val).trim().toLowerCase();
        if (str === '-' || str === 'n/a' || str === '') return 0;
        
        let mins = 0;
        if (str.includes('h')) {
            const parts = str.split('h');
            mins += parseFloat(parts[0]) * 60;
            if (parts[1] && parts[1].includes('m')) {
                mins += parseInt(parts[1].replace('m',''));
            }
        } else if (str.includes(':')) {
            const parts = str.split(':');
            mins += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        } else {
            mins += parseFloat(str.replace(/[^\d.]/g, ''));
        }
        return Math.round(mins) || 0;
    },

    // --- 4. Date Helper ---
    toLocalYMD(dateObj) {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        if (isNaN(d.getTime())) return '';
        const offset = d.getTimezoneOffset() * 60000;
        const local = new Date(d.getTime() - offset);
        return local.toISOString().split('T')[0];
    },

    // --- 5. Icon & Style Helpers ---
    getIconForSport(type) {
        const t = String(type || '').toLowerCase();
        if (t.includes('bike') || t.includes('cycl')) return '<i class="fa-solid fa-bicycle icon-bike"></i>';
        if (t.includes('run')) return '<i class="fa-solid fa-person-running icon-run"></i>';
        if (t.includes('swim')) return '<i class="fa-solid fa-person-swimming icon-swim"></i>';
        if (t.includes('gym') || t.includes('strength')) return '<i class="fa-solid fa-dumbbell icon-gym"></i>';
        return '<i class="fa-solid fa-chart-line icon-all"></i>';
    }
};

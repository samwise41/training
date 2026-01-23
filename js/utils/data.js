// js/utils/data.js

const CACHE_BUSTER = Date.now();

const DATA_SOURCES = {
    // Critical (Dashboard)
    planMd:     './endurance_plan.md',
    log:        './data/training_log.json',
    readiness:  './data/readiness/readiness.json',
    schedule:   './data/dashboard/plannedWorkouts.json',
    topCards:   './data/dashboard/top_cards.json',
    
    // Background / Lazy (Other Tabs)
    gear:       './data/gear/gear.json',
    garmin:     './data/my_garmin_data_ALL.json',
    profile:    './data/profile.json',
    trends:     './data/trends/trends.json',
    heatmaps:   './data/dashboard/heatmaps.json',
    adherence:  './data/trends/adherence.json'
};

export const DataManager = {
    // Simple memory cache
    _cache: {},

    async fetchJSON(key) {
        // Return memory cache if available
        if (this._cache[key]) return this._cache[key];

        const url = DATA_SOURCES[key];
        if (!url) return null;

        try {
            const res = await fetch(`${url}?t=${CACHE_BUSTER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this._cache[key] = data; // Store in cache
            return data;
        } catch (e) {
            console.warn(`⚠️ Failed to load ${key}:`, e.message);
            return null;
        }
    },

    async fetchText(key) {
        if (this._cache[key]) return this._cache[key];
        const url = DATA_SOURCES[key];
        try {
            const res = await fetch(`${url}?t=${CACHE_BUSTER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            this._cache[key] = text;
            return text;
        } catch (e) { return ""; }
    },

    /**
     * 1. CRITICAL: Only what is needed to render the Dashboard immediately
     */
    async loadCriticalData() {
        console.log("🚀 Loading Critical Data...");
        const [planMd, log, readiness] = await Promise.all([
            this.fetchText('planMd'),
            this.fetchJSON('log'),
            this.fetchJSON('readiness')
        ]);
        return { planMd, rawLogData: log, readinessData: readiness };
    },

    /**
     * 2. BACKGROUND: Load the rest silently after the app starts
     */
    async loadBackgroundData() {
        console.log("💤 Loading Background Data...");
        const [gear, garmin, profile, trends] = await Promise.all([
            this.fetchJSON('gear'),
            this.fetchJSON('garmin'),
            this.fetchJSON('profile'),
            this.fetchJSON('trends')
        ]);
        return { gearData: gear, garminData: garmin, profileData: profile, trendsData: trends };
    }
};

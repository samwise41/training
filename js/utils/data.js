// js/utils/data.js

const CACHE_BUSTER = Date.now();

const DATA_SOURCES = {
    // 1. CRITICAL (Loaded at startup)
    planMd:     './endurance_plan.md',
    log:        './data/training_log.json',
    readiness:  './data/readiness/readiness.json',
    profile:    './data/profile.json', // Moved here so Zones/FTP always have data
    
    // 2. VIEW SPECIFIC (Loaded only when needed)
    gear:       './data/gear/gear.json',
    trends:     './data/trends/trends.json',
    heatmaps:   './data/dashboard/heatmaps.json',
    schedule:   './data/dashboard/plannedWorkouts.json',
    topCards:   './data/dashboard/top_cards.json',
    adherence:  './data/trends/adherence.json'
};

export const DataManager = {
    _cache: {},

    async fetchJSON(key) {
        if (this._cache[key]) return this._cache[key];
        
        const url = DATA_SOURCES[key];
        if (!url) return null;

        try {
            const res = await fetch(`${url}?t=${CACHE_BUSTER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this._cache[key] = data;
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

    async loadCriticalData() {
        console.log("🚀 Loading Critical Data...");
        const [planMd, log, readiness, profile] = await Promise.all([
            this.fetchText('planMd'),
            this.fetchJSON('log'),
            this.fetchJSON('readiness'),
            this.fetchJSON('profile')
        ]);
        
        return { 
            planMd, 
            rawLogData: log || [], 
            readinessData: readiness || null,
            profileData: profile || {} 
        };
    },

    async loadBackgroundData() {
        console.log("💤 Loading Background Data...");
        const [gear, trends, adherence] = await Promise.all([
            this.fetchJSON('gear'),
            this.fetchJSON('trends'),
            this.fetchJSON('adherence')
        ]);
        
        return { 
            gearData: gear, 
            trendsData: trends,
            adherenceData: adherence // Optional, used by Trends view
        };
    }
};

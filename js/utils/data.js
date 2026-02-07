// js/utils/data.js

const DATA_SOURCES = {
    // 1. CRITICAL (Loaded at startup)
    planMd:     './endurance_plan.md',
    log:        './data/training_log.json',
    readiness:  './data/readiness/readiness.json',
    profile:    './data/zones/profile.json',
    
    // 2. VIEW SPECIFIC (Loaded only when needed)
    zones:      './data/zones/zones.json',
    gear:       './data/gear/gear.json',
    trends:     './data/trends/trends.json',
    heatmaps:   './data/dashboard/heatmaps.json',
    schedule:   './data/dashboard/plannedWorkouts.json',
    topCards:   './data/dashboard/top_cards.json',
    adherence:  './data/trends/adherence.json',
    METRICS_CONFIG: 'data/metrics/metrics_config.json',
    COACHING_VIEW: 'data/metrics/coaching_view.json',
    fuelLibrary: './data/fueling/fuelLibrary.json'
};

export const DataManager = {
    _cache: {},

    async fetchJSON(key) {
        // FIX 1: Bypass internal memory cache to force a network check every time
        // if (this._cache[key]) return this._cache[key];
        
        const url = DATA_SOURCES[key];
        if (!url) return null;

        try {
            // FIX 2: Generate a unique timestamp for EVERY request
            // This forces the browser to ignore its own cache
            const timestamp = Date.now();
            const res = await fetch(`${url}?t=${timestamp}`);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            // We still update the cache object, mostly for debugging
            this._cache[key] = data;
            return data;
        } catch (e) {
            console.warn(`⚠️ Failed to load ${key}:`, e.message);
            return null;
        }
    },

    async fetchText(key) {
        // FIX 1: Bypass internal memory cache
        // if (this._cache[key]) return this._cache[key];
        
        const url = DATA_SOURCES[key];
        try {
            // FIX 2: Dynamic timestamp
            const timestamp = Date.now();
            const res = await fetch(`${url}?t=${timestamp}`);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            
            this._cache[key] = text;
            return text;
        } catch (e) { return ""; }
    },

    async loadCriticalData() {
        console.log("🚀 Loading Critical Data (Fresh Fetch)...");
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
        console.log("💤 Loading Background Data (Fresh Fetch)...");
        const [gear, trends, adherence] = await Promise.all([
            this.fetchJSON('gear'),
            this.fetchJSON('trends'),
            this.fetchJSON('adherence')
        ]);
        
        return { 
            gearData: gear, 
            trendsData: trends,
            adherenceData: adherence 
        };
    }
};

// js/utils/data.js

const CACHE_BUSTER = Date.now();

// Central Configuration for all Data Files
const DATA_SOURCES = {
    // Core Data (Loaded on Boot)
    planMd:     './endurance_plan.md',
    log:        './data/training_log.json',
    gear:       './data/gear/gear.json',
    garmin:     './data/my_garmin_data_ALL.json',
    profile:    './data/profile.json',
    readiness:  './data/readiness/readiness.json',
    trends:     './data/trends/trends.json',
    
    // Lazy Loaded Data (Loaded only when view opens)
    heatmaps:   './data/dashboard/heatmaps.json',
    schedule:   './data/dashboard/plannedWorkouts.json',
    topCards:   './data/dashboard/top_cards.json',
    adherence:  './data/trends/adherence.json'
};

export const DataManager = {
    _cache: {},

    /**
     * Generic fetch wrapper with error handling and cache busting
     */
    async fetchJSON(key) {
        const url = DATA_SOURCES[key];
        if (!url) {
            console.error(`❌ Data Source not found: ${key}`);
            return null;
        }

        try {
            const res = await fetch(`${url}?t=${CACHE_BUSTER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`⚠️ Failed to load ${key}:`, e.message);
            return null;
        }
    },

    async fetchText(key) {
        const url = DATA_SOURCES[key];
        if (!url) return "";
        try {
            const res = await fetch(`${url}?t=${CACHE_BUSTER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (e) {
            return "";
        }
    },

    /**
     * Load all "Critical" data needed for App Boot
     */
    async loadCoreData() {
        console.log("📡 Fetching Core Data...");
        
        // Parallel Fetch
        const [log, gear, garmin, profile, readiness, trends, planMd] = await Promise.all([
            this.fetchJSON('log'),
            this.fetchJSON('gear'),
            this.fetchJSON('garmin'),
            this.fetchJSON('profile'),
            this.fetchJSON('readiness'),
            this.fetchJSON('trends'),
            this.fetchText('planMd')
        ]);

        // Store in local cache object if needed, or just return
        return {
            rawLogData: log || [],
            gearData: gear || { bike: [], run: [] },
            garminData: garmin || [],
            profileData: profile || {},
            readinessData: readiness || null,
            trendsData: trends || null,
            planMd: planMd || ""
        };
    }
};

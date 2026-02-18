import { DataManager } from '../../utils/data.js';

// --- CENTRAL DEFINITION OF KEY DISTANCES ---
export const KEY_DISTANCES = [
    { label: '400m', val: 0.2485, keys: ['400m'] },
    { label: '1/2 mi', val: 0.5,    keys: ['1/2 mile', '800m', '0.5 mile'] },
    { label: '1k',   val: 0.6214,   keys: ['1k', '1 km'] },
    { label: '1 mi', val: 1.0,      keys: ['1 mile', '1 mi'] },
    { label: '2 mi', val: 2.0,      keys: ['2 mile', '2 mi'] },
    { label: '5k',   val: 3.107,    keys: ['5k', '5 km'] },
    { label: '10k',  val: 6.214,    keys: ['10k', '10 km'] },
    { label: 'Half', val: 13.109,   keys: ['half', '13.1'] },
    { label: 'Full', val: 26.219,   keys: ['marathon', '26.2', 'full'] }
];

export const FTPData = {
    async fetchCycling() {
        try {
            const data = await DataManager.fetchJSON('power_curve_graph.json');
            if (!data) {
                const res = await fetch('strava_data/cycling/power_curve_graph.json');
                if (res.ok) return await res.json();
            }
            return data || [];
        } catch (e) {
            console.warn("Cycling data fetch failed", e);
            return [];
        }
    },

    async fetchRunning() {
        try {
            const res = await fetch('strava_data/running/my_running_prs.md');
            if (!res.ok) return [];
            const text = await res.text();
            return this.parseRunningMarkdown(text);
        } catch (e) {
            console.warn("Running data fetch failed", e);
            return [];
        }
    },
    
    async fetchGarminHistory() {
        try {
            const res = await fetch('garmin_data/garmin_health.json');
            if (res.ok) return await res.json();
            // Fallback to data manager if file moved
            return await DataManager.fetchJSON('my_garmin_data_ALL.json') || [];
        } catch(e) {
            console.warn("History fetch failed", e);
            return [];
        }
    },

    parseRunningMarkdown(md) {
        const lines = md.split('\n');
        const rawData = [];
        
        const extractDate = (str) => {
            const match = str.match(/\[(\d{4}-\d{2}-\d{2})\]/);
            return match ? match[1] : '--';
        };

        lines.forEach(line => {
            if (!line.startsWith('|')) return;
            const cols = line.split('|').map(c => c.trim()).filter(c => c);
            if (cols.length < 5 || cols[0].includes('---') || cols[0] === 'Distance') return;

            const distLabel = cols[0];
            const distLower = distLabel.toLowerCase();
            let xVal = 0;

            // 1. Try to match with EXACT Key Distances first
            const keyMatch = KEY_DISTANCES.find(k => k.keys.some(key => distLower.includes(key.toLowerCase())));
            
            if (keyMatch) {
                xVal = keyMatch.val;
            } else {
                // 2. Fallback parsing
                let dist = parseFloat(distLabel); 
                if (distLabel.includes('k')) xVal = dist * 0.621371; 
                else if (distLabel.includes('m') && !distLabel.includes('mi')) xVal = dist / 1609.34; 
                else xVal = dist; // Assume miles
            }

            const parseTime = (t) => {
                if (!t || t === '--') return null;
                t = t.replace(/\*\*/g, '');
                const parts = t.split(':');
                if (parts.length === 3) return (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]);
                if (parts.length === 2) return (+parts[0])*60 + (+parts[1]);
                return parseFloat(t); 
            };

            const yAll = parseTime(cols[1]);
            const y6w = parseTime(cols[3]);

            if (xVal > 0) {
                rawData.push({
                    label: cols[0],
                    x: xVal,
                    yAll: yAll,
                    y6w: y6w,
                    dateAll: extractDate(cols[2]),
                    date6w: extractDate(cols[4])
                });
            }
        });
        
        // --- FIX: Aggressive Deduplication ---
        // Group by distance rounded to 1 decimal place (1.0 vs 0.99 -> 1.0)
        const uniqueData = {};
        rawData.forEach(pt => {
            const key = pt.x.toFixed(1); 
            if (!uniqueData[key]) {
                uniqueData[key] = pt;
            } else {
                // Keep the faster (smaller) time
                if (pt.yAll && pt.yAll < uniqueData[key].yAll) {
                    uniqueData[key] = pt;
                }
            }
        });

        return Object.values(uniqueData).sort((a,b) => a.x - b.x);
    }
};

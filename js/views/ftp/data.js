import { DataManager } from '../../utils/data.js';

export const FTPData = {
    async fetchCycling() {
        try {
            const data = await DataManager.fetchJSON('power_curve_graph.json');
            // Check if we got data, otherwise try fetching raw file
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
            const data = await DataManager.fetchJSON('my_garmin_data_ALL.json');
             if (!data) {
                const res = await fetch('data/my_garmin_data_ALL.json');
                if (res.ok) return await res.json();
            }
            return data || [];
        } catch(e) {
            console.warn("History fetch failed", e);
            return [];
        }
    },

    parseRunningMarkdown(md) {
        const lines = md.split('\n');
        const data = [];
        
        // Regex to extract date from [2026-01-01](url)
        const extractDate = (str) => {
            const match = str.match(/\[(\d{4}-\d{2}-\d{2})\]/);
            return match ? match[1] : '--';
        };

        lines.forEach(line => {
            if (!line.startsWith('|')) return;
            const cols = line.split('|').map(c => c.trim()).filter(c => c);
            if (cols.length < 5 || cols[0].includes('---') || cols[0] === 'Distance') return;

            // cols[0]: Distance, cols[1]: AllTime, cols[2]: DateAll, cols[3]: 6Week, cols[4]: Date6w
            
            // Parse Distance
            let dist = parseFloat(cols[0]); // e.g. "400" from "400m" or "1" from "1mi"
            let xVal = 0;
            
            if (cols[0].includes('k')) xVal = dist * 0.621371; // km to miles
            else if (cols[0].includes('mi') || cols[0] === 'Half' || cols[0] === 'Full') {
                if (cols[0] === 'Half') xVal = 13.1;
                else if (cols[0] === 'Full') xVal = 26.2;
                else xVal = dist;
            }
            else if (cols[0].includes('m')) xVal = dist / 1609.34; // meters to miles

            // Parse Time to Seconds (for y-axis sorting/plotting if needed, but here we plot pace/time as value)
            const parseTime = (t) => {
                if (!t || t === '--') return null;
                t = t.replace(/\*\*/g, ''); // Remove bold
                const parts = t.split(':');
                if (parts.length === 3) return (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]);
                if (parts.length === 2) return (+parts[0])*60 + (+parts[1]);
                return parseFloat(t); // raw seconds if any
            };

            const yAll = parseTime(cols[1]);
            const y6w = parseTime(cols[3]);

            if (xVal > 0) {
                data.push({
                    label: cols[0],
                    x: xVal,
                    yAll: yAll, // raw seconds
                    y6w: y6w,   // raw seconds
                    dateAll: extractDate(cols[2]),
                    date6w: extractDate(cols[4])
                });
            }
        });
        
        return data.sort((a,b) => a.x - b.x);
    }
};

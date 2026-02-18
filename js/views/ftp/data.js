import { DataManager } from '../../utils/data.js';

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
            // FIX: Pointing to exact file path to ensure charts load
            const res = await fetch('garmin_data/garmin_health.json');
            if (res.ok) return await res.json();
            return [];
        } catch(e) {
            console.warn("History fetch failed", e);
            return [];
        }
    },

    parseRunningMarkdown(md) {
        const lines = md.split('\n');
        const data = [];
        
        const extractDate = (str) => {
            const match = str.match(/\[(\d{4}-\d{2}-\d{2})\]/);
            return match ? match[1] : '--';
        };

        lines.forEach(line => {
            if (!line.startsWith('|')) return;
            const cols = line.split('|').map(c => c.trim()).filter(c => c);
            if (cols.length < 5 || cols[0].includes('---') || cols[0] === 'Distance') return;

            let dist = parseFloat(cols[0]); 
            let xVal = 0;
            
            if (cols[0].includes('k')) xVal = dist * 0.621371; 
            else if (cols[0].includes('mi') || cols[0] === 'Half' || cols[0] === 'Full') {
                if (cols[0] === 'Half') xVal = 13.1;
                else if (cols[0] === 'Full') xVal = 26.2;
                else xVal = dist;
            }
            else if (cols[0].includes('m')) xVal = dist / 1609.34; 

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
                data.push({
                    label: cols[0],
                    x: xVal,
                    yAll: yAll,
                    y6w: y6w,
                    dateAll: extractDate(cols[2]),
                    date6w: extractDate(cols[4])
                });
            }
        });
        
        return data.sort((a,b) => a.x - b.x);
    }
};

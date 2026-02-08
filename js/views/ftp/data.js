// js/views/ftp/data.js

export const FTPData = {
    async fetchCycling() {
        try {
            const res = await fetch('strava_data/cycling/power_curve_graph.json');
            return res.ok ? await res.json() : [];
        } catch (e) { return []; }
    },

    async fetchRunning() {
        try {
            const res = await fetch('strava_data/running/my_running_prs.md');
            if (!res.ok) return [];
            const text = await res.text();
            return this.parseRunningMarkdown(text);
        } catch (e) { return []; }
    },

    async fetchGarminHistory() {
        try {
            const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
            const res = await fetch(url);
            if (!res.ok) throw new Error("GitHub fetch failed");
            return await res.json();
        } catch (e) { 
            console.error("Garmin Data Error:", e); 
            return []; 
        }
    },

    parseRunningMarkdown(md) {
        const rows = [];
        const distMap = { 
            '400m': 0.248, '1/2 mile': 0.5, '1 mile': 1.0, '2 mile': 2.0, 
            '5k': 3.106, '10k': 6.213, '15k': 9.32, '10 mile': 10.0, 
            '20k': 12.42, 'Half-Marathon': 13.109, '30k': 18.64, 'Marathon': 26.218, '50k': 31.06
        };

        md.split('\n').forEach(line => {
            const cols = line.split('|').map(c => c.trim());
            if (cols.length >= 6 && !line.includes('---') && cols[1] !== 'Distance') {
                const label = cols[1];
                const distKey = Object.keys(distMap).find(k => label.toLowerCase().includes(k.toLowerCase())) || label;
                const dist = distMap[distKey];
                if (dist) {
                    const parseTime = (str) => {
                        if (!str || str === '--') return null;
                        const parts = str.replace(/\*\*/g, '').split(':').map(Number);
                        return parts.length === 3 ? parts[0]*3600 + parts[1]*60 + parts[2] : parts[0]*60 + parts[1];
                    };
                    const timeAll = parseTime(cols[2]);
                    const time6w = parseTime(cols[4]);
                    const paceAll = timeAll ? (timeAll / 60) / dist : null;
                    const pace6w = time6w ? (time6w / 60) / dist : null;
                    if (paceAll) rows.push({ label: distKey, x: dist, yAll: paceAll, y6w: pace6w });
                }
            }
        });
        return rows.sort((a,b) => a.x - b.x);
    }
};

// js/views/ftp/index.js

// --- 1. CONFIG & UTILS ---

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = { '--color-bike': '#c084fc', '--color-run': '#f472b6' };
    return defaults[varName] || '#888888';
};

const formatPace = (val) => {
    if (!val) return '--';
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatPaceSeconds = (val) => {
    if (!val) return '';
    const m = Math.floor(val / 60);
    const s = Math.round(val % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- 2. DATA FETCHERS ---

const fetchCyclingData = async () => {
    try {
        const res = await fetch('strava_data/cycling/power_curve_graph.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { return []; }
};

const fetchRunningData = async () => {
    try {
        const res = await fetch('strava_data/running/my_running_prs.md');
        if (!res.ok) return [];
        const text = await res.text();
        return parseRunningMarkdown(text);
    } catch (e) { return []; }
};

const fetchGarminHealth = async () => {
    try {
        const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
        const res = await fetch(url);
        if (!res.ok) throw new Error("GitHub Raw fetch failed");
        return await res.json();
    } catch (e) { console.error("Garmin Fetch Error:", e); return []; }
};

const parseRunningMarkdown = (md) => {
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
                    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
                    if (parts.length === 2) return parts[0]*60 + parts[1];
                    return null;
                };
                const timeAllTime = parseTime(cols[2]);
                const time6Week = parseTime(cols[4]);
                const paceAllTime = timeAllTime ? (timeAllTime / 60) / dist : null;
                const pace6Week = time6Week ? (time6Week / 60) / dist : null;
                if (paceAllTime) rows.push({ label: distKey, x: dist, yAll: paceAllTime, y6w: pace6Week });
            }
        }
    });
    return rows.sort((a,b) => a.x - b.x);
};

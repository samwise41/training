// js/views/trends/analysis.js

export const getRollingPoints = (data, typeFilter, isCount, timeRange) => {
    const points = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let weeksBack = 26; 
    if (timeRange === '30d') weeksBack = 4;
    else if (timeRange === '60d') weeksBack = 8;
    else if (timeRange === '90d') weeksBack = 13;
    else if (timeRange === '1y') weeksBack = 52; 

    for (let i = weeksBack; i >= 0; i--) {
        const anchorDate = new Date(today);
        anchorDate.setDate(today.getDate() - (i * 7)); 
        
        const getStats = (days) => {
            const startWindow = new Date(anchorDate);
            startWindow.setDate(anchorDate.getDate() - days);
            let plan = 0; let act = 0;
            data.forEach(d => {
                if (d.date >= startWindow && d.date <= anchorDate) {
                    if (typeFilter !== 'All' && d.type !== typeFilter) return;
                    if (isCount) {
                        if (d.plannedDuration > 0 || d.type === 'Rest') { plan++; if (d.completed) act++; }
                    } else {
                        plan += (d.plannedDuration || 0); act += (d.actualDuration || 0);
                    }
                }
            });
            return plan > 0 ? Math.min(Math.round((act / plan) * 100), 300) : 0; 
        };
        points.push({ 
            label: `${anchorDate.getMonth()+1}/${anchorDate.getDate()}`, 
            val7: getStats(7),
            val30: getStats(30), 
            val60: getStats(60) 
        });
    }
    return points;
};

export const parsePlanLimits = (md, sportType) => {
    const getCap = (keyword) => {
        const regex = new RegExp(`\\*\\*${keyword} Cap:\\*\\*\\s*\\[(\\d+)%\\]`, 'i');
        const match = md.match(regex);
        return match ? parseInt(match[1], 10) / 100 : null;
    };
    const defaults = { 'Run': 0.10, 'Bike': 0.20, 'Swim': 0.20, 'All': 0.15 };
    const limitRed = getCap(sportType) !== null ? getCap(sportType) : (defaults[sportType] || 0.15);
    const limitYellow = Math.max(0, limitRed - 0.05);
    return { limitRed, limitYellow };
};

export const aggregateVolumeBuckets = (data, sportType) => {
    const buckets = []; 
    const now = new Date(); 
    const day = now.getDay(); 
    const distToSat = 6 - day; 
    const endOfCurrentWeek = new Date(now); 
    endOfCurrentWeek.setDate(now.getDate() + distToSat); 
    endOfCurrentWeek.setHours(23, 59, 59, 999);

    for (let i = 11; i >= 0; i--) {
        const end = new Date(endOfCurrentWeek); 
        end.setDate(end.getDate() - (i * 7)); 
        const start = new Date(end); 
        start.setDate(start.getDate() - 6); 
        start.setHours(0,0,0,0);
        buckets.push({ start, end, label: `${end.getMonth()+1}/${end.getDate()}`, actualMins: 0, plannedMins: 0 });
    }

    data.forEach(item => {
        if (!item.date) return; 
        const t = item.date.getTime(); 
        const bucket = buckets.find(b => t >= b.start.getTime() && t <= b.end.getTime());
        
        if (bucket) { 
            if (sportType === 'All' || item.type === sportType) {
                bucket.plannedMins += (item.plannedDuration || 0); 
            }
            const executedType = item.actualType || item.type;
            if (sportType === 'All' || executedType === sportType) {
                bucket.actualMins += (item.actualDuration || 0);
            }
        }
    });
    return buckets;
};

export const calculateStats = (data, targetType, days, isDuration) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const now = new Date(); now.setHours(23, 59, 59, 999);
    
    const subset = data.filter(item => { 
        if (!item || !item.date) return false; 
        return item.date >= cutoff && item.date <= now && (targetType === 'All' || item.type === targetType); 
    });

    let val = 0, target = 0;
    subset.forEach(item => { 
        if (isDuration) { 
            target += (item.plannedDuration || 0); 
            if (item.type === item.actualType) val += (item.actualDuration || 0); 
        } else { 
            target++; 
            if (item.completed) val++; 
        } 
    });
    const pct = target > 0 ? Math.round((val / target) * 100) : 0;
    const label = isDuration 
        ? `${val > 120 ? (val/60).toFixed(1)+'h' : val+'m'}/${target > 120 ? (target/60).toFixed(1)+'h' : target+'m'}` 
        : `${val}/${target}`;
    return { pct, label };
};

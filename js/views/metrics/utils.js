// js/views/metrics/utils.js
// Removed unused import

export const checkSport = (activity, sportKey) => {
    // STRICT RULE: ONLY USE 'actualSport' FIELD
    const sport = String(activity.actualSport || "").toUpperCase().trim();
    const target = sportKey.toUpperCase();

    if (target === 'BIKE') {
        return sport.includes('BIKE') || sport.includes('CYCLING');
    }
    
    if (target === 'RUN') {
        return sport.includes('RUN');
    }
    
    if (target === 'SWIM') {
        return sport.includes('SWIM') || sport.includes('POOL');
    }
    
    return false;
};

export const calculateTrend = (dataPoints) => {
    const n = dataPoints.length;
    if (n < 3) return null;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) { sumX += i; sumY += dataPoints[i].val; sumXY += i * dataPoints[i].val; sumXX += i * i; }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, startVal: intercept, endVal: intercept + slope * (n - 1) };
};

export const getTrendIcon = (slope, invert) => {
    if (Math.abs(slope) < 0.001) return { icon: 'fa-arrow-right', color: 'text-slate-500' };
    const isUp = slope > 0;
    const isGood = invert ? !isUp : isUp;
    return { icon: isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', color: isGood ? 'text-emerald-400' : 'text-red-400' };
};

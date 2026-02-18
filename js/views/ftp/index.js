import { FTPData } from './data.js';
import { FTPCharts } from './charts.js';
import { FTPTemplates } from './templates.js';

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    return '';
};

export function renderFTP(profileData) {
    const bio = profileData || { wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    const ts = Date.now();
    
    window.ftpChartIds = {
        cycleCurve: `curve-bike-${ts}`,
        runCurve: `curve-run-${ts}`,
        bikeHist: `hist-bike-${ts}`,
        runHist: `hist-run-${ts}`
    };

    const components = {
        gauge: FTPTemplates.gauge(bio.wkg, bio.gauge_percent, bio.category),
        bikeStats: FTPTemplates.cyclingStats(bio),
        runStats: FTPTemplates.runningStats(bio)
    };

    return FTPTemplates.layout(window.ftpChartIds, components);
}

export async function initCharts() {
    const ids = window.ftpChartIds;
    if (!ids) return;

    const bikeColor = getColor('--color-bike');
    const runColor = getColor('--color-run');

    // 1. Power Curves (SVG)
    FTPData.fetchCycling().then(data => {
        const el = document.getElementById(ids.cycleCurve);
        if (el && data.length) {
            // FIX: Map correct date fields from JSON
            // at_date = All Time Date, sw_date = Six Week Date
            const pts = data.map(d => ({ 
                x: d.seconds, 
                yAll: d.all_time_watts, 
                y6w: d.six_week_watts,
                dateAll: d.at_date, 
                date6w: d.sw_date
            })).filter(d => d.x >= 1);
            
            el.innerHTML = FTPCharts.renderSvgCurve(pts, { 
                containerId: ids.cycleCurve,
                width: 600, height: 250, xType: 'time', 
                colorAll: bikeColor, color6w: bikeColor, 
                showPoints: false 
            });
            FTPCharts.setupSvgInteractions(ids.cycleCurve, pts, { width: 600, xType: 'time', colorAll: bikeColor, color6w: bikeColor });
        }
    });

    FTPData.fetchRunning().then(data => {
        const el = document.getElementById(ids.runCurve);
        if (el && data.length) {
            // Data is already parsed with dateAll/date6w in data.js
            el.innerHTML = FTPCharts.renderSvgCurve(data, { 
                containerId: ids.runCurve,
                width: 600, height: 250, xType: 'distance', 
                colorAll: runColor, color6w: runColor, 
                showPoints: true 
            });
            FTPCharts.setupSvgInteractions(ids.runCurve, data, { width: 600, xType: 'distance', colorAll: runColor, color6w: runColor });
        }
    });

    // 2. History Charts (Chart.js)
    const history = await FTPData.fetchGarminHistory();
    if (history.length) {
        const sorted = history.sort((a,b) => new Date(a["Date"]) - new Date(b["Date"]));
        
        const bikeData = sorted
            .filter(d => d["FTP"] > 0 && d["Weight (lbs)"] > 0)
            .map(d => ({
                date: d["Date"].slice(5),
                ftp: d["FTP"],
                wkg: parseFloat((d["FTP"] / (d["Weight (lbs)"] / 2.20462)).toFixed(2))
            }));

        const runData = sorted
            .filter(d => d["Run FTP Pace"] || d["Lactate Threshold HR"])
            .map(d => {
                let sec = null;
                if (d["Run FTP Pace"] && d["Run FTP Pace"].includes(':')) {
                    const [m, s] = d["Run FTP Pace"].split(':').map(Number);
                    sec = (m * 60) + s;
                }
                return {
                    date: d["Date"].slice(5),
                    pace: sec,
                    lthr: d["Lactate Threshold HR"] || null
                };
            });

        FTPCharts.renderBikeHistory(ids.bikeHist, bikeData, bikeColor);
        FTPCharts.renderRunHistory(ids.runHist, runData, runColor);
    }
}

// ... existing imports ...

export async function initCharts() {
    const ids = window.ftpChartIds;
    if (!ids) return;

    const bikeColor = getColor('--color-bike');
    const runColor = getColor('--color-run');

    // ... SVG Rendering Logic remains same as proposed in Approach ...

    // 2. History Charts (Chart.js)
    const history = await FTPData.fetchGarminHistory();
    if (history.length) {
        // Sort and map data, ensuring we keep enough of the date to be useful
        const sorted = history.sort((a,b) => new Date(a["Date"]) - new Date(b["Date"]));
        
        const bikeData = sorted
            .filter(d => d["FTP"] > 0)
            .map(d => ({
                date: d["Date"], // Keep full date for better Chart.js labels
                ftp: d["FTP"],
                wkg: d["Weight (lbs)"] > 0 ? parseFloat((d["FTP"] / (d["Weight (lbs)"] / 2.20462)).toFixed(2)) : 0
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
                    date: d["Date"],
                    pace: sec,
                    lthr: d["Lactate Threshold HR"] || null
                };
            });

        FTPCharts.renderBikeHistory(ids.bikeHist, bikeData, bikeColor);
        FTPCharts.renderRunHistory(ids.runHist, runData, runColor);
    }
}

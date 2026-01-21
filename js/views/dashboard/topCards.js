// js/views/dashboard/topCards.js

// --- Local Helpers (to avoid import errors) ---
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    // Create date in local time (Year, MonthIndex, Day)
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysDiff(d1, d2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((d2 - d1) / oneDay);
}

export function renderTopCards() {
    // 1. Access Data from Global State (Synchronously)
    const planMd = window.App?.planMd || '';
    const trendsData = window.App?.trendsData || null;

    // 2. Parse Plan for Next Event
    let currentPhase = 'Unknown';
    let nextEvent = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (planMd) {
        const lines = planMd.split('\n');
        for (const line of lines) {
            // Parse Phase
            const phaseMatch = line.match(/^##\s+(.+)/);
            if (phaseMatch) {
                currentPhase = phaseMatch[1].trim();
            }

            // Parse Event (- YYYY-MM-DD: Name)
            const eventMatch = line.match(/^-\s+(\d{4}-\d{2}-\d{2}):\s+(.+)/);
            if (eventMatch) {
                const eventDate = parseDate(eventMatch[1]);
                // We want the first event that is today or in the future
                if (eventDate && eventDate >= today && !nextEvent) {
                    nextEvent = {
                        date: eventMatch[1],
                        name: eventMatch[2],
                        daysToGo: getDaysDiff(today, eventDate)
                    };
                }
            }
        }
    }

    // 3. Readiness / Performance Logic
    // We pull from Trends Data to find the lowest performing discipline vs Plan
    let readinessHtml = '<span class="text-gray-500 text-xs">No Data</span>';

    if (trendsData && trendsData.data && trendsData.data.length > 0) {
        // Get the most recent week of data
        const lastWeek = trendsData.data[trendsData.data.length - 1];
        const cats = lastWeek.categories;

        if (cats) {
            const sports = [
                { name: 'Swim', val: cats.swimming?.actual_growth || 0 },
                { name: 'Bike', val: cats.cycling?.actual_growth || 0 },
                { name: 'Run',  val: cats.running?.actual_growth || 0 }
            ];

            // Find lowest performing discipline
            const lowest = sports.reduce((prev, curr) => prev.val < curr.val ? prev : curr);

            // Format for display
            const pct = Math.round(lowest.val * 100);
            
            // Color Logic: Negative/Low is Red (Warning), Positive is Green
            let colorClass = 'text-green-400';
            let icon = '📈';
            
            if (pct < -10) {
                colorClass = 'text-red-400';
                icon = '📉';
            } else if (pct < 0) {
                colorClass = 'text-orange-400';
                icon = '📉';
            }

            readinessHtml = `
                <div class="mt-2 text-sm font-medium ${colorClass} flex items-center gap-1">
                    <span>${icon}</span>
                    <span>${lowest.name}: ${pct > 0 ? '+' : ''}${pct}% (vs Plan)</span>
                </div>
            `;
        }
    }

    // 4. Return HTML String (Synchronous)
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                <h3 class="text-gray-400 text-xs uppercase font-bold mb-1">Current Phase</h3>
                <p class="text-2xl font-bold text-white">${currentPhase}</p>
                <div class="mt-2 text-xs text-blue-400">
                    Focus: Base Building
                </div>
            </div>

            <div class="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                <h3 class="text-gray-400 text-xs uppercase font-bold mb-1">Next Priority Event</h3>
                ${nextEvent ? `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xl font-bold text-white truncate max-w-[200px]" title="${nextEvent.name}">${nextEvent.name}</p>
                            <p class="text-sm text-gray-400">${formatDate(nextEvent.date)}</p>
                            ${readinessHtml}
                        </div>
                        <div class="text-right">
                            <span class="text-3xl font-bold text-blue-500">${nextEvent.daysToGo}</span>
                            <p class="text-xs text-gray-500 uppercase">Days Out</p>
                        </div>
                    </div>
                ` : `
                    <p class="text-gray-500 mt-2">No upcoming events planned.</p>
                `}
            </div>
        </div>
    `;
}

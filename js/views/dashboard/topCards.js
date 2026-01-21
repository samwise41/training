import { getFileContent, formatDate, parseDate, getDaysDiff } from './utils.js';

export async function renderTopCards() {
    const container = document.getElementById('top-cards-container');
    
    try {
        // 1. Load both the Plan Markdown and the Readiness JSON
        const [planMd, readinessRes] = await Promise.all([
            getFileContent('endurance_plan.md'),
            fetch('data/readiness/readiness.json')
        ]);

        const readinessData = await readinessRes.json();

        // --- Parsing Plan Logic (Existing) ---
        const lines = planMd.split('\n');
        let currentPhase = 'Unknown';
        let nextEvent = null;
        const today = new Date();

        for (const line of lines) {
            // Parse Phase (## Phase: Name)
            const phaseMatch = line.match(/^##\s+(.+)/);
            if (phaseMatch) {
                currentPhase = phaseMatch[1];
            }

            // Parse Event (- Date: Name)
            const eventMatch = line.match(/^-\s+(\d{4}-\d{2}-\d{2}):\s+(.+)/);
            if (eventMatch) {
                const eventDate = parseDate(eventMatch[1]);
                if (eventDate >= today && !nextEvent) {
                    nextEvent = {
                        date: eventMatch[1],
                        name: eventMatch[2],
                        daysToGo: getDaysDiff(today, eventDate)
                    };
                }
            }
        }

        // --- NEW LOGIC: Calculate Readiness Status ---
        // Get the latest entry (assuming array is sorted by date, or just take the last one)
        // If your JSON has specific dates, you might want to find(d => d.date === todayString)
        const latestReadiness = readinessData[readinessData.length - 1]; 
        
        let readinessHtml = '<span class="text-gray-500 text-xs">No Data</span>';
        
        if (latestReadiness) {
            // Extract Form/TSB values. Adjust keys 'swim', 'bike', 'run' if your JSON uses different names.
            // Assuming structure is like: { swim: { form: 10 }, bike: { form: -5 }, ... } 
            // OR flat: { swimForm: 10, bikeForm: -5 ... }
            // Adaptation: Detecting structure based on common patterns
            
            const sports = [
                { name: 'Swim', val: latestReadiness.swim?.form ?? latestReadiness.swimForm ?? 0 },
                { name: 'Bike', val: latestReadiness.bike?.form ?? latestReadiness.bikeForm ?? 0 },
                { name: 'Run', val: latestReadiness.run?.form ?? latestReadiness.runForm ?? 0 }
            ];

            // Find lowest performing discipline
            const lowest = sports.reduce((prev, curr) => prev.val < curr.val ? prev : curr);
            
            // Color logic: Negative is typically Red (fatigue), Positive is Green (freshness)
            // Or usually TSB < -10 is Red, -10 to +10 Green/Grey.
            // Adjusting to standard TSB coloring: Very negative = Red.
            const colorClass = lowest.val < -20 ? 'text-red-500' : (lowest.val < -10 ? 'text-orange-400' : 'text-green-400');
            const icon = lowest.val < 0 ? '📉' : '📈';

            readinessHtml = `<div class="mt-1 text-sm font-medium ${colorClass}">
                ${icon} ${lowest.name}: ${lowest.val}
            </div>`;
        }

        // --- Render HTML ---
        container.innerHTML = `
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
                                <p class="text-xl font-bold text-white truncate">${nextEvent.name}</p>
                                <p class="text-sm text-gray-400">${formatDate(nextEvent.date)}</p>
                                ${readinessHtml} </div>
                            <div class="text-right">
                                <span class="text-3xl font-bold text-blue-500">${nextEvent.daysToGo}</span>
                                <p class="text-xs text-gray-500 uppercase">Days Out</p>
                            </div>
                        </div>
                    ` : `
                        <p class="text-gray-500">No upcoming events planned.</p>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error rendering top cards:', error);
        container.innerHTML = `<p class="text-red-500">Failed to load dashboard data.</p>`;
    }
}

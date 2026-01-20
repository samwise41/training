// js/views/zones/index.js

export async function renderZonesTab() {
    const containerId = 'zones-tab-content';
    
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Add a timestamp to the URL to bypass the browser cache
            const cacheBuster = new Date().getTime();
            const response = await fetch(`data/zones/zones.json?t=${cacheBuster}`);
            
            if (!response.ok) throw new Error("Zones JSON file not found");
            
            const data = await response.json();

            // Verification logging
            console.log("Zones Data Loaded:", data);

            const hasCycling = data.cycling?.zones?.length > 0;
            const hasRunning = data.running?.zones?.length > 0;

            if (!hasCycling && !hasRunning) {
                container.innerHTML = `<div class="p-12 text-center text-slate-500 italic">Zones found but empty.</div>`;
                return;
            }

            container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
                    ${hasCycling ? renderZoneCard("Cycling Power Zones", data.cycling, "text-purple-400") : ''}
                    ${hasRunning ? renderZoneCard("Running HR Zones", data.running, "text-pink-400") : ''}
                </div>
            `;
        } catch (err) {
            console.error("Zones Load Error:", err);
            container.innerHTML = `<div class="p-12 text-center text-slate-500 italic">Unable to load zones.json</div>`;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[400px]"></div>`;
}

// ... renderZoneCard remains the same ...

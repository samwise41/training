export function renderTopCards() {
    const containerId = 'top-cards-container';

    // Initiate the fetch for pre-calculated event and phase data
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch('data/dashboard/top_cards.json');
            if (!response.ok) throw new Error("Top cards data not found");
            const data = await response.json();

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Training Status</span>
                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-layer-group text-2xl text-blue-400 mt-1"></i>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold text-white leading-tight">${data.phase}</span>
                                <span class="text-sm font-medium text-slate-400 mt-0.5">${data.block}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Next Priority Event</span>
                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-flag-checkered text-2xl text-emerald-400 mt-1"></i>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold text-white leading-tight">${data.next_event}</span>
                                <span class="text-xs text-slate-400 font-mono mt-1">${data.days_to_go} days to go</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Top Cards Error:", err);
            container.innerHTML = `<p class="text-slate-500 italic p-4 text-center">Event data temporarily unavailable.</p>`;
        }
    }, 50);

    // Initial loading state
    return `<div id="${containerId}" class="min-h-[100px] bg-slate-800/10 animate-pulse rounded-xl mb-6"></div>`;
}

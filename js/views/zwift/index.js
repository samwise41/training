// js/views/zwift/index.js

export const ZwiftFinder = {
    events: [],
    myScore: 408, // Your specific ZRS Score

    async init() {
        const container = document.createElement('div');
        container.className = "flex flex-col h-full";
        
        container.innerHTML = `
            <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-vr-cardboard text-orange-500"></i> Event Finder
                    </h2>
                    <p class="text-slate-400 text-sm">Targeting ZRS Category for Score: <span class="text-orange-400 font-bold">${this.myScore}</span></p>
                </div>
                
                <div class="flex flex-wrap gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <select id="zf-type" class="bg-slate-900 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-blue-500">
                        <option value="ALL">All Types</option>
                        <option value="RACE">Race</option>
                        <option value="GROUP_RIDE">Group Ride</option>
                        <option value="WORKOUT">Workout</option>
                    </select>
                    
                    <select id="zf-time" class="bg-slate-900 border border-slate-600 text-white text-sm rounded px-3 py-1.5 outline-none focus:border-blue-500">
                        <option value="ALL">All Times</option>
                        <option value="MORNING">Morning (5a - 12p)</option>
                        <option value="AFTERNOON">Afternoon (12p - 5p)</option>
                        <option value="EVENING">Evening (5p - 9p)</option>
                    </select>

                    <div class="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded px-3 py-1.5">
                        <label for="zf-dist" class="text-slate-400 text-sm"><i class="fa-solid fa-ruler-horizontal"></i> Min</label>
                        <input type="number" id="zf-dist" placeholder="mi" class="bg-transparent text-white text-sm outline-none w-12 text-center" min="0" value="0">
                    </div>
                </div>
            </div>

            <div id="zf-grid" class="flex gap-4 overflow-x-auto pb-4 flex-1 items-start snap-x">
                <div class="text-slate-400 w-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-2xl"></i> Loading Events...</div>
            </div>
        `;

        // Wait a tick for the DOM to append, then attach listeners and fetch
        setTimeout(() => {
            this.attachListeners();
            this.fetchEvents();
        }, 0);

        return container.outerHTML;
    },

    attachListeners() {
        ['zf-type', 'zf-time', 'zf-dist'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.renderGrid());
            if (el && id === 'zf-dist') el.addEventListener('keyup', () => this.renderGrid());
        });
    },

    async fetchEvents() {
        try {
            // Add cachebuster to bypass GitHub Pages caching
            const res = await fetch(`events.json?t=${Date.now()}`); 
            this.events = await res.json();
            this.renderGrid();
        } catch (e) {
            document.getElementById('zf-grid').innerHTML = `<div class="text-red-500 w-full p-4 bg-red-900/20 border border-red-800 rounded">Failed to load events.json</div>`;
        }
    },

    getUserCategory(categories) {
        // Hunts for the exact pen that fits your score (408)
        let fallbackCat = null;
        let fallbackLetter = 'E'; // Default to E if no score fits

        for (const [letter, data] of Object.entries(categories)) {
            // Track standard groups in case it's not a ZRS event
            if (letter === 'C') { fallbackCat = data; fallbackLetter = 'C'; }
            if (!fallbackCat) { fallbackCat = data; fallbackLetter = letter; }

            // If it IS a ZRS event, check the boundaries
            if (data.score_min !== null && data.score_max !== null) {
                if (this.myScore >= data.score_min && this.myScore <= data.score_max) {
                    return { letter, data }; // We found the exact ZRS match!
                }
            }
        }
        // Return a fallback if it's a standard event
        return { letter: fallbackLetter, data: fallbackCat };
    },

    renderGrid() {
        const grid = document.getElementById('zf-grid');
        if (!grid) return;

        const filterType = document.getElementById('zf-type').value;
        const filterTime = document.getElementById('zf-time').value;
        const filterDist = parseFloat(document.getElementById('zf-dist').value) || 0;

        // 1. Setup the Next 7 Days Columns
        const days = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            days.push({
                dateObj: d,
                idStr: d.toDateString(),
                title: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${dayName}, ${dateStr}`,
                events: []
            });
        }

        // 2. Filter and Group Events
        this.events.forEach(ev => {
            // Convert UTC to local browser time
            const localDate = new Date(ev.start_time_utc);
            const eventDateStr = localDate.toDateString();
            
            // Find the column it belongs to
            const targetDay = days.find(d => d.idStr === eventDateStr);
            if (!targetDay) return; // Skips events outside our 7-day window

            // Type Filter
            if (filterType !== 'ALL' && ev.type !== filterType) return;

            // Time Filter
            const hour = localDate.getHours();
            if (filterTime === 'MORNING' && (hour < 5 || hour >= 12)) return;
            if (filterTime === 'AFTERNOON' && (hour < 12 || hour >= 17)) return;
            if (filterTime === 'EVENING' && (hour < 17 || hour >= 21)) return;

            // Grab the user's specific category details
            const myCat = this.getUserCategory(ev.categories);
            if (!myCat.data) return;

            // Distance Filter (Convert km to miles)
            const myDistMiles = Math.round(myCat.data.distance_km * 0.621371 * 10) / 10;
            if (filterDist > 0 && myDistMiles < filterDist && myCat.data.laps === 0) return; 

            // Add the parsed event to the day's column
            targetDay.events.push({
                ...ev,
                localDate,
                myCatLetter: myCat.letter,
                myCatData: myCat.data,
                myDistMiles
            });
        });

        // 3. Build the HTML Grid
        let html = '';
        days.forEach(day => {
            // Sort events in the column chronologically
            day.events.sort((a, b) => a.localDate - b.localDate);

            html += `
                <div class="flex flex-col min-w-[300px] w-[300px] bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden snap-start h-full">
                    <div class="bg-slate-800 text-center py-2 border-b border-slate-700 sticky top-0 z-10">
                        <h3 class="font-bold text-white tracking-wide">${day.title}</h3>
                        <span class="text-xs text-slate-400">${day.events.length} Events</span>
                    </div>
                    <div class="p-3 flex flex-col gap-3 overflow-y-auto" style="max-height: calc(100vh - 250px);">
            `;

            if (day.events.length === 0) {
                html += `<div class="text-center text-slate-500 text-sm py-10 italic">No matching events</div>`;
            }

            day.events.forEach(ev => {
                const timeStr = ev.localDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                // Formulate the distance or lap text
                let distText = '';
                if (ev.myCatData.distance_km > 0) {
                    distText = `${ev.myDistMiles} mi`;
                } else if (ev.myCatData.laps > 0) {
                    distText = `${ev.myCatData.laps} Laps`;
                } else {
                    distText = `${ev.max_duration_minutes} min`;
                }

                // Identify if it's a Racing Score group
                const scoreLabel = ev.myCatData.raw_score_label ? `(${ev.myCatData.raw_score_label})` : '';
                const catColor = ev.myCatLetter === 'A' ? 'bg-red-500' : ev.myCatLetter === 'B' ? 'bg-green-500' : ev.myCatLetter === 'C' ? 'bg-blue-500' : 'bg-yellow-500';

                html += `
                    <div class="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors flex flex-col relative group">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-blue-400">${timeStr}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded uppercase tracking-wider">${ev.type}</span>
                        </div>
                        
                        <h4 class="font-bold text-white text-sm leading-snug mb-3">${ev.title}</h4>
                        
                        <div class="grid grid-cols-2 gap-y-2 gap-x-1 text-xs mb-3">
                            <div class="text-slate-400"><i class="fa-solid fa-route w-4"></i> ${ev.myCatData.route_name || 'Multiple Routes'}</div>
                            <div class="text-white font-bold text-right">${distText}</div>
                            
                            <div class="text-slate-400 col-span-2 flex items-center gap-1 mt-1">
                                <span class="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold text-white ${catColor}">${ev.myCatLetter}</span>
                                <span class="text-slate-300">Your Group ${scoreLabel}</span>
                            </div>
                        </div>

                        <a href="https://www.zwift.com/events/view/${ev.parent_event_id}" target="_blank" 
                           class="absolute inset-0 bg-orange-600/90 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-white">
                           <i class="fa-solid fa-arrow-up-right-from-square mr-2"></i> View on Zwift
                        </a>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        grid.innerHTML = html;
    }
};

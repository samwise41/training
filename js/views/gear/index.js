// js/views/gear/index.js
import { Formatters } from '../../utils/formatting.js';

// --- COMPONENTS ---

// 1. Hourly Weather Scroller (Kept from original)
const buildHourlyForecast = (hourlyWeather) => {
    if (!hourlyWeather || !hourlyWeather.time || !Array.isArray(hourlyWeather.time)) {
        return `<div class="mb-6 text-center text-xs text-slate-500 italic">Weather data not available</div>`;
    }

    const times = hourlyWeather.time.slice(0, 24); 
    const temps = hourlyWeather.temperature_2m;
    const codes = hourlyWeather.weathercode;
    
    let itemsHtml = '';
    times.forEach((t, index) => {
        const date = new Date(t);
        if (index < 24 && temps[index] !== undefined) { 
            const h = date.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hourLabel = h % 12 === 0 ? 12 : h % 12;
            const icon = Formatters.getWeatherInfo(codes[index])[1]; 
            
            itemsHtml += `
                <div class="hourly-item flex flex-col items-center min-w-[50px] p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span class="text-[10px] text-slate-400 font-bold mb-1">${hourLabel} ${ampm}</span>
                    <span class="text-xl mb-1">${icon}</span>
                    <span class="text-xs font-bold text-slate-200">${Math.round(temps[index])}°</span>
                </div>`;
        }
    });

    return `
        <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">24h Forecast</span>
            </div>
            <div class="hourly-scroll flex gap-2 overflow-x-auto pb-2 scrollbar-hide">${itemsHtml}</div>
        </div>`;
};

// 2. Temperature Selector
const buildTempOptions = (defaultVal) => {
    let tempOptions = `<option value="20">&lt; 25°F</option>`;
    for (let i = 25; i <= 85; i+=5) {
        tempOptions += `<option value="${i}" ${i === defaultVal ? 'selected' : ''}>${i}°F</option>`;
    }
    tempOptions += `<option value="90" ${defaultVal >= 90 ? 'selected' : ''}>90°F+</option>`;
    return tempOptions;
};

// 3. Body Part Card (The new Matrix Layout)
const renderBodyPartCard = (sport, partLabel, partId) => {
    const idPrefix = `${sport}-${partId}`; // e.g., 'bike-upper'
    
    return `
    <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden mb-4">
        <div class="bg-slate-900/40 px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${partLabel}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
            
            <div class="p-4 flex flex-col gap-1.5">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-sun text-yellow-500/80 text-xs"></i>
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Standard</span>
                </div>
                <p id="${idPrefix}-standard" class="text-sm text-slate-200 font-medium leading-snug">--</p>
            </div>

            <div class="p-4 flex flex-col gap-1.5 bg-blue-900/5">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-wind text-blue-400/80 text-xs"></i>
                    <span class="text-[9px] font-bold text-blue-400/60 uppercase tracking-wider">Wind / Rain</span>
                </div>
                <p id="${idPrefix}-windy" class="text-sm text-slate-200 font-medium leading-snug">--</p>
            </div>

            <div class="p-4 flex flex-col gap-1.5 bg-purple-900/5">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-moon text-purple-400/80 text-xs"></i>
                    <span class="text-[9px] font-bold text-purple-400/60 uppercase tracking-wider">Dark / Night</span>
                </div>
                <p id="${idPrefix}-dark" class="text-sm text-slate-200 font-medium leading-snug">--</p>
            </div>

        </div>
    </div>`;
};

// 4. Sport Section Wrapper
const renderSportSection = (sport, label) => {
    return `
    <div class="mb-10">
        <div class="flex items-center gap-3 mb-4 pl-1">
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                ${Formatters.getIconForSport(sport)}
            </div>
            <h3 class="text-lg font-bold text-white uppercase tracking-tight italic">${label} Gear</h3>
        </div>
        
        <div class="space-y-4">
            ${renderBodyPartCard(sport, 'Upper Body', 'upper')}
            ${renderBodyPartCard(sport, 'Lower Body', 'lower')}
            ${renderBodyPartCard(sport, 'Head, Hands & Feet', 'extremities')}
        </div>
    </div>`;
};


// --- LOGIC & UPDATES ---

function updateGearUI(gearData) {
    if (!gearData) return;
    
    const tempSelect = document.getElementById('gear-temp');
    if (!tempSelect) return;
    
    // Round to nearest 5 for cleaner lookup logic
    let inputTemp = parseInt(tempSelect.value);
    
    // Helper to find gear range in JSON
    const lookupGear = (list, t) => {
        if (!list) return { upper: "—", lower: "—", extremities: "—" };
        const match = list.find(r => {
            if (r.min === -999) return t < r.max;
            if (r.max === 999) return t >= r.min;
            return t >= r.min && t <= r.max;
        });
        return match || { upper: "Check Plan", lower: "Check Plan", extremities: "Check Plan" };
    };

    // Process a specific sport (bike/run)
    const updateSport = (sport) => {
        const list = gearData[sport] || [];
        
        // 1. Standard Conditions (Base Temp)
        const standard = lookupGear(list, inputTemp);
        
        // 2. Windy/Rainy (Base Temp - 10F + Shell Logic)
        const windyTemp = inputTemp - 10;
        const windy = lookupGear(list, windyTemp);
        
        // 3. Dark (Base Temp - 5F + Viz Logic)
        const darkTemp = inputTemp - 5;
        const dark = lookupGear(list, darkTemp);

        // Helper to update text content
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = val;
        };

        // --- Apply Standard ---
        setVal(`${sport}-upper-standard`, standard.upper);
        setVal(`${sport}-lower-standard`, standard.lower);
        setVal(`${sport}-extremities-standard`, standard.extremities);

        // --- Apply Windy (Add visual cues) ---
        // If the JSON text doesn't already say "Shell" or "Jacket", imply it needs outer layer due to wind
        let windyUpper = windy.upper;
        if (windyTemp < 60 && !windyUpper.toLowerCase().includes('jacket') && !windyUpper.toLowerCase().includes('shell')) {
            windyUpper += ` <span class="text-blue-400 font-bold">+ Shell</span>`;
        }
        setVal(`${sport}-upper-windy`, windyUpper);
        setVal(`${sport}-lower-windy`, windy.lower);
        setVal(`${sport}-extremities-windy`, windy.extremities);

        // --- Apply Dark (Add Viz) ---
        let darkUpper = dark.upper + ` <span class="text-purple-400 font-bold">+ Viz Vest</span>`;
        let darkExt = dark.extremities;
        
        // Add Headlamp/Lights based on sport
        if (sport === 'bike') {
            darkExt += ` <span class="text-purple-400 font-bold">+ Lights</span>`;
        } else {
            darkExt += ` <span class="text-purple-400 font-bold">+ Headlamp</span>`;
        }
        
        setVal(`${sport}-upper-dark`, darkUpper);
        setVal(`${sport}-lower-dark`, dark.lower);
        setVal(`${sport}-extremities-dark`, darkExt);
    };

    updateSport('bike');
    updateSport('run');
}


// --- MAIN EXPORTS ---

export function renderGear(gearData, currentTemp, hourlyWeather) {
    if (!gearData) {
        return `
            <div class="p-12 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                <i class="fa-solid fa-shirt text-4xl mb-4 text-slate-600"></i>
                <div class="text-sm font-mono">Loading Gear Locker...</div>
            </div>`;
    }

    // Determine default temp selection (rounded to nearest 5)
    let defaultVal = 50;
    if (currentTemp !== null && currentTemp !== undefined) {
        defaultVal = Math.round(currentTemp / 5) * 5;
    }

    const tempOptions = buildTempOptions(defaultVal);
    const hourlyHtml = buildHourlyForecast(hourlyWeather);
    
    return `
        <div class="space-y-6 pb-20">
            <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-6">
                ${hourlyHtml}
                <div class="max-w-xs mx-auto">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Base Temperature</label>
                    <div class="relative">
                        <select id="gear-temp" onchange="window.App.updateGearResult()" class="w-full bg-slate-900 border border-slate-700 text-white text-center text-lg font-bold py-3 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            ${tempOptions}
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                            <i class="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>${renderSportSection('bike', 'Cycling')}</div>
                <div>${renderSportSection('run', 'Running')}</div>
            </div>
        </div>
    `;
}

export function updateGearResult(gearData) {
    updateGearUI(gearData);
}

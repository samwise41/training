import { Formatters } from '../../utils/formatting.js';
import { UI } from '../../utils/ui.js';

// --- CONFIGURATION ---
const PREFER_RUNNING_FIRST = true; // Set to false to show Cycling on top

// --- 1. COMPONENT: HOURLY FORECAST ---
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
                <div class="hourly-item">
                    <span class="text-[10px] text-slate-400 font-bold">${hourLabel} ${ampm}</span>
                    <span class="text-lg">${icon}</span>
                    <span class="text-xs font-bold text-slate-200">${Math.round(temps[index])}°</span>
                </div>`;
        }
    });

    return `<div class="mb-6"><p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hourly Forecast</p><div class="hourly-scroll">${itemsHtml}</div></div>`;
};

// --- 2. COMPONENT: TEMP SELECTOR ---
const buildTempOptions = (defaultVal) => {
    let tempOptions = `<option value="25" ${defaultVal <= 25 ? 'selected' : ''}>&lt;30°F</option>`;
    for (let i = 30; i <= 70; i += 5) tempOptions += `<option value="${i}" ${i === defaultVal ? 'selected' : ''}>${i}°F</option>`;
    tempOptions += `<option value="75" ${defaultVal >= 75 ? 'selected' : ''}>70°F+</option>`;
    return tempOptions;
};

// --- 3. HELPER: DATA LOOKUP ---
function getGearForTemp(gearList, temp) {
    if (!gearList) return { upper: "—", lower: "—", extremities: "—" };
    
    const match = gearList.find(r => {
        const min = r.min !== undefined ? r.min : -999;
        const max = r.max !== undefined ? r.max : 999;
        return temp >= min && temp < max;
    });

    return match || { upper: "—", lower: "—", extremities: "—" };
}

function renderList(text) {
    if (!text || text === "—") return '<span class="text-[9px] md:text-xs text-slate-600 italic">None</span>';
    const items = text.split(',').map(s => s.trim()).filter(s => s);
    
    return items.map(item => `
        <div class="flex items-start gap-1.5 leading-tight">
            <span class="text-emerald-500 text-[8px] mt-[3px] shrink-0">●</span>
            <span class="text-[10px] md:text-sm text-slate-300 break-words">${item}</span>
        </div>
    `).join('');
}

// --- 4. COMPONENT: NEW 3-COLUMN CARD ---
function renderBodyPartCard(title, standardText, weatherText, darkText) {
    return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg mb-4">
        <div class="bg-slate-900/50 p-2 md:p-3 border-b border-slate-700 flex items-center gap-2">
            <span class="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-widest">${title}</span>
        </div>
        <div class="grid grid-cols-3 divide-x divide-slate-700">
            <div class="p-2 md:p-4 flex flex-col gap-2">
                <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                    <i class="fa-solid fa-sun text-yellow-500 text-[10px] md:text-xs"></i>
                    <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Standard</span>
                </div>
                ${renderList(standardText)}
            </div>
            <div class="p-2 md:p-4 flex flex-col gap-2 bg-slate-800/30">
                <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                    <i class="fa-solid fa-wind text-blue-400 text-[10px] md:text-xs"></i>
                    <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Wind/Rain</span>
                </div>
                ${renderList(weatherText)}
            </div>
            <div class="p-2 md:p-4 flex flex-col gap-2 bg-slate-900/30">
                <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                    <i class="fa-solid fa-moon text-purple-400 text-[10px] md:text-xs"></i>
                    <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Dark/Night</span>
                </div>
                ${renderList(darkText)}
            </div>
        </div>
    </div>`;
}

// --- 5. RENDER MAIN CONTENT ---
function generateContentHTML(gearData, selectedTemp) {
    const standardTemp = selectedTemp;
    const weatherTemp = selectedTemp - 10;
    const darkTemp = selectedTemp - 5;

    // --- CYCLING SECTION ---
    const bikeStd = getGearForTemp(gearData.bike, standardTemp);
    const bikeWth = getGearForTemp(gearData.bike, weatherTemp);
    const bikeDrk = getGearForTemp(gearData.bike, darkTemp);

    const bikeWthUpper = bikeWth.upper !== "—" ? `${bikeWth.upper}, Rain Shell` : "Rain Shell";
    const bikeDrkUpper = bikeDrk.upper !== "—" ? `${bikeDrk.upper}, Reflective Vest` : "Reflective Vest";
    const bikeDrkExt   = bikeDrk.extremities !== "—" ? `${bikeDrk.extremities}, Viz Bands` : "Viz Bands";

    // Use var(--color-bike) for exact CSS match
    const bikeHtml = `
        <div class="mb-8">
            <h3 class="flex items-center gap-2 text-lg font-bold uppercase tracking-widest mb-4" style="color: var(--color-bike)">
                <i class="fa-solid fa-bicycle"></i> Cycling
            </h3>
            ${renderBodyPartCard("Upper Body", bikeStd.upper, bikeWthUpper, bikeDrkUpper)}
            ${renderBodyPartCard("Lower Body", bikeStd.lower, bikeWth.lower, bikeDrk.lower)}
            ${renderBodyPartCard("Extremities", bikeStd.extremities, bikeWth.extremities, bikeDrkExt)}
        </div>
    `;

    // --- RUNNING SECTION ---
    const runStd = getGearForTemp(gearData.run, standardTemp);
    const runWth = getGearForTemp(gearData.run, weatherTemp);
    const runDrk = getGearForTemp(gearData.run, darkTemp);

    const runWthUpper = runWth.upper !== "—" ? `${runWth.upper}, Wind Shell` : "Wind Shell";
    const runDrkUpper = runDrk.upper !== "—" ? `${runDrk.upper}, Viz Vest` : "Viz Vest";
    const runDrkHead  = runDrk.extremities !== "—" ? `${runDrk.extremities}, Headlamp` : "Headlamp";

    // Use var(--color-run) for exact CSS match
    const runHtml = `
        <div class="mb-8">
            <h3 class="flex items-center gap-2 text-lg font-bold uppercase tracking-widest mb-4" style="color: var(--color-run)">
                <i class="fa-solid fa-person-running"></i> Running
            </h3>
            ${renderBodyPartCard("Upper Body", runStd.upper, runWthUpper, runDrkUpper)}
            ${renderBodyPartCard("Lower Body", runStd.lower, runWth.lower, runDrk.lower)}
            ${renderBodyPartCard("Extremities", runStd.extremities, runWth.extremities, runDrkHead)}
        </div>
    `;

    // --- ORDERING LOGIC ---
    return PREFER_RUNNING_FIRST ? (runHtml + bikeHtml) : (bikeHtml + runHtml);
}

// --- EXPORTS ---

export function renderGear(gearData, currentTemp, hourlyWeather) {
    if (!gearData) {
        return `
            <div class="p-12 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                <i class="fa-solid fa-bicycle text-4xl mb-4 text-slate-600"></i>
                <div class="text-sm font-mono">Loading Gear Locker...</div>
            </div>`;
    }

    let defaultVal = 50;
    if (currentTemp !== null && currentTemp !== undefined) {
        defaultVal = Math.round(currentTemp / 5) * 5;
        if (defaultVal < 25) defaultVal = 25;
        if (defaultVal > 75) defaultVal = 75;
    }

    const hourlyHtml = buildHourlyForecast(hourlyWeather);
    const tempOptions = buildTempOptions(defaultVal);
    const contentHtml = generateContentHTML(gearData, defaultVal);

    return `
        <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-4 md:p-6 mb-8 pb-20">
            ${hourlyHtml}
            
            <div class="flex flex-col gap-2 mb-8 max-w-md mx-auto sticky top-0 z-10 bg-slate-900/90 p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Select Base Temperature</label>
                <select id="gear-temp" onchange="window.App.updateGearResult()" class="gear-select text-center text-xl font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer">
                    ${tempOptions}
                </select>
            </div>

            <div id="gear-results-container">
                ${contentHtml}
            </div>
        </div>`;
}

export function updateGearResult(gearData) {
    const tempSelect = document.getElementById('gear-temp');
    if (!tempSelect || !gearData) return;
    
    const temp = parseInt(tempSelect.value);
    const container = document.getElementById('gear-results-container');
    
    if (container) {
        container.innerHTML = generateContentHTML(gearData, temp);
    }
}

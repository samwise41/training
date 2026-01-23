// js/views/gear/index.js
import { Formatters } from '../../utils/formatting.js';
import { UI } from '../../utils/ui.js';

// --- COMPONENTS ---
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

const buildTempOptions = (defaultVal) => {
    let tempOptions = `<option value="25" ${defaultVal === 25 ? 'selected' : ''}>&lt;30°F</option>`;
    for (let i = 30; i <= 70; i++) tempOptions += `<option value="${i}" ${i === defaultVal ? 'selected' : ''}>${i}°F</option>`;
    tempOptions += `<option value="75" ${defaultVal === 75 ? 'selected' : ''}>70°F+</option>`;
    return tempOptions;
};

const generateRow = (idPrefix, sportType, label) => {
    const iconHtml = Formatters.getIconForSport(sportType);
    const colorClass = sportType === 'bike' ? 'text-blue-400' : 'text-emerald-400';

    return `
    <div class="gear-row-container flex flex-col md:flex-row gap-4 items-stretch mb-4">
        <div class="activity-header min-w-[140px] flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg border border-slate-700">
            <span class="${colorClass} text-lg">${iconHtml}</span>
            <span class="text-xs font-bold text-slate-200 uppercase tracking-widest">${label}</span>
        </div>
        <div class="gear-bubbles-row grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div class="gear-bubble bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex flex-col gap-1 h-full"><span class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Upper Body</span><p id="${idPrefix}-upper" class="text-sm text-slate-100 font-medium leading-relaxed">--</p></div>
            <div class="gear-bubble bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex flex-col gap-1 h-full"><span class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Lower Body</span><p id="${idPrefix}-lower" class="text-sm text-slate-100 font-medium leading-relaxed">--</p></div>
            <div class="gear-bubble bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex flex-col gap-1 h-full"><span class="text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-1">Extremities</span><p id="${idPrefix}-extremities" class="text-sm text-slate-100 font-medium leading-relaxed">--</p></div>
        </div>
    </div>`;
};

const renderLayout = (hourlyHtml, tempOptions) => {
    return `
        <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-6 mb-8">
            ${hourlyHtml}
            <div class="flex flex-col gap-2 mb-8 max-w-md mx-auto">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Select Temperature</label>
                <select id="gear-temp" onchange="window.App.updateGearResult()" class="gear-select text-center text-lg py-3">${tempOptions}</select>
            </div>
            <div class="mb-10">
                <h3 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Standard Conditions</h3>
                <div class="flex flex-col gap-4">${generateRow('bike-standard', 'bike', 'Cycling')}${generateRow('run-standard', 'run', 'Running')}</div>
            </div>
            <div>
                <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Windy & Rainy (-10°F)</h3>
                <div class="flex flex-col gap-4">${generateRow('bike-weather', 'bike', 'Cycling')}${generateRow('run-weather', 'run', 'Running')}</div>
            </div>
        </div>`;
};

// --- LOGIC ---
function updateGearUI(gearData) {
    if (!gearData) return;
    console.log("⚙️ Updating Gear UI with Data:", gearData); // DEBUG

    const tempSelect = document.getElementById('gear-temp');
    if (!tempSelect) return;
    const temp = parseInt(tempSelect.value);
    
    const processActivity = (activity, prefixBase) => {
        const list = gearData[activity] || [];
        const findMatch = (t) => {
            const match = list.find(r => {
                if (r.min === -999) return t < r.max;
                if (r.max === 999) return t >= r.min;
                return t >= r.min && t <= r.max;
            });
            return match || { upper: "—", lower: "—", extremities: "—" };
        };

        const standard = findMatch(temp);
        const weather = findMatch(temp - 10);

        const updateUI = (prefix, data) => {
            const u = document.getElementById(`${prefix}-upper`);
            const l = document.getElementById(`${prefix}-lower`);
            const e = document.getElementById(`${prefix}-extremities`);
            if (u) u.innerHTML = data.upper;
            if (l) l.innerHTML = data.lower;
            if (e) e.innerHTML = data.extremities;
        };

        updateUI(`${prefixBase}-standard`, standard);
        updateUI(`${prefixBase}-weather`, weather);
    };

    processActivity('bike', 'bike');
    processActivity('run', 'run');
}

// --- EXPORTS ---
export function renderGear(gearData, currentTemp, hourlyWeather) {
    // 1. Loading State (Fix for missing data)
    if (!gearData) {
        return `
            <div class="p-12 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                <i class="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
                <div class="text-sm font-mono">Loading Gear Data...</div>
            </div>`;
    }

    // Default Temp Logic
    let defaultVal = 50;
    if (currentTemp !== null && currentTemp !== undefined) {
        if (currentTemp < 30) defaultVal = 25;
        else if (currentTemp > 70) defaultVal = 75;
        else defaultVal = currentTemp;
    }

    const tempOptions = buildTempOptions(defaultVal);
    const hourlyHtml = buildHourlyForecast(hourlyWeather);
    return renderLayout(hourlyHtml, tempOptions);
}

export function updateGearResult(gearData) {
    updateGearUI(gearData);
}

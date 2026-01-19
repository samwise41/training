// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Unified Data Mode)...");

    const cacheBuster = Date.now();
    
    const safeImport = async (path, name) => {
        try {
            return await import(`${path}?t=${cacheBuster}`);
        } catch (e) {
            console.error(`⚠️ Failed to load module: ${name}`, e);
            return null;
        }
    };

    // --- 1. IMPORT MODULES ---
    const parserMod = await safeImport('./parser.js', 'Parser');
    const trendsMod = await safeImport('./views/trends/index.js', 'Trends');
    const gearMod = await safeImport('./views/gear/index.js', 'Gear');
    const zonesMod = await safeImport('./views/zones/index.js', 'Zones');
    const ftpMod = await safeImport('./views/ftp/index.js', 'FTP'); 
    const roadmapMod = await safeImport('./views/roadmap/index.js', 'Roadmap');
    const dashMod = await safeImport('./views/dashboard/index.js', 'Dashboard');
    const readinessMod = await safeImport('./views/readiness/index.js', 'Readiness');
    const metricsMod = await safeImport('./views/metrics/index.js', 'Metrics');

    // --- 2. DESTRUCTURE FUNCTIONS ---
    const Parser = parserMod?.Parser || { parseTrainingLog: () => [], getSection: () => "" };
    const { renderTrends, updateDurationAnalysis } = trendsMod || { renderTrends: () => ({html: ''}) };
    const { renderGear, updateGearResult } = gearMod || { renderGear: () => ({ html: '', gearData: null }), updateGearResult: () => {} };
    const { renderZones } = zonesMod || { renderZones: () => '' };
    const { renderFTP } = ftpMod || { renderFTP: () => '<div class="p-4 text-red-500">FTP Module Failed</div>' }; 
    const { renderRoadmap } = roadmapMod || { renderRoadmap: () => '' };
    const { renderDashboard } = dashMod || { renderDashboard: () => '' };
    const { renderReadiness } = readinessMod || { renderReadiness: () => '' };
    const renderReadinessChart = readinessMod?.renderReadinessChart || (() => {});
    const { renderMetrics } = metricsMod || { renderMetrics: () => '' };

    console.log(`📦 Modules loaded with ID: ${cacheBuster}`);

    const CONFIG = {
        PLAN_FILE: "endurance_plan.md",
        GEAR_FILE: "js/views/gear/Gear.md",
        HISTORY_FILE: "MASTER_TRAINING_DATABASE.md",
        AUTH_FILE: "auth_config.json",
        WEATHER_MAP: {
            0: ["Clear", "☀️"], 1: ["Partly Cloudy", "🌤️"], 2: ["Partly Cloudy", "🌤️"], 3: ["Cloudy", "☁️"],
            45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"], 51: ["Drizzle", "🌦️"], 61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"],
            71: ["Snow", "❄️"], 95: ["Storm", "⛈️"]
        }
    };

    async function hashString(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const App = {
        planMd: "",
        gearMd: "",
        archiveMd: "", 
        allData: [], 
        gearData: null,
        currentTemp: null,
        hourlyWeather: null,

        async checkSecurity() {
            const curtain = document.getElementById('security-curtain');
            const input = document.getElementById('access-code');
            const btn = document.getElementById('btn-unlock');
            const errorMsg = document.getElementById('access-error');

            if (document.cookie.split(';').some((item) => item.trim().startsWith('dashboard_access=true'))) {
                if (curtain) curtain.classList.add('hidden');
                return;
            }

            if (curtain) curtain.classList.remove('hidden');

            if (btn && input) {
                const unlock = async () => {
                    const enteredPass = input.value.trim();
                    if (!enteredPass) return;

                    try {
                        const response = await fetch(`./${CONFIG.AUTH_FILE}?t=${new Date().getTime()}`);
                        if (!response.ok) throw new Error("Auth config missing");

                        const allowedHashes = await response.json();
                        const userHash = await hashString(enteredPass);

                        if (allowedHashes.includes(userHash)) {
                            document.cookie = "dashboard_access=true; path=/; max-age=315360000; SameSite=Strict";
                            curtain.style.opacity = '0';
                            setTimeout(() => curtain.classList.add('hidden'), 500);
                        } else {
                            throw new Error("Invalid Password");
                        }
                    } catch (e) {
                        console.error("Auth Failed:", e);
                        input.value = '';
                        if (errorMsg) {
                            errorMsg.classList.remove('hidden');
                            errorMsg.innerText = "Access Denied"; 
                        }
                        input.classList.add('border-red-500');
                        input.classList.remove('border-slate-700');
                    }
                };
                btn.onclick = unlock; 
                input.onkeypress = (e) => { if (e.key === 'Enter') unlock(); };
                input.oninput = () => { 
                    if (errorMsg) errorMsg.classList.add('hidden'); 
                    input.classList.remove('border-red-500'); 
                    input.classList.add('border-slate-700'); 
                }
            }
        },

        getStatsBar() {
            return `
                <div id="stats-bar" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-center shadow-lg">
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Phase</p>
                        <div class="flex flex-col">
                            <span class="text-lg font-bold text-blue-500 leading-tight" id="stat-phase">--</span>
                            <span class="text-sm font-bold text-white leading-tight mt-1" id="stat-week">--</span>
                        </div>
                    </div>
                    
                    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next Event</p>
                            <div id="stat-event">
                                <p class="text-lg font-bold text-white leading-tight" id="stat-event-name">--</p>
                                <div class="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                                    <span id="stat-event-date" class="border-r border-slate-600 pr-3 text-slate-300">--</span>
                                    <span id="stat-event-countdown" class="uppercase">--</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right pl-4 border-l border-slate-700/50" id="stat-readiness-box" style="display:none;">
                            <div class="text-3xl font-black text-slate-200 leading-none tracking-tighter" id="stat-readiness-val">--%</div>
                            <div class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Readiness</div>
                            <div class="flex flex-col items-end gap-1 mt-1">
                                <div id="stat-readiness-badge" class="px-1.5 py-0.5 rounded bg-slate-900 border text-[8px] font-bold uppercase tracking-wider inline-block">--</div>
                                <div id="stat-weakest-link" class="text-[9px] text-slate-500 font-mono hidden">
                                    Limit: <span id="stat-weakest-name" class="font-bold">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        async init() {
            await this.checkSecurity();
            const initialHash = window.location.hash.substring(1);
            const validViews = ['dashboard', 'trends', 'logbook', 'roadmap', 'gear', 'zones', 'ftp', 'readiness', 'metrics'];
            const startView = validViews.includes(initialHash) ? initialHash : 'dashboard';
    
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const initialNavBtn = document.getElementById(`nav-${startView}`);
            if (initialNavBtn) initialNavBtn.classList.add('active');
            
            try {
                const [planRes, gearRes, archiveRes] = await Promise.all([
                    fetch(`./${CONFIG.PLAN_FILE}?t=${cacheBuster}`),
                    fetch(`./${CONFIG.GEAR_FILE}?t=${cacheBuster}`),
                    fetch(`./${CONFIG.HISTORY_FILE}?t=${cacheBuster}`)
                ]);
                
                if (!planRes.ok) throw new Error(`Could not load ${CONFIG.PLAN_FILE}`);
                this.planMd = await planRes.text();
                this.gearMd = await gearRes.text();
                this.archiveMd = archiveRes.ok ? await archiveRes.text() : "";

                const masterLog = Parser.parseTrainingLog(this.archiveMd); 
                const planLog = Parser.parseTrainingLog(this.planMd);      

                const dataMap = new Map();
                masterLog.forEach(item => {
                    if (item.date) {
                        const key = `${item.date.toISOString().split('T')[0]}_${item.type}`;
                        dataMap.set(key, item);
                    }
                });

                planLog.forEach(item => {
                    if (item.date) {
                        const key = `${item.date.toISOString().split('T')[0]}_${item.type}`;
                        if (!dataMap.has(key)) {
                            dataMap.set(key, item);
                        }
                    }
                });

                this.allData = Array.from(dataMap.values()).sort((a,b) => b.date - a.date);
                this.logData = this.allData; 

                this.setupEventListeners();
                window.addEventListener('hashchange', () => this.handleHashChange());
                this.handleHashChange(); 
                this.fetchWeather();
                
            } catch (e) {
                console.error("Init Error:", e);
            }
        },

        setupEventListeners() {
            const navMap = {
                'nav-dashboard': 'dashboard', 'nav-trends': 'trends', 'nav-logbook': 'logbook',
                'nav-roadmap': 'roadmap', 'nav-gear': 'gear', 'nav-zones': 'zones', 
                'nav-ftp': 'ftp',
                'nav-readiness': 'readiness', 'nav-metrics': 'metrics'
            };
            Object.keys(navMap).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', () => this.navigate(navMap[id]));
            });
            const btnOpen = document.getElementById('btn-sidebar-open');
            const btnClose = document.getElementById('btn-sidebar-close');
            const overlay = document.getElementById('sidebar-overlay');
            if (btnOpen) btnOpen.addEventListener('click', () => this.toggleSidebar());
            if (btnClose) btnClose.addEventListener('click', () => this.toggleSidebar());
            if (overlay) overlay.addEventListener('click', () => this.toggleSidebar());
        },

        async fetchWeather() {
            try {
                const locRes = await fetch('https://ipapi.co/json/');
                const locData = await locRes.json();
                if (locData.city) {
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`);
                    const weatherData = await weatherRes.json();
                    this.currentTemp = Math.round(weatherData.current_weather.temperature);
                    this.hourlyWeather = weatherData.hourly || null; 
                    const code = weatherData.current_weather.weathercode;
                    const condition = CONFIG.WEATHER_MAP[code] || ["Cloudy", "☁️"];
                    document.getElementById('weather-info').innerText = `${this.currentTemp}°F • ${condition[0]}`;
                    document.getElementById('weather-icon-top').innerText = condition[1];
                }
            } catch (e) { console.error("Weather unavailable", e); }
        },

        updateStats() {
            if (!this.planMd) return;
            
            // --- FIX: UPDATED REGEX FOR NEW STATUS FORMAT ---
            // Captures: Phase X (Group 1) - Block Y Week Z (Group 2)
            const statusMatch = this.planMd.match(/\*\*Status:\*\*\s*(.*?)\s+-\s+(.*)/i);
            
            const currentPhaseRaw = statusMatch ? statusMatch[1].trim() : "Plan Active";
            const currentWeek = statusMatch ? statusMatch[2].trim() : "";
            
            const phaseEl = document.getElementById('stat-phase');
            if (phaseEl) phaseEl.innerText = currentPhaseRaw;
            
            const weekEl = document.getElementById('stat-week');
            if (weekEl) weekEl.innerText = currentWeek;
            
            const lines = this.planMd.split('\n');
            let nextEvent = null;
            let inTable = false;
            const today = new Date(); today.setHours(0,0,0,0);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('| **Date** |')) { inTable = true; continue; }
                if (inTable && line.startsWith('| :---')) continue;
                if (inTable && line.startsWith('|')) {
                    const clean = line.replace(/^\||\|$/g, '');
                    const cols = clean.split('|').map(c => c.trim());
                    if (cols.length >= 2) {
                        const d = new Date(cols[0]);
                        if (!isNaN(d.getTime()) && d >= today) {
                            nextEvent = { 
                                date: d, name: cols[1], 
                                swimGoal: cols[7]||'', bikeGoal: cols[9]||'', runGoal: cols[11]||'' 
                            };
                            break; 
                        }
                    }
                } else if (inTable && line === '') inTable = false;
            }

            if (nextEvent) {
                document.getElementById('stat-event-name').innerText = nextEvent.name;
                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                document.getElementById('stat-event-date').innerText = nextEvent.date.toLocaleDateString('en-US', dateOptions);
                const diff = Math.ceil((nextEvent.date - today) / 86400000);
                const timeStr = diff < 0 ? "Completed" : (diff === 0 ? "Today!" : `${Math.floor(diff/7)}w ${diff%7}d to go`);
                document.getElementById('stat-event-countdown').innerHTML = `<i class="fa-solid fa-hourglass-half mr-1"></i> ${timeStr}`;

                if (this.allData.length > 0) {
                    const parseDur = (str) => {
                        if(!str || str.includes('km') || str.includes('mi')) return 0;
                        if(!isNaN(str)) return parseInt(str);
                        let m=0;
                        if(str.includes('h')) { const p=str.split('h'); m+=parseInt(p[0])*60; if(p[1]) m+=parseInt(p[1]); }
                        else if(str.includes(':')) { const p=str.split(':'); m+=parseInt(p[0])*60 + parseInt(p[1]); }
                        else if(str.includes('m')) m+=parseInt(str);
                        return m;
                    };

                    const lookback = new Date(); lookback.setDate(lookback.getDate()-30);
                    let mS=0, mB=0, mR=0;
                    this.allData.forEach(d => {
                        if(new Date(d.date) >= lookback) {
                            let dur = typeof d.actualDuration === 'number' ? d.actualDuration : parseDur(d.duration);
                            if(d.type==='Swim') mS=Math.max(mS,dur);
                            if(d.type==='Bike') mB=Math.max(mB,dur);
                            if(d.type==='Run') mR=Math.max(mR,dur);
                        }
                    });

                    const tS = parseDur(nextEvent.swimGoal);
                    const tB = parseDur(nextEvent.bikeGoal);
                    const tR = parseDur(nextEvent.runGoal);
                    
                    const scores = [];
                    if(tS>0) scores.push({ type: 'Swim', val: Math.min(Math.round((mS/tS)*100),100), color: 'text-cyan-400' });
                    if(tB>0) scores.push({ type: 'Bike', val: Math.min(Math.round((mB/tB)*100),100), color: 'text-purple-400' });
                    if(tR>0) scores.push({ type: 'Run', val: Math.min(Math.round((mR/tR)*100),100), color: 'text-pink-400' });

                    if(scores.length > 0) {
                        const minScore = scores.reduce((prev, curr) => prev.val < curr.val ? prev : curr);
                        const box = document.getElementById('stat-readiness-box');
                        const val = document.getElementById('stat-readiness-val');
                        const badge = document.getElementById('stat-readiness-badge');
                        const weakBox = document.getElementById('stat-weakest-link');
                        const weakName = document.getElementById('stat-weakest-name');
                        
                        box.style.display = 'block';
                        val.innerText = `${minScore.val}%`;
                        let color = "text-red-500"; let bColor = "border-red-500/50"; let label = "WARNING";
                        if(minScore.val >= 85) { color="text-emerald-500"; bColor="border-emerald-500/50"; label="READY"; }
                        else if(minScore.val >= 60) { color="text-yellow-500"; bColor="border-yellow-500/50"; label="BUILD"; }

                        val.className = `text-3xl font-black ${color} leading-none tracking-tighter`;
                        badge.innerText = label;
                        badge.className = `px-1.5 py-0.5 rounded bg-slate-900 border ${bColor} ${color} text-[8px] font-bold uppercase tracking-wider inline-block`;

                        if (minScore.val < 100) {
                            weakBox.classList.remove('hidden');
                            weakName.innerText = minScore.type;
                            weakName.className = `font-bold ${minScore.color}`;
                        } else {
                            weakBox.classList.add('hidden');
                        }
                    }
                }
            }
        },

        handleHashChange() {
            const hash = window.location.hash.substring(1); 
            const validViews = ['dashboard', 'trends', 'logbook', 'roadmap', 'gear', 'zones', 'ftp', 'readiness', 'metrics'];
            const view = validViews.includes(hash) ? hash : 'dashboard';
            this.renderView(view);
        },

        navigate(view) { window.location.hash = view; },

        renderView(view) {
            const titles = { 
                dashboard: 'Weekly Schedule', trends: 'Trends & KPIs', logbook: 'Logbook', roadmap: 'Season Roadmap', 
                gear: 'Gear Choice', zones: 'Training Zones', ftp: 'Performance Profile', readiness: 'Race Readiness', metrics: 'Performance Metrics'
            };
            const titleEl = document.getElementById('header-title-dynamic');
            if (titleEl) titleEl.innerText = titles[view] || 'Dashboard';

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const navBtn = document.getElementById(`nav-${view}`);
            if (navBtn) navBtn.classList.add('active');
            
            const content = document.getElementById('content');
            content.classList.add('opacity-0');
            
            setTimeout(() => {
                try {
                    if (view === 'gear') {
                        const result = renderGear(this.gearMd, this.currentTemp, this.hourlyWeather);
                        content.innerHTML = result.html;
                        this.gearData = result.gearData;
                        this.updateGearResult(); 
                    } 
                    else if (view === 'zones') content.innerHTML = renderZones(this.planMd);
                    else if (view === 'ftp') content.innerHTML = renderFTP(this.planMd); 
                    else if (view === 'trends') {
                        const result = renderTrends(this.allData); 
                        content.innerHTML = result.html;
                        this.updateDurationAnalysis();
                    } 
                    else if (view === 'roadmap') content.innerHTML = renderRoadmap(this.planMd);
                    else if (view === 'readiness') {
                        const html = renderReadiness(this.allData, this.planMd); 
                        content.innerHTML = html;
                        renderReadinessChart(this.allData); 
                    }
                    else if (view === 'metrics') {
                        content.innerHTML = renderMetrics(this.allData);
                    }
                    else if (view === 'logbook') {
                        const archive = Parser.getSection(this.archiveMd, "Training History");
                        const mdContent = archive || (this.archiveMd && this.archiveMd.trim().length > 0 ? this.archiveMd : "No logs found in Master Database.");
                        
                        const safeMarked = window.marked ? window.marked.parse : (t) => t;
                        content.innerHTML = `<div class="markdown-body">${safeMarked(mdContent)}</div>`;
                    }
                    else {
                        const html = this.getStatsBar() + renderDashboard(this.planMd, this.allData);
                        content.innerHTML = html;
                        this.updateStats(); 
                    }
                } catch (err) {
                    console.error("Render error:", err);
                    content.innerHTML = `<p class="text-red-400">Error rendering view: ${err.message}</p>`;
                }
                content.classList.remove('opacity-0');
                if (window.innerWidth < 1024) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar.classList.contains('sidebar-open')) this.toggleSidebar();
                }
            }, 200);
        },

        updateDurationAnalysis(data) { updateDurationAnalysis(data || this.allData); },
        updateGearResult() { updateGearResult(this.gearData); },

        toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            sidebar.classList.toggle('sidebar-closed');
            sidebar.classList.toggle('sidebar-open');
            overlay.classList.toggle('hidden');
        }
    };

    window.App = App;
    App.init();

})();

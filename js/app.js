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
    #const parserMod = await safeImport('./parser.js', 'Parser');
    #const trendsMod = await safeImport('./views/trends/index.js', 'Trends');
    #const gearMod = await safeImport('./views/gear/index.js', 'Gear');
    #const zonesMod = await safeImport('./views/zones/index.js', 'Zones');
    #const ftpMod = await safeImport('./views/ftp/index.js', 'FTP'); 
    #const roadmapMod = await safeImport('./views/roadmap/index.js', 'Roadmap');
    const dashMod = await safeImport('./views/dashboard/index.js', 'Dashboard');
    #const readinessMod = await safeImport('./views/readiness/index.js', 'Readiness');
    #const metricsMod = await safeImport('./views/metrics/index.js', 'Metrics');

    // --- 2. DESTRUCTURE FUNCTIONS ---\n    const Parser = parserMod?.Parser || { parseTrainingLog: () => [], getSection: () => "" };
    const { renderTrends, updateDurationAnalysis } = trendsMod || { renderTrends: () => ({html: ''}) };
    const { renderGear, updateGearResult } = gearMod || { renderGear: () => '' };
    const { renderZones } = zonesMod || { renderZones: () => '' };
    const { renderFTP } = ftpMod || { renderFTP: () => '' };
    const { renderRoadmap } = roadmapMod || { renderRoadmap: () => '' };
    const { renderDashboard } = dashMod || { renderDashboard: () => "Dashboard module not loaded." };
    const { renderReadiness } = readinessMod || { renderReadiness: () => '' };
    const { renderMetrics } = metricsMod || { renderMetrics: () => '' };

    // --- 3. APP STATE ---
    const App = {
        planMd: "",
        allData: [],
        gearData: "",
        garminData: [],
        plannedData: [], // Added: Container for new JSON plan data

        async init() {
            await this.loadData();
            this.setupNavigation();
            this.renderCurrentView();
        },

        async loadData() {
            try {
                console.log("📡 Fetching data...");
                // Added fetch for planned.json
                const [planRes, logRes, gearRes, garminRes, plannedJsonRes] = await Promise.all([
                    fetch('./endurance_plan.md'),
                    fetch('./data/training_log.json'),
                    fetch('./js/views/gear/Gear.md'),
                    fetch('./data/my_garmin_data_ALL.json'),
                    fetch('./data/planned.json')
                ]);

                if (!planRes.ok || !logRes.ok || !gearRes.ok || !garminRes.ok || !plannedJsonRes.ok) {
                    throw new Error("One or more files failed to load.");
                }

                this.planMd = await planRes.text();
                
                const rawLog = await logRes.json();
                this.allData = Parser.parseTrainingLog(rawLog);

                this.gearData = await gearRes.text();
                this.garminData = await garminRes.json();
                
                // Load the new planned JSON
                this.plannedData = await plannedJsonRes.json();

                console.log("✅ Data Loaded:", { 
                    planLength: this.planMd.length, 
                    logItems: this.allData.length,
                    plannedItems: this.plannedData.length
                });

                this.updateStats();
                this.renderCurrentView();

            } catch (err) {
                console.error("Data Load Error:", err);
                document.getElementById('main-content').innerHTML = `
                    <div class="p-10 text-center text-red-500">
                        <h2 class="text-xl font-bold mb-2">⚠️ Data Loading Failed</h2>
                        <p>${err.message}</p>
                    </div>`;
            }
        },

        setupNavigation() {
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // UI Toggle
                    document.querySelectorAll('.nav-item').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                        b.classList.add('text-slate-400', 'border-transparent');
                    });
                    e.currentTarget.classList.remove('text-slate-400', 'border-transparent');
                    e.currentTarget.classList.add('bg-slate-800', 'text-white', 'border-slate-600');

                    // Render
                    const view = e.currentTarget.dataset.view;
                    localStorage.setItem('currentView', view); // Persist selection
                    this.renderCurrentView(view);
                });
            });

            // Restore last view
            const lastView = localStorage.getItem('currentView') || 'dashboard';
            const btn = document.querySelector(`.nav-item[data-view="${lastView}"]`);
            if (btn) btn.click();
        },

        getStatsBar() {
            const totalMins = this.allData.reduce((acc, d) => acc + (d.actualDuration || 0), 0);
            const totalHrs = Math.floor(totalMins / 60);
            return `
                <div class="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center mb-6">
                    <span class="text-slate-400 text-xs uppercase tracking-widest font-bold">Training Log</span>
                    <div class="flex gap-4">
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${this.allData.length}</strong> Activities</span>
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${totalHrs}</strong> Hours</span>
                    </div>
                </div>
            `;
        },

        updateStats() {
            // Can add global stats updates here if needed
        },

        renderCurrentView(viewName) {
            const view = viewName || localStorage.getItem('currentView') || 'dashboard';
            const content = document.getElementById('main-content');
            
            content.classList.add('opacity-0');
            setTimeout(() => {
                content.innerHTML = '';
                try {
                    if (view === 'trends') {
                        content.innerHTML = this.getStatsBar();
                        const { html, afterRender } = renderTrends(this.allData);
                        content.insertAdjacentHTML('beforeend', html);
                        if (afterRender) afterRender();
                    }
                    else if (view === 'gear') {
                        content.innerHTML = renderGear(this.gearData); 
                        this.updateGearResult();
                    }
                    else if (view === 'zones') {
                        content.innerHTML = renderZones(this.garminData);
                    }
                    else if (view === 'ftp') {
                        content.innerHTML = renderFTP(this.garminData);
                    }
                    else if (view === 'roadmap') {
                        content.innerHTML = renderRoadmap(this.garminData, this.planMd);
                    }
                    else if (view === 'readiness') {
                        content.innerHTML = renderReadiness(this.garminData);
                    }
                    else if (view === 'metrics') {
                        content.innerHTML = renderMetrics(this.garminData);
                    }
                    else if (view === 'plan') {
                        // Fallback simple markdown render
                        const mdContent = Parser.getSection(this.planMd, "Weekly Schedule") || "No plan found.";
                        const safeMarked = window.marked ? window.marked.parse : (t) => t;
                        content.innerHTML = `<div class="markdown-body">${safeMarked(mdContent)}</div>`;
                    }
                    else {
                        // UPDATED: Now passes the JSON data (this.plannedData) instead of Markdown
                        const html = this.getStatsBar() + renderDashboard(this.plannedData, this.allData);
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

// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Full Suite)...");

    const cacheBuster = Date.now();
    
    // --- 1. DYNAMIC IMPORTS ---
    const safeImport = async (path) => {
        try {
            const module = await import(`${path}?t=${cacheBuster}`);
            return module;
        } catch (e) {
            console.warn(`⚠️ Module skipped: ${path}`, e.message);
            return null;
        }
    };

    // Load all view modules
    const [
        parserMod, 
        dashMod, 
        trendsMod, 
        gearMod, 
        zonesMod, 
        ftpMod, 
        roadmapMod
    ] = await Promise.all([
        safeImport('./parser.js'),
        safeImport('./views/dashboard/index.js'),
        safeImport('./views/trends/index.js'),
        safeImport('./views/gear/index.js'),
        safeImport('./views/zones/index.js'),
        safeImport('./views/ftp/index.js'),
        safeImport('./views/roadmap/index.js')
    ]);

    // Extract functions with fallbacks
    const Parser = parserMod?.Parser || { parseTrainingLog: (d) => d, getSection: () => "" };
    const renderDashboard = dashMod?.renderDashboard || (() => "Dashboard loading...");
    const renderTrends = trendsMod?.renderTrends || (() => ({ html: "Trends module missing" }));
    const renderGear = gearMod?.renderGear || (() => "Gear module missing");
    const updateGearResult = gearMod?.updateGearResult || (() => {});
    const renderZones = zonesMod?.renderZones || (() => "Zones module missing");
    const renderFTP = ftpMod?.renderFTP || (() => "FTP module missing");
    const renderRoadmap = roadmapMod?.renderRoadmap || (() => "Roadmap module missing");

    // --- 2. APP STATE ---
    const App = {
        planMd: "",
        rawLogData: [],   // For Dashboard (Raw JSON)
        parsedLogData: [], // For Trends/Logbook (Processed via Parser.js)
        plannedData: [],
        gearData: "",
        garminData: [],

        async init() {
            await this.loadData();
            this.setupNavigation();
            
            // Check URL/LocalStorage for current view, default to dashboard
            const savedView = localStorage.getItem('currentView') || 'dashboard';
            this.renderCurrentView(savedView);
        },

        async loadData() {
            try {
                console.log("📡 Fetching Data Suite...");
                const [planRes, logRes, plannedRes, gearRes, garminRes] = await Promise.all([
                    fetch('./endurance_plan.md'),
                    fetch('./data/training_log.json'),
                    fetch('./data/planned.json'),
                    fetch('./js/views/gear/Gear.md'),
                    fetch('./data/my_garmin_data_ALL.json') // Legacy support
                ]);

                // Text Data
                this.planMd = await planRes.text();
                this.gearData = await gearRes.text();

                // JSON Data
                this.rawLogData = await logRes.json();
                this.plannedData = await plannedRes.json();
                this.garminData = await garminRes.json();

                // Process Log for Legacy Views (Trends, etc.)
                // This maintains compatibility with your older code
                this.parsedLogData = Parser.parseTrainingLog(this.rawLogData);

                console.log("✅ Data Loaded:", {
                    logItems: this.rawLogData.length,
                    plannedItems: this.plannedData.length
                });

            } catch (err) {
                console.error("❌ Critical Data Load Error:", err);
                document.getElementById('main-content').innerHTML = `
                    <div class="p-8 text-center">
                        <div class="inline-block bg-red-900/20 border border-red-500/50 p-6 rounded-lg">
                            <h2 class="text-xl font-bold text-red-400 mb-2">Data Loading Failed</h2>
                            <p class="text-sm text-slate-300">${err.message}</p>
                        </div>
                    </div>`;
            }
        },

        setupNavigation() {
            // Mobile Menu Logic
            const menuBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');

            if (menuBtn) {
                menuBtn.addEventListener('click', () => {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                });
                overlay.addEventListener('click', () => {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                });
            }

            // Tab Clicking Logic
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update Active State
                    document.querySelectorAll('.nav-item').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                        b.classList.add('text-slate-400', 'border-transparent');
                    });
                    e.currentTarget.classList.remove('text-slate-400', 'border-transparent');
                    e.currentTarget.classList.add('bg-slate-800', 'text-white', 'border-slate-600');

                    // Route
                    const view = e.currentTarget.dataset.view;
                    localStorage.setItem('currentView', view);
                    this.renderCurrentView(view);

                    // Close mobile menu on click
                    if (window.innerWidth < 1024 && sidebar) {
                        sidebar.classList.add('-translate-x-full');
                        overlay.classList.add('hidden');
                    }
                });
            });
        },

        // Helper: Stats Bar for Trends/Logbook views
        getStatsBar() {
            const totalMins = this.rawLogData.reduce((acc, d) => acc + (parseFloat(d.actualDuration) || 0), 0);
            const totalHrs = Math.floor(totalMins / 60);
            return `
                <div class="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center mb-6 rounded-lg">
                    <span class="text-slate-400 text-xs uppercase tracking-widest font-bold">Logbook</span>
                    <div class="flex gap-4">
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${this.rawLogData.length}</strong> Activities</span>
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${totalHrs}</strong> Hours</span>
                    </div>
                </div>
            `;
        },

        renderCurrentView(view) {
            const content = document.getElementById('main-content');
            
            // Fade out
            content.classList.add('opacity-0');
            
            setTimeout(() => {
                content.innerHTML = '';
                
                try {
                    switch (view) {
                        case 'dashboard':
                            // NEW: Pass Raw JSON + Plan MD
                            content.innerHTML = renderDashboard(this.plannedData, this.rawLogData, this.planMd);
                            break;

                        case 'trends':
                            // OLD: Uses Parsed Data & Stats Bar
                            content.innerHTML = this.getStatsBar();
                            const trendsResult = renderTrends(this.parsedLogData);
                            content.insertAdjacentHTML('beforeend', trendsResult.html);
                            if (trendsResult.afterRender) trendsResult.afterRender();
                            break;

                        case 'gear':
                            content.innerHTML = renderGear(this.gearData);
                            updateGearResult(this.gearData);
                            break;

                        case 'zones':
                            content.innerHTML = renderZones(this.garminData);
                            break;

                        case 'ftp':
                            content.innerHTML = renderFTP(this.garminData);
                            break;

                        case 'roadmap':
                            content.innerHTML = renderRoadmap(this.garminData, this.planMd);
                            break;

                        case 'plan':
                            // Simple Markdown Render
                            const mdContent = Parser.getSection(this.planMd, "Weekly Schedule") || "No plan found.";
                            const safeMarked = window.marked ? window.marked.parse : (t) => t;
                            content.innerHTML = `<div class="markdown-body p-6 bg-slate-900 rounded-xl border border-slate-700">${safeMarked(mdContent)}</div>`;
                            break;

                        default:
                            content.innerHTML = `<div class="p-10 text-center text-slate-500">View not found: ${view}</div>`;
                    }
                } catch (e) {
                    console.error("Render Error:", e);
                    content.innerHTML = `<div class="p-10 text-red-500">Error loading view: ${e.message}</div>`;
                }

                // Fade in
                content.classList.remove('opacity-0');
                
                // Update Sidebar Active State (Visual Sync)
                document.querySelectorAll('.nav-item').forEach(b => {
                    b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                    b.classList.add('text-slate-400', 'border-transparent');
                    if (b.dataset.view === view) {
                        b.classList.remove('text-slate-400', 'border-transparent');
                        b.classList.add('bg-slate-800', 'text-white', 'border-slate-600');
                    }
                });

            }, 150);
        }
    };

    window.App = App;
    App.init();

})();

// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Debug Mode)...");
    const cacheBuster = Date.now();
    
    // --- 1. ROBUST IMPORTER ---
    const safeImport = async (path, name) => {
        try {
            console.log(`⏳ Loading module: ${name} (${path})...`);
            const module = await import(`${path}?t=${cacheBuster}`);
            console.log(`✅ Success: ${name}`);
            return module;
        } catch (e) {
            console.error(`❌ FAILURE LOADING ${name}:`);
            console.error(`   File: ${path}`);
            console.error(`   Error: ${e.message}`);
            if (e.stack) console.error(e.stack);
            return null;
        }
    };

    // Load all view modules with explicit names for debugging
    const [
        parserMod, dashMod, trendsMod, gearMod, zonesMod, ftpMod, roadmapMod, 
        metricsMod, readinessMod 
    ] = await Promise.all([
        safeImport('./parser.js', 'Parser'),
        safeImport('./views/dashboard/index.js', 'Dashboard'),
        safeImport('./views/trends/index.js', 'Trends'),
        safeImport('./views/gear/index.js', 'Gear'),
        safeImport('./views/zones/index.js', 'Zones'),
        safeImport('./views/ftp/index.js', 'FTP'),
        safeImport('./views/roadmap/index.js', 'Roadmap'),
        safeImport('./views/metrics/index.js', 'Metrics'),
        safeImport('./views/readiness/index.js', 'Readiness')
    ]);

    // Extract functions with detailed fallback messages
    const Parser = parserMod?.Parser || { parseTrainingLog: (d) => d, getSection: () => "" };
    const renderDashboard = dashMod?.renderDashboard || (() => "<p class='text-red-500'>Error: Dashboard module failed to load. Check console.</p>");
    const renderTrends = trendsMod?.renderTrends || (() => ({ html: "<p class='text-red-500'>Trends module failed.</p>" }));
    const renderGear = gearMod?.renderGear || (() => "<p class='text-red-500'>Gear module failed.</p>");
    const updateGearResult = gearMod?.updateGearResult || (() => {});
    const renderZones = zonesMod?.renderZones || (() => "<p class='text-red-500'>Zones module failed.</p>");
    const renderFTP = ftpMod?.renderFTP || (() => "<p class='text-red-500'>FTP module failed.</p>");
    const renderRoadmap = roadmapMod?.renderRoadmap || (() => "<p class='text-red-500'>Roadmap module failed.</p>");
    
    // METRICS DEBUG FALLBACK
    const renderMetrics = metricsMod?.renderMetrics || ((data) => {
        console.error("Attempted to render metrics, but module is missing.");
        return `
            <div class="p-10 text-center border border-red-500/30 rounded-xl bg-red-500/10">
                <h2 class="text-xl font-bold text-red-400 mb-2"><i class="fa-solid fa-bug"></i> Metrics Module Failed</h2>
                <p class="text-sm text-red-300">The module could not be loaded. Open your browser console (F12) to see the specific syntax error.</p>
            </div>`;
    });

    const renderReadiness = readinessMod?.renderReadiness || (() => "<p class='text-red-500'>Readiness module failed.</p>");

    // --- 2. APP STATE ---
    const App = {
        planMd: "",
        rawLogData: [],
        parsedLogData: [],
        plannedData: [],
        gearData: "",
        garminData: [],

        async init() {
            await this.loadData();
            this.setupNavigation();
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
                    fetch('./data/my_garmin_data_ALL.json')
                ]);

                this.planMd = await planRes.text();
                this.gearData = await gearRes.text();
                this.rawLogData = await logRes.json();
                this.plannedData = await plannedRes.json();
                this.garminData = await garminRes.json();

                this.parsedLogData = Parser.parseTrainingLog(this.rawLogData);
                console.log(`✅ Data Loaded: ${this.rawLogData.length} logs found.`);

            } catch (err) {
                console.error("❌ Data Load Error:", err);
            }
        },

        setupNavigation() {
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

            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.nav-item').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                        b.classList.add('text-slate-400', 'border-transparent');
                    });
                    e.currentTarget.classList.remove('text-slate-400', 'border-transparent');
                    e.currentTarget.classList.add('bg-slate-800', 'text-white', 'border-slate-600');

                    const view = e.currentTarget.dataset.view;
                    localStorage.setItem('currentView', view);
                    this.renderCurrentView(view);

                    if (window.innerWidth < 1024 && sidebar) {
                        sidebar.classList.add('-translate-x-full');
                        overlay.classList.add('hidden');
                    }
                });
            });
        },

        renderCurrentView(view) {
            console.log(`👀 Rendering View: ${view}`);
            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(() => {
                content.innerHTML = '';
                try {
                    switch (view) {
                        case 'dashboard':
                            content.innerHTML = renderDashboard(this.plannedData, this.rawLogData, this.planMd);
                            break;
                        case 'trends':
                            content.innerHTML = renderTrends(this.parsedLogData).html;
                            break;
                        case 'metrics':
                            console.log("📊 Rendering Metrics...");
                            content.innerHTML = renderMetrics(this.rawLogData); 
                            break;
                        case 'readiness':
                            content.innerHTML = renderReadiness(this.garminData);
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
                            const md = Parser.getSection(this.planMd, "Weekly Schedule") || "No plan found.";
                            content.innerHTML = `<div class="markdown-body p-6 bg-slate-900 rounded-xl border border-slate-700">${window.marked.parse(md)}</div>`;
                            break;
                        default:
                            content.innerHTML = `<div class="p-10 text-center text-slate-500">View not found: ${view}</div>`;
                    }
                } catch (e) {
                    console.error(`💥 Render Error in ${view}:`, e);
                    content.innerHTML = `<div class="p-10 text-red-500">
                        <h3 class="font-bold">Render Error</h3>
                        <pre class="text-xs mt-2">${e.message}</pre>
                    </div>`;
                }
                content.classList.remove('opacity-0');
                
                document.querySelectorAll('.nav-item').forEach(b => {
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

// js/app.js

(async function initApp() {
    console.log("🚀 Booting App...");
    const cacheBuster = Date.now();
    
    // --- 1. IMPORTS ---
    const safeImport = async (path, name) => {
        try { return await import(`${path}?t=${cacheBuster}`); } 
        catch (e) { console.error(`❌ Failed to load ${name}:`, e.message); return null; }
    };

    const [
        parserMod, dashMod, trendsMod, gearMod, zonesMod, ftpMod, roadmapMod, 
        metricsMod, readinessMod 
    ] = await Promise.all([
        safeImport('./parser.js', 'Parser'),
        safeImport('./views/dashboard/index.js', 'Dashboard'),
        safeImport('./views/trends/index.js', 'Trends'),
        safeImport('./views/gear/index.js', 'Gear'),
        safeImport('./views/zones/index.js', 'Zones'), // This loads your js/views/zones/index.js
        safeImport('./views/ftp/index.js', 'FTP'),
        safeImport('./views/roadmap/index.js', 'Roadmap'),
        safeImport('./views/metrics/index.js', 'Metrics'),
        safeImport('./views/readiness/index.js', 'Readiness')
    ]);

    const Parser = parserMod?.Parser || { parseTrainingLog: (d) => d, getSection: () => "" };
    const renderDashboard = dashMod?.renderDashboard || (() => "Dashboard loading...");
    const renderTrends = trendsMod?.renderTrends || (() => ({ html: "Trends missing" }));
    
    const renderGear = gearMod?.renderGear || (() => "Gear missing");
    const updateGearResult = gearMod?.updateGearResult || (() => {});

    // --- UPDATED: Use renderZonesTab instead of renderZones ---
    const renderZonesTab = zonesMod?.renderZonesTab || (() => "Zones missing");
    
    const renderFTP = ftpMod?.renderFTP || (() => "FTP missing");
    const renderRoadmap = roadmapMod?.renderRoadmap || (() => "Roadmap missing");
    const renderMetrics = metricsMod?.renderMetrics || (() => "Metrics missing");
    const renderReadiness = readinessMod?.renderReadiness || (() => "Readiness missing");

    // ... (App State and loadData remain exactly as they were) ...

    const App = {
        // ... (Existing App properties) ...
        
        renderCurrentView(view) {
            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(async () => { // Added async here for the await call below
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
                            content.innerHTML = renderMetrics(this.rawLogData); 
                            break;
                        case 'readiness':
                            content.innerHTML = renderReadiness(this.readinessData);
                            break;
                        case 'ftp':
                            content.innerHTML = renderFTP(this.profileData); 
                            break;
                        case 'gear':
                            content.innerHTML = renderGear(this.gearData);
                            this.updateGearResult();
                            break;
                        
                        // --- UPDATED CASE FOR ZONES ---
                        case 'zones':
                            // Call the new async function. No need to pass garminData anymore
                            // as the component now fetches its own zones.json
                            content.innerHTML = await renderZonesTab();
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
                    console.error(`Render Error in ${view}:`, e);
                    content.innerHTML = `<div class="p-10 text-red-500">Render Error: ${e.message}</div>`;
                }
                content.classList.remove('opacity-0');
                
                // ... (Rest of the rendering logic remains the same) ...
            }, 150);
        }
    };

    window.App = App;
    App.init();
})();

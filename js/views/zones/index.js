import { Parser } from '../../parser.js';

const parseZoneTables = (planMd) => {
    const section = Parser.getSection(planMd, "Training Parameters") || Parser.getSection(planMd, "Zones");
    let current = '', categories = {};
    
    if (!section) return { cycling: `<p class="text-slate-500">No data</p>`, running: '' };
    
    section.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
            current = trimmed.replace(/###/g, '').split('(')[0].trim();
            categories[current] = [];
        } else if (current && trimmed.includes(':')) {
            const [labelRaw, range] = trimmed.replace(/[\*\-\+]/g, '').split(':');
            const label = labelRaw.trim();
            
            let zClass = 'z-1';
            const cleanLabel = label.toLowerCase();
            if (cleanLabel.includes('sweet spot') || cleanLabel.includes('sweetspot')) zClass = 'z-ss';
            else {
                const zMatch = cleanLabel.match(/zone (\d)/);
                if (zMatch) zClass = `z-${zMatch[1]}`;
            }

            categories[current].push(`
                <div class="zone-row ${zClass}">
                    <span class="font-bold">${label}</span>
                    <span class="font-mono text-slate-400">${range ? range.trim() : '--'}</span>
                </div>
            `);
        }
    });
    
    let cyclingHtml = '';
    let runningHtml = '';

    Object.keys(categories).forEach(k => {
        const cardHtml = `
            <div class="zone-card">
                <div class="zone-card-title">${k}</div>
                ${categories[k].join('')}
            </div>
        `;
        
        const lowerKey = k.toLowerCase();
        if (lowerKey.includes('cycling') || (lowerKey.includes('power') && !lowerKey.includes('running'))) {
            cyclingHtml += cardHtml;
        } else {
            runningHtml += cardHtml;
        }
    });

    return { cycling: cyclingHtml, running: runningHtml };
};

export function renderZones(planMd) {
    const zones = parseZoneTables(planMd);

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="flex flex-col gap-4">
                ${zones.cycling}
            </div>
            <div class="flex flex-col gap-4">
                ${zones.running}
            </div>
        </div>
    `;
}

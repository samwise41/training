import { FuelComponents } from './components.js';
import { FuelTemplates } from './templates.js';

export const FuelView = {
    // Proxy component methods used by Timer.js
    formatTime: FuelComponents.formatTime,
    renderHistoryLog: FuelComponents.renderHistoryLog,
    renderFuelButtons: FuelComponents.renderFuelButtons,
    renderFuelEditor: FuelComponents.renderFuelEditor,

    // Helper to draw lines
    renderMarkers(count) {
        let html = '';
        for (let i = 1; i < count; i++) {
            const pct = (i / count) * 100;
            html += `<div class="absolute w-full h-[1px] bg-white/30" style="top: ${pct}%"></div>`;
        }
        return html;
    },

    getHtml(state) {
        // Prepare dynamic elements
        const bottleLines = this.renderMarkers(state.sipsPerBottle);
        const flaskLines = this.renderMarkers(state.squeezesPerFlask);
        const menuHtml = FuelComponents.renderFuelButtons(state.fuelMenu);

        // Concatenate Templates
        return `
            <div class="p-2 max-w-5xl mx-auto pb-48 relative">
                ${FuelTemplates.header(state, FuelComponents.formatTime)}
                ${FuelTemplates.inventory(bottleLines, flaskLines)}
                ${FuelTemplates.progress()}
                ${FuelTemplates.controls(menuHtml)}
                ${FuelTemplates.settings(state)}
                ${FuelTemplates.footer()}
            </div>
        `;
    }
};

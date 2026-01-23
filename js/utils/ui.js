// js/utils/ui.js

export const UI = {
    // 1. Standard HTML Builder
    buildCollapsibleSection(id, title, contentHtml, isOpen = true) {
        const contentClasses = isOpen 
            ? "max-h-[5000px] opacity-100 py-4 mb-8" 
            : "max-h-0 opacity-0 py-0 mb-0";
        const iconClasses = isOpen ? "rotate-0" : "-rotate-90";

        // Global handler call: window.UI.toggleSection
        return `
            <div class="w-full">
                <div class="flex items-center gap-2 cursor-pointer py-3 border-b-2 border-slate-700 hover:border-slate-500 transition-colors group select-none" 
                     onclick="window.UI.toggleSection('${id}')">
                    <i class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${iconClasses}"></i>
                    <h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2>
                </div>
                <div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClasses}">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    // 2. Event Handler
    toggleSection(id) {
        const content = document.getElementById(id);
        if (!content) return;
        const header = content.previousElementSibling;
        const icon = header.querySelector('i.fa-caret-down');

        const isCollapsed = content.classList.contains('max-h-0');

        if (isCollapsed) {
            content.classList.remove('max-h-0', 'opacity-0', 'py-0', 'mb-0');
            content.classList.add('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8'); 
            if (icon) {
                icon.classList.add('rotate-0');
                icon.classList.remove('-rotate-90');
            }
        } else {
            content.classList.add('max-h-0', 'opacity-0', 'py-0', 'mb-0');
            content.classList.remove('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8');
            if (icon) {
                icon.classList.remove('rotate-0');
                icon.classList.add('-rotate-90');
            }
        }
    },

    // 3. Initialization
    init() {
        window.UI = this;
    }
};

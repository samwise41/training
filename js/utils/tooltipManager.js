// js/utils/tooltipManager.js

export const TooltipManager = {
    tooltipEl: null,
    activeTarget: null,

    init() {
        // 1. Create the tooltip element if it doesn't exist
        // We use 'global-tooltip' to avoid conflicts with any manual 'app-tooltip'
        if (!document.getElementById('global-tooltip')) {
            const el = document.createElement('div');
            el.id = 'global-tooltip';
            // pointer-events-none ensures the tooltip doesn't block mouse clicks while fading out
            // Added font-mono to ensure consistent font across all tooltips as requested
            el.className = 'fixed z-50 pointer-events-none opacity-0 transition-opacity duration-50 bg-slate-900 text-slate-200 text-xs font-mono rounded-lg shadow-xl border border-slate-700 p-3 max-w-xs';
            document.body.appendChild(el);
            this.tooltipEl = el;
        } else {
            this.tooltipEl = document.getElementById('global-tooltip');
        }

        // 2. Global Event Listeners to HIDE tooltip
        // 'true' (useCapture) is critical: it detects scroll on ANY element (charts, grids, etc)
        window.addEventListener('scroll', () => this.hide(), true);
        window.addEventListener('resize', () => this.hide());
        
        // Hide if clicking anywhere else
        document.addEventListener('click', (e) => {
            if (this.activeTarget && !this.activeTarget.contains(e.target)) {
                this.hide();
            }
        });
        
        // Hide on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
    },

    show(targetEl, htmlContent, event) {
        if (!this.tooltipEl) this.init();

        // --- Feature Preserved from your old code: Toggle ---
        // If clicking the same element that is already open, close it.
        if (this.activeTarget === targetEl) {
            this.hide();
            return;
        }

        this.activeTarget = targetEl;
        this.tooltipEl.innerHTML = htmlContent;
        this.tooltipEl.style.opacity = '1';

        // --- Smart Positioning (Top/Bottom preferred for Charts) ---
        const rect = targetEl.getBoundingClientRect();
        const tipRect = this.tooltipEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default: Center Top
        let top = rect.top - tipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tipRect.width / 2);

        // 1. Ceiling Check: If it hits top of screen, flip to Bottom
        if (top < 10) {
            top = rect.bottom + 10;
        }

        // 2. Floor Check: If flipping to bottom hits bottom of screen, force it inside
        if (top + tipRect.height > viewportHeight - 10) {
            top = viewportHeight - tipRect.height - 10;
        }

        // 3. Right Wall Check: If it goes off right edge, shift left
        if (left + tipRect.width > viewportWidth - 10) {
            left = viewportWidth - tipRect.width - 10;
        }

        // 4. Left Wall Check: If it goes off left edge, shift right
        if (left < 10) {
            left = 10;
        }

        this.tooltipEl.style.top = `${top}px`;
        this.tooltipEl.style.left = `${left}px`;
    },

    // --- Feature Added: Required by Metrics Tab ---
    showModal(htmlContent) {
        const modalId = 'global-info-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono';
            // Click background to close
            modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onclick="document.getElementById('${modalId}').remove()" class="absolute top-3 right-3 text-slate-400 hover:text-white">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                <div class="mt-2 text-sm text-slate-300 leading-relaxed">${htmlContent}</div>
            </div>
        `;
    },

    hide() {
        if (this.tooltipEl) {
            this.tooltipEl.style.opacity = '0';
            this.activeTarget = null;
            
            // Move off-screen after transition to ensure it doesn't block clicks
            setTimeout(() => {
                if (this.tooltipEl.style.opacity === '0') {
                    this.tooltipEl.style.top = '-9999px';
                }
            }, 150);
        }
    }
};

// --- CRITICAL: Expose globally so inline HTML (onclick="...") can find it ---
window.TooltipManager = TooltipManager;

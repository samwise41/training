// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',
    _isInit: false,

    show(triggerElement, contentHtml, evt) {
        // 1. Toggle: If clicking the active element, close it.
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        // 2. Close any existing tooltip
        this.close();

        // 3. Set Active
        this.activeElement = triggerElement;
        
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        // 4. Content & Visibility
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');

        // 5. Position
        this.updatePosition(triggerElement, tooltip);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'pointer-events-none');
            // Allow pointer events to pass through immediately
            tooltip.classList.remove('pointer-events-auto');
        }
        this.activeElement = null;
    },

    updatePosition(trigger, tooltip) {
        if (!trigger || !trigger.isConnected) {
            this.close();
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        
        const margin = 12; 
        const edgePadding = 40; // 40px Buffer from screen edge

        // --- Vertical ---
        // Center vertically by default
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);

        // Check Bottom
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            top = window.innerHeight - ttRect.height - edgePadding;
        }
        // Check Top
        if (top < edgePadding) {
            top = edgePadding;
        }

        // --- Horizontal ---
        // Right by default
        let left = rect.right + margin;

        // Flip to Left if overflowing Right
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            left = rect.left - ttRect.width - margin;
        }

        // Mobile Fallback: If overflowing Left now
        if (left < edgePadding) {
            left = edgePadding;
            // Move Below
            top = rect.bottom + margin;
            // Check Bottom again
            if (top + ttRect.height > window.innerHeight - edgePadding) {
                top = rect.top - ttRect.height - margin; // Move Above
            }
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    initGlobalListener() {
        if (this._isInit) return;
        this._isInit = true;

        // A. Dismiss on Click (Mousedown is more reliable for UI dismissal)
        document.addEventListener('mousedown', (e) => {
            if (!this.activeElement) return;

            // 1. Allow clicking inside the tooltip (text selection, links)
            if (e.target.closest(`#${this.containerId}`)) return;

            // 2. Allow clicking the trigger itself (handled by show() toggle)
            if (this.activeElement.contains(e.target)) return;

            // 3. Otherwise, close it
            this.close();
        });

        // B. Dismiss on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        // C. Dismiss on Window Resize
        window.addEventListener('resize', () => {
            if (this.activeElement) this.close();
        });

        // D. Dismiss on Navigation (Fixes page-to-page persistence)
        window.addEventListener('hashchange', () => {
            this.close();
        });
    }
};

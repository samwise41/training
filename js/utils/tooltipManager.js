// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',

    // Pre-bound event handlers to allow add/remove
    _handleDocClick: null,
    _handleResize: null,
    _handleHash: null,

    init() {
        if (this._handleDocClick) return; // Already init

        // 1. The "Click Anywhere" Handler
        this._handleDocClick = (e) => {
            const container = document.getElementById(this.containerId);
            
            // Allow interaction INSIDE the tooltip
            if (container && container.contains(e.target)) return;

            // If clicking the active trigger again, do nothing here.
            // The trigger's own click handler (e.g. handleVolumeClick) will run 
            // and see that 'activeElement === trigger', causing it to call .close().
            // If we close it here first, the trigger handler might think it's closed and re-open it.
            if (this.activeElement && this.activeElement.contains(e.target)) return;

            // Otherwise (clicking whitespace or another element), close.
            this.close();
        };

        this._handleResize = () => this.close();
        this._handleHash = () => this.close();
    },

    show(triggerElement, contentHtml) {
        this.init(); // Ensure handlers are created

        // 1. Toggle Logic
        // If clicking the currently active element, close it.
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        // 2. Force Close any existing tooltip
        if (this.activeElement) {
            this.close();
        }

        // 3. Set Active
        this.activeElement = triggerElement;
        
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        // 4. Render & Position
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');
        
        this.updatePosition(triggerElement, tooltip);

        // 5. DEFERRED LISTENER ATTACHMENT (The Fix)
        // We wait 0ms to let the current click event bubble up and vanish.
        // Then we attach the "Close" listener.
        setTimeout(() => {
            if (this.activeElement === triggerElement) {
                // Use 'pointerdown' for immediate response on touch/mouse
                document.addEventListener('pointerdown', this._handleDocClick);
                window.addEventListener('resize', this._handleResize);
                window.addEventListener('hashchange', this._handleHash);
            }
        }, 0);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'pointer-events-none');
            tooltip.classList.remove('pointer-events-auto');
        }
        
        this.activeElement = null;

        // 6. CLEANUP
        // Remove listeners immediately so they don't fire for other interactions
        if (this._handleDocClick) {
            document.removeEventListener('pointerdown', this._handleDocClick);
            window.removeEventListener('resize', this._handleResize);
            window.removeEventListener('hashchange', this._handleHash);
        }
    },

    updatePosition(trigger, tooltip) {
        if (!trigger || !trigger.isConnected) {
            this.close();
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        
        const margin = 12;      
        const edgePadding = 20; // Keep tooltip away from screen edge

        // --- Vertical ---
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);

        // Check Bottom Edge
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            top = window.innerHeight - ttRect.height - edgePadding;
        }
        // Check Top Edge
        if (top < edgePadding) {
            top = edgePadding;
        }

        // --- Horizontal ---
        let left = rect.right + margin;

        // Flip to Left if overflowing Right
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            left = rect.left - ttRect.width - margin;
        }

        // Mobile Fallback: If overflowing Left now
        if (left < edgePadding) {
            // Pin to left safety edge
            left = edgePadding;
            // Move BELOW the element
            top = rect.bottom + margin;
            
            // Check Bottom again
            if (top + ttRect.height > window.innerHeight - edgePadding) {
                // If no room below, move ABOVE
                top = rect.top - ttRect.height - margin; 
            }
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }
};

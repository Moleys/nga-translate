// Shared Utility Functions for NGA Forums Application
const Utils = {
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Convert timestamp to human-readable "time ago" format
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted time ago string
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }

        return new Date(timestamp).toLocaleDateString();
    },

    /**
     * Generate inline style from NGA titlefont_api
     * @param {Object} titlefont_api - Title font styling from API
     * @returns {string} Inline style string
     */
    getTitleStyle(titlefont_api) {
        if (!titlefont_api) return '';

        const styles = [];

        if (titlefont_api.color) {
            styles.push(`color: ${titlefont_api.color} !important`);
        }
        if (titlefont_api.bold) {
            styles.push('font-weight: bold');
        }
        if (titlefont_api.italic) {
            styles.push('font-style: italic');
        }
        if (titlefont_api.underline) {
            styles.push('text-decoration: underline');
        }

        return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
    },

    /**
     * Validate and sanitize CSS color value
     * @param {string} color - Color value from user input
     * @returns {string} Safe color or 'inherit'
     */
    sanitizeColor(color) {
        if (!color) return 'inherit';

        // Allow: hex colors, rgb/rgba, hsl/hsla, named colors
        const COLOR_REGEX = /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|[a-z]+)$/i;

        return COLOR_REGEX.test(color.trim()) ? color.trim() : 'inherit';
    },

    /**
     * Validate and sanitize CSS size value
     * @param {string} size - Size value from user input
     * @returns {string} Safe size or '1em'
     */
    sanitizeSize(size) {
        if (!size) return '1em';

        // Allow: px, em, rem, %, pt
        const SIZE_REGEX = /^\d+(\.\d+)?(px|em|rem|%|pt)$/i;

        return SIZE_REGEX.test(size.trim()) ? size.trim() : '1em';
    },

    /**
     * Validate and sanitize CSS text-align value
     * @param {string} align - Align value from user input
     * @returns {string} Safe align or 'left'
     */
    sanitizeAlign(align) {
        if (!align) return 'left';

        const VALID_ALIGNS = ['left', 'center', 'right', 'justify'];

        return VALID_ALIGNS.includes(align.toLowerCase()) ? align.toLowerCase() : 'left';
    }
};

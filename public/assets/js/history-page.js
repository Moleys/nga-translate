// History Page - Display thread reading history
const HistoryPage = {
    history: [],

    init() {
        // Load history from localStorage
        this.loadHistory();

        // Render history
        this.renderHistory();

        // Setup clear button
        this.setupClearButton();
    },

    loadHistory() {
        const stored = localStorage.getItem('nga_thread_history');
        this.history = stored ? JSON.parse(stored) : [];
    },

    saveHistory() {
        localStorage.setItem('nga_thread_history', JSON.stringify(this.history));
    },

    clearHistory() {
        if (confirm('Are you sure you want to clear all reading history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    },

    setupClearButton() {
        const btn = document.getElementById('clear-history-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
    },

    renderHistory() {
        const container = document.getElementById('thread-history-list');
        const emptyState = document.getElementById('empty-history-state');
        const countElem = document.getElementById('history-count');

        if (!container || !emptyState) return;

        // Update count
        if (countElem) {
            countElem.textContent = this.history.length === 1
                ? '1 thread'
                : `${this.history.length} threads`;
        }

        if (this.history.length === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="list-group">';

        this.history.forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);
            const fullDate = new Date(thread.timestamp).toLocaleString();

            html += `
                <a href="/thread/${this.escapeHtml(thread.tid)}" class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 flex-grow-1">${this.escapeHtml(thread.subject)}</h5>
                                <span class="badge bg-secondary ms-2">#${index + 1}</span>
                            </div>
                            <p class="mb-1 text-muted">
                                <i class="bi bi-person-fill"></i> ${this.escapeHtml(thread.author)}
                                ${thread.forumName ? `<span class="mx-2">•</span><i class="bi bi-folder-fill"></i> ${this.escapeHtml(thread.forumName)}` : ''}
                            </p>
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> ${timeAgo}
                                <span class="mx-2">•</span>
                                <span title="${fullDate}">${fullDate}</span>
                            </small>
                        </div>
                    </div>
                </a>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

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
        if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;

        return new Date(timestamp).toLocaleDateString();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize history page
document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('thread-history-list');
    if (historyList) {
        HistoryPage.init();
    }
});

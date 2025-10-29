// Favorites Page - Display and manage favorite forums and thread history
const FavoritesPage = {
    favorites: [],
    history: [],

    init() {
        // Load favorites and history from localStorage
        this.loadFavorites();
        this.loadHistory();

        // Render favorites and history
        this.renderFavorites();
        this.renderHistory();
    },

    loadFavorites() {
        const stored = localStorage.getItem('nga_forum_favorites');
        this.favorites = stored ? JSON.parse(stored) : [];
    },

    saveFavorites() {
        localStorage.setItem('nga_forum_favorites', JSON.stringify(this.favorites));
    },

    loadHistory() {
        const stored = localStorage.getItem('nga_thread_history');
        this.history = stored ? JSON.parse(stored) : [];
    },

    moveUp(index) {
        if (index > 0) {
            // Swap with previous item
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index - 1];
            this.favorites[index - 1] = temp;

            this.saveFavorites();
            this.renderFavorites();
        }
    },

    moveDown(index) {
        if (index < this.favorites.length - 1) {
            // Swap with next item
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index + 1];
            this.favorites[index + 1] = temp;

            this.saveFavorites();
            this.renderFavorites();
        }
    },

    deleteFavorite(index) {
        // Remove favorite at index
        this.favorites.splice(index, 1);

        this.saveFavorites();
        this.renderFavorites();
    },

    renderFavorites() {
        const container = document.getElementById('favorite-forums');
        const emptyState = document.getElementById('empty-state');

        if (!container || !emptyState) return;

        if (this.favorites.length === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="row g-3">';

        this.favorites.forEach((forum, index) => {
            const isFirst = index === 0;
            const isLast = index === this.favorites.length - 1;

            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body d-flex align-items-start">
                            <img src="https://wsrv.nl/?url=${this.escapeHtml(forum.avatar)}"
                                 alt="${this.escapeHtml(forum.name)}"
                                 class="forum-avatar me-3"
                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23ddd%22 width=%2250%22 height=%2250%22/%3E%3C/svg%3E'">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">
                                    <a href="/forum/${this.escapeHtml(forum.fid)}" class="text-decoration-none text-dark fw-bold">
                                        ${this.escapeHtml(forum.name)}
                                    </a>
                                </h6>
                                <small class="text-muted d-block mb-2">${this.escapeHtml(forum.subject)}</small>
                                <div class="btn-group btn-group-sm" role="group">
                                    <button class="btn btn-outline-secondary move-up-btn"
                                            data-index="${index}"
                                            ${isFirst ? 'disabled' : ''}
                                            title="Move up">
                                        <i class="bi bi-arrow-up"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary move-down-btn"
                                            data-index="${index}"
                                            ${isLast ? 'disabled' : ''}
                                            title="Move down">
                                        <i class="bi bi-arrow-down"></i>
                                    </button>
                                    <button class="btn btn-outline-danger delete-favorite-btn"
                                            data-index="${index}"
                                            title="Remove favorite">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;

        // Add event listeners for move up buttons
        container.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.moveUp(index);
            });
        });

        // Add event listeners for move down buttons
        container.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.moveDown(index);
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.deleteFavorite(index);
            });
        });
    },

    renderHistory() {
        const container = document.getElementById('thread-history');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-clock-history"></i> No thread history yet</div>';
            return;
        }

        let html = '<div class="list-group">';

        this.history.forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);

            html += `
                <a href="/thread/${this.escapeHtml(thread.tid)}" class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${this.escapeHtml(thread.subject)}</h6>
                            <small class="text-muted">
                                <i class="bi bi-person"></i> ${this.escapeHtml(thread.author)}
                                ${thread.forumName ? `<span class="mx-1">•</span><i class="bi bi-folder"></i> ${this.escapeHtml(thread.forumName)}` : ''}
                            </small>
                        </div>
                        <small class="text-muted ms-2">${timeAgo}</small>
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
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize favorites page
document.addEventListener('DOMContentLoaded', () => {
    const favoritesContainer = document.getElementById('favorite-forums');
    if (favoritesContainer) {
        FavoritesPage.init();
    }
});

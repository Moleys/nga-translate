// Forum Page - Display all forums with favorite functionality
const ForumPage = {
    favorites: [],

    init() {
        // Load favorites from localStorage
        this.loadFavorites();

        // Render all forums from forum-list.js
        this.renderForumList();
    },

    loadFavorites() {
        const stored = localStorage.getItem('nga_forum_favorites');
        this.favorites = stored ? JSON.parse(stored) : [];
    },

    saveFavorites() {
        localStorage.setItem('nga_forum_favorites', JSON.stringify(this.favorites));
    },

    isFavorited(fid) {
        return this.favorites.some(b => b.fid === fid);
    },

    toggleFavorite(forum) {
        const index = this.favorites.findIndex(b => b.fid === forum.fid);

        if (index >= 0) {
            // Remove favorite
            this.favorites.splice(index, 1);
        } else {
            // Add favorite
            this.favorites.push({
                fid: forum.fid,
                name: forum.name,
                subject: forum.subject,
                avatar: forum.avatar
            });
        }

        this.saveFavorites();
        this.renderForumList(); // Re-render to update favorite icons
    },

    renderForumList() {
        const container = document.getElementById('forum-categories');
        if (!container) return;

        if (typeof forumList === 'undefined' || forumList.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No forums available</div>';
            return;
        }

        let html = '';

        forumList.forEach(category => {
            html += `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="bi bi-folder2-open"></i> ${this.escapeHtml(category.category)}</h4>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
            `;

            category.forums.forEach(forum => {
                const isFavorited = this.isFavorited(forum.fid);
                const favoriteClass = isFavorited ? 'bi-star-fill text-warning' : 'bi-star';

                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="forum-item d-flex align-items-center p-3 border rounded hover-shadow">
                            <img src="https://wsrv.nl/?url=${forum.avatar}" alt="${this.escapeHtml(forum.name)}" class="forum-avatar me-3" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23ddd%22 width=%2250%22 height=%2250%22/%3E%3C/svg%3E'">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">
                                    <a href="/forum/${forum.fid}" class="text-decoration-none text-dark fw-bold">
                                        ${this.escapeHtml(forum.name)}
                                    </a>
                                </h6>
                                <small class="text-muted">${this.escapeHtml(forum.subject)}</small>
                            </div>
                            <button class="btn btn-link p-0 ms-2 favorite-btn"
                                    data-fid="${forum.fid}"
                                    data-name="${this.escapeHtml(forum.name)}"
                                    data-subject="${this.escapeHtml(forum.subject)}"
                                    data-avatar="${forum.avatar}"
                                    title="${isFavorited ? 'Remove favorite' : 'Add favorite'}">
                                <i class="bi ${favoriteClass} fs-5"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add event listeners for favorite buttons
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const forum = {
                    fid: btn.dataset.fid,
                    name: btn.dataset.name,
                    subject: btn.dataset.subject,
                    avatar: btn.dataset.avatar
                };
                this.toggleFavorite(forum);
            });
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize forum page
document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('forum-categories');
    if (categoriesContainer) {
        ForumPage.init();
    }
});

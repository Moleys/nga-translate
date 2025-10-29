// Bookmarks Page - Display bookmarked threads
const BookmarksPage = {
    bookmarks: [],

    init() {
        // Load bookmarks from localStorage
        this.loadBookmarks();

        // Render bookmarks
        this.renderBookmarks();

        // Setup clear button
        this.setupClearButton();
    },

    loadBookmarks() {
        const stored = localStorage.getItem('nga_thread_bookmarks');
        this.bookmarks = stored ? JSON.parse(stored) : [];
    },

    saveBookmarks() {
        localStorage.setItem('nga_thread_bookmarks', JSON.stringify(this.bookmarks));
    },

    clearBookmarks() {
        if (confirm('Are you sure you want to clear all bookmarks?')) {
            this.bookmarks = [];
            this.saveBookmarks();
            this.renderBookmarks();
        }
    },

    removeBookmark(tid) {
        const index = this.bookmarks.findIndex(b => b.tid === tid);
        if (index >= 0) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            this.renderBookmarks();
        }
    },

    setupClearButton() {
        const btn = document.getElementById('clear-bookmarks-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.clearBookmarks();
            });
        }
    },

    renderBookmarks() {
        const container = document.getElementById('thread-bookmarks-list');
        const emptyState = document.getElementById('empty-bookmarks-state');
        const countElem = document.getElementById('bookmarks-count');

        if (!container || !emptyState) return;

        // Update count
        if (countElem) {
            countElem.textContent = this.bookmarks.length === 1
                ? '1 thread'
                : `${this.bookmarks.length} threads`;
        }

        if (this.bookmarks.length === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="list-group">';

        this.bookmarks.forEach((bookmark, index) => {
            const timeAgo = this.getTimeAgo(bookmark.timestamp);
            const fullDate = new Date(bookmark.timestamp).toLocaleString();

            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <i class="bi bi-bookmark-fill text-warning me-2"></i>
                                <h5 class="mb-0 flex-grow-1">
                                    <a href="/thread/${this.escapeHtml(bookmark.tid)}" class="text-decoration-none text-dark">
                                        ${this.escapeHtml(bookmark.subject)}
                                    </a>
                                </h5>
                            </div>
                            <p class="mb-1 text-muted">
                                <i class="bi bi-person-fill"></i> ${this.escapeHtml(bookmark.author)}
                                ${bookmark.forumName ? `<span class="mx-2">•</span><i class="bi bi-folder-fill"></i> ${this.escapeHtml(bookmark.forumName)}` : ''}
                            </p>
                            <small class="text-muted">
                                <i class="bi bi-clock"></i> Bookmarked ${timeAgo}
                                <span class="mx-2">•</span>
                                <span title="${fullDate}">${fullDate}</span>
                            </small>
                        </div>
                        <div class="ms-3">
                            <button class="btn btn-outline-danger btn-sm remove-bookmark-btn"
                                    data-tid="${this.escapeHtml(bookmark.tid)}"
                                    title="Remove bookmark">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tid = btn.dataset.tid;
                if (confirm('Remove this bookmark?')) {
                    this.removeBookmark(tid);
                }
            });
        });
    },

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
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

// Initialize bookmarks page
document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('thread-bookmarks-list');
    if (bookmarksList) {
        BookmarksPage.init();
    }
});

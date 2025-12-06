// Bookmarks Page - Display bookmarked threads
const BookmarksPage = {
    bookmarks: [],

    init() {
        this.loadBookmarks();
        this.translateAndRenderBookmarks();
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
            this.translateAndRenderBookmarks();
        }
    },

    removeBookmark(tid) {
        const index = this.bookmarks.findIndex(b => b.tid === tid);
        if (index >= 0) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            this.translateAndRenderBookmarks();
        }
    },

    setupClearButton() {
        const btn = document.getElementById('clear-bookmarks-btn');
        if (btn) {
            btn.addEventListener('click', () => this.clearBookmarks());
        }
    },

    async translateAndRenderBookmarks() {
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderBookmarks(this.bookmarks);
            return;
        }

        if (this.bookmarks.length === 0) {
            this.renderBookmarks([]);
            return;
        }

        try {
            const translatedBookmarks = JSON.parse(JSON.stringify(this.bookmarks));
            let textsToTranslate = [];
            let textMap = [];

            translatedBookmarks.forEach((bookmark, idx) => {
                if (bookmark.subject) {
                    textMap.push({ type: 'subject', idx, index: textsToTranslate.length });
                    textsToTranslate.push(bookmark.subject);
                }
                if (bookmark.author) {
                    textMap.push({ type: 'author', idx, index: textsToTranslate.length });
                    textsToTranslate.push(bookmark.author);
                }
                if (bookmark.forumName) {
                    textMap.push({ type: 'forumName', idx, index: textsToTranslate.length });
                    textsToTranslate.push(bookmark.forumName);
                }
            });

            if (textsToTranslate.length === 0) {
                this.renderBookmarks(translatedBookmarks);
                return;
            }

            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            textMap.forEach(mapping => {
                const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                const formattedText = TranslationUtil.formatTranslatedText(translatedText);
                translatedBookmarks[mapping.idx][mapping.type] = formattedText;
            });

            this.renderBookmarks(translatedBookmarks);
        } catch (error) {
            console.error('[Bookmarks] Translation failed:', error);
            this.renderBookmarks(this.bookmarks);
        }
    },

    renderBookmarks(bookmarksToRender) {
        const container = document.getElementById('thread-bookmarks-list');
        const emptyState = document.getElementById('empty-bookmarks-state');
        const countElem = document.getElementById('bookmarks-count');

        if (!container || !emptyState) return;

        const bookmarkCount = this.bookmarks.length;

        if (countElem) {
            countElem.textContent = bookmarkCount === 1 ? '1 thread' : `${bookmarkCount} threads`;
        }

        if (bookmarkCount === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="space-y-3">';

        bookmarksToRender.forEach((bookmark, index) => {
            const timeAgo = this.getTimeAgo(bookmark.timestamp);
            const fullDate = new Date(bookmark.timestamp).toLocaleString();
            const titleStyle = Utils.getTitleStyle(bookmark.titlefont_api);

            html += `
                <div class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md animate-fade-in" style="animation-delay: ${index * 50}ms">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="fa-solid fa-bookmark text-amber-500"></i>
                                <a href="/thread/${Utils.escapeHtml(bookmark.tid)}" 
                                   class="text-lg font-semibold hover:underline line-clamp-2" ${titleStyle}>
                                    ${Utils.escapeHtml(bookmark.subject)}
                                </a>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span class="inline-flex items-center gap-1">
                                    <i class="fa-solid fa-user text-xs"></i>
                                    ${Utils.escapeHtml(bookmark.author)}
                                </span>
                                ${bookmark.forumName ? `
                                <span class="text-border">•</span>
                                <span class="inline-flex items-center gap-1">
                                    <i class="fa-solid fa-folder text-xs"></i>
                                    ${Utils.escapeHtml(bookmark.forumName)}
                                </span>` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <i class="fa-solid fa-clock"></i>
                                <span>Bookmarked ${timeAgo}</span>
                                <span class="text-border">•</span>
                                <span title="${fullDate}">${fullDate}</span>
                            </div>
                        </div>
                        <button class="remove-bookmark-btn inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 border border-input bg-background hover:bg-accent hover:text-destructive transition-colors"
                                data-tid="${Utils.escapeHtml(bookmark.tid)}"
                                title="Remove bookmark">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('thread-bookmarks-list');
    if (bookmarksList) {
        BookmarksPage.init();
    }
});

window.BookmarksPage = BookmarksPage;

export default BookmarksPage;

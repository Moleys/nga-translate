// Bookmarks Page - Display bookmarked threads with premium Tailwind UI
const BookmarksPage = {
    bookmarks: [],

    init() {
        // Load bookmarks from localStorage
        this.loadBookmarks();

        // Translate and render bookmarks
        this.translateAndRenderBookmarks();

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
            btn.addEventListener('click', () => {
                this.clearBookmarks();
            });
        }
    },

    async translateAndRenderBookmarks() {
        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderBookmarks(this.bookmarks);
            return;
        }

        if (this.bookmarks.length === 0) {
            this.renderBookmarks([]);
            return;
        }

        try {
            // Clone bookmarks to avoid modifying original raw data
            const translatedBookmarks = JSON.parse(JSON.stringify(this.bookmarks));

            // Collect all texts to translate
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

            // Translate all texts
            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            // Apply translations
            textMap.forEach(mapping => {
                const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                const formattedText = TranslationUtil.formatTranslatedText(translatedText);
                translatedBookmarks[mapping.idx][mapping.type] = formattedText;
            });

            // Render with translated data
            this.renderBookmarks(translatedBookmarks);
        } catch (error) {
            console.error('[Bookmarks] Translation failed:', error);
            // Fallback: render raw data
            this.renderBookmarks(this.bookmarks);
        }
    },

    renderBookmarks(bookmarksToRender) {
        const container = document.getElementById('thread-bookmarks-list');
        const emptyState = document.getElementById('empty-bookmarks-state');
        const countElem = document.getElementById('bookmarks-count');

        if (!container || !emptyState) return;

        // Use original bookmarks for count
        const bookmarkCount = this.bookmarks.length;

        // Update count
        if (countElem) {
            countElem.textContent = bookmarkCount === 1
                ? '1 thread'
                : `${bookmarkCount} threads`;
        }

        if (bookmarkCount === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="space-y-4">';

        bookmarksToRender.forEach((bookmark, index) => {
            const timeAgo = this.getTimeAgo(bookmark.timestamp);
            const fullDate = new Date(bookmark.timestamp).toLocaleString();

            // Get title styling from API
            const titleStyle = Utils.getTitleStyle(bookmark.titlefont_api);
            const titleClass = titleStyle ? '' : 'text-gray-800';

            html += `
                <div class="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 
                            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_0_20px_rgba(90,157,138,0.3)] 
                            transition-all duration-300 ease-out hover:-translate-y-1 p-5
                            border-l-4 border-l-amber-400"
                     style="animation: fadeIn 0.3s ease-out ${index * 50}ms both">
                    <div class="flex flex-wrap gap-4 items-start justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 
                                            flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                    <i class="fa-solid fa-bookmark"></i>
                                </div>
                                <h5 class="text-lg font-semibold ${titleClass} group-hover:text-[#5a9d8a] transition-colors truncate" ${titleStyle}>
                                    <a href="/thread/${Utils.escapeHtml(bookmark.tid)}" class="hover:underline decoration-2 underline-offset-2">
                                        ${Utils.escapeHtml(bookmark.subject)}
                                    </a>
                                </h5>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                    <i class="fa-solid fa-user text-xs"></i> ${Utils.escapeHtml(bookmark.author)}
                                </span>
                                ${bookmark.forumName ? `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8efed] text-[#5a9d8a]">
                                    <i class="fa-solid fa-folder text-xs"></i> ${Utils.escapeHtml(bookmark.forumName)}
                                </span>` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-xs text-gray-400">
                                <i class="fa-solid fa-clock"></i>
                                <span>Bookmarked ${timeAgo}</span>
                                <span class="text-gray-300">•</span>
                                <span title="${fullDate}">${fullDate}</span>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            <button class="remove-bookmark-btn p-2.5 rounded-xl text-gray-400 hover:text-red-500 
                                           hover:bg-red-50 transition-all duration-200"
                                    data-tid="${Utils.escapeHtml(bookmark.tid)}"
                                    title="Remove bookmark">
                                <i class="fa-solid fa-trash"></i>
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
    }
};

// Initialize bookmarks page
document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('thread-bookmarks-list');
    if (bookmarksList) {
        BookmarksPage.init();
    }
});

window.BookmarksPage = BookmarksPage;

export default BookmarksPage;

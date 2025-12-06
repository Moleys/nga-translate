// Favorites Page - Display and manage favorite forums
const FavoritesPage = {
    favorites: [],
    history: [],

    init() {
        this.loadFavorites();
        this.loadHistory();
        this.translateAndRenderFavorites();
        this.translateAndRenderHistory();
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
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index - 1];
            this.favorites[index - 1] = temp;
            this.saveFavorites();
            this.translateAndRenderFavorites();
        }
    },

    moveDown(index) {
        if (index < this.favorites.length - 1) {
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index + 1];
            this.favorites[index + 1] = temp;
            this.saveFavorites();
            this.translateAndRenderFavorites();
        }
    },

    deleteFavorite(index) {
        this.favorites.splice(index, 1);
        this.saveFavorites();
        this.translateAndRenderFavorites();
    },

    async translateAndRenderFavorites() {
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderFavorites();
            return;
        }

        const translatedFavorites = JSON.parse(JSON.stringify(this.favorites));

        try {
            let textsToTranslate = [];
            let textMap = [];

            translatedFavorites.forEach((forum, idx) => {
                if (forum.name) {
                    textMap.push({ type: 'name', idx, index: textsToTranslate.length });
                    textsToTranslate.push(forum.name);
                }
                if (forum.subject) {
                    textMap.push({ type: 'subject', idx, index: textsToTranslate.length });
                    textsToTranslate.push(forum.subject);
                }
            });

            if (textsToTranslate.length > 0) {
                const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                if (translated && translated.length > 0) {
                    textMap.forEach(mapping => {
                        const result = translated[mapping.index];
                        let translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];
                        translatedText = TranslationUtil.formatTranslatedText(translatedText);

                        if (mapping.type === 'name') {
                            translatedFavorites[mapping.idx].name = translatedText;
                        } else if (mapping.type === 'subject') {
                            translatedFavorites[mapping.idx].subject = translatedText;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[Translation] Error during favorites translation:', error);
        }

        this.renderFavorites(translatedFavorites);
    },

    renderFavorites(dataToRender) {
        const container = document.getElementById('favorite-forums');
        const emptyState = document.getElementById('empty-state');

        if (!container || !emptyState) return;

        const data = dataToRender || this.favorites;

        if (data.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

        data.forEach((forum, index) => {
            const isFirst = index === 0;
            const isLast = index === data.length - 1;

            html += `
                <div class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md animate-fade-in" style="animation-delay: ${index * 50}ms">
                    <div class="flex items-start gap-3">
                        <img src="https://wsrv.nl/?url=${Utils.escapeHtml(forum.avatar)}"
                             alt="${Utils.escapeHtml(forum.name)}"
                             class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'">
                        <div class="flex-1 min-w-0">
                            <a href="/forum/${Utils.escapeHtml(forum.fid)}" class="font-semibold hover:underline line-clamp-1">
                                ${Utils.escapeHtml(forum.name)}
                            </a>
                            <p class="text-sm text-muted-foreground line-clamp-2 mt-1">${Utils.escapeHtml(forum.subject)}</p>
                            <div class="flex items-center gap-1 mt-3">
                                <button class="move-up-btn inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
                                        data-index="${index}"
                                        ${isFirst ? 'disabled' : ''}
                                        title="Move up">
                                    <i class="fa-solid fa-arrow-up text-sm"></i>
                                </button>
                                <button class="move-down-btn inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
                                        data-index="${index}"
                                        ${isLast ? 'disabled' : ''}
                                        title="Move down">
                                    <i class="fa-solid fa-arrow-down text-sm"></i>
                                </button>
                                <button class="delete-favorite-btn inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors ml-auto"
                                        data-index="${index}"
                                        title="Remove favorite">
                                    <i class="fa-solid fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.moveUp(index);
            });
        });

        container.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.moveDown(index);
            });
        });

        container.querySelectorAll('.delete-favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.deleteFavorite(index);
            });
        });
    },

    async translateAndRenderHistory() {
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderHistory();
            return;
        }

        const translatedHistory = JSON.parse(JSON.stringify(this.history));

        try {
            let textsToTranslate = [];
            let textMap = [];

            translatedHistory.forEach((thread, idx) => {
                if (thread.subject) {
                    textMap.push({ type: 'subject', idx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.subject);
                }
                if (thread.author) {
                    textMap.push({ type: 'author', idx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.author);
                }
                if (thread.forumName) {
                    textMap.push({ type: 'forumName', idx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.forumName);
                }
            });

            if (textsToTranslate.length > 0) {
                const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                if (translated && translated.length > 0) {
                    textMap.forEach(mapping => {
                        const result = translated[mapping.index];
                        let translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];
                        translatedText = TranslationUtil.formatTranslatedText(translatedText);

                        if (mapping.type === 'subject') {
                            translatedHistory[mapping.idx].subject = translatedText;
                        } else if (mapping.type === 'author') {
                            translatedHistory[mapping.idx].author = translatedText;
                        } else if (mapping.type === 'forumName') {
                            translatedHistory[mapping.idx].forumName = translatedText;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[Translation] Error during history translation:', error);
        }

        this.renderHistory(translatedHistory);
    },

    renderHistory(dataToRender) {
        const container = document.getElementById('thread-history');
        if (!container) return;

        const data = dataToRender || this.history;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-muted-foreground">
                    <i class="fa-solid fa-clock-rotate-left text-3xl mb-3 block opacity-50"></i>
                    <p>No thread history yet</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';

        data.slice(0, 10).forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);

            html += `
                <a href="/thread/${Utils.escapeHtml(thread.tid)}" 
                   class="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent transition-colors no-underline"
                   style="animation: fadeIn 0.2s ease-out ${index * 30}ms both">
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium line-clamp-1" ${titleStyle}>
                            ${Utils.escapeHtml(thread.subject)}
                        </span>
                        <div class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span class="inline-flex items-center gap-1">
                                <i class="fa-solid fa-user"></i> ${Utils.escapeHtml(thread.author)}
                            </span>
                            ${thread.forumName ? `
                            <span>•</span>
                            <span class="inline-flex items-center gap-1">
                                <i class="fa-solid fa-folder"></i> ${Utils.escapeHtml(thread.forumName)}
                            </span>` : ''}
                        </div>
                    </div>
                    <span class="text-xs text-muted-foreground flex-shrink-0">${timeAgo}</span>
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const favoritesContainer = document.getElementById('favorite-forums');
    if (favoritesContainer) {
        FavoritesPage.init();
    }
});

window.FavoritesPage = FavoritesPage;

export default FavoritesPage;

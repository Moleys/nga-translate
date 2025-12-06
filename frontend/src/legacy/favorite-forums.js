// Favorites Page - Display and manage favorite forums with premium Tailwind UI
const FavoritesPage = {
    favorites: [],
    history: [],

    init() {
        // Load favorites and history from localStorage
        this.loadFavorites();
        this.loadHistory();

        // Render favorites with translation and history
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
            // Swap with previous item
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index - 1];
            this.favorites[index - 1] = temp;

            this.saveFavorites();
            this.translateAndRenderFavorites();
        }
    },

    moveDown(index) {
        if (index < this.favorites.length - 1) {
            // Swap with next item
            const temp = this.favorites[index];
            this.favorites[index] = this.favorites[index + 1];
            this.favorites[index + 1] = temp;

            this.saveFavorites();
            this.translateAndRenderFavorites();
        }
    },

    deleteFavorite(index) {
        // Remove favorite at index
        this.favorites.splice(index, 1);

        this.saveFavorites();
        this.translateAndRenderFavorites();
    },

    async translateAndRenderFavorites() {
        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderFavorites();
            return;
        }

        // Clone favorites to avoid modifying original
        const translatedFavorites = JSON.parse(JSON.stringify(this.favorites));

        try {
            // Collect all texts to translate
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
                console.log(`[Translation] Translating ${textsToTranslate.length} favorite forum texts...`);

                // Translate all texts
                const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                if (translated && translated.length > 0) {
                    // Apply translations
                    textMap.forEach(mapping => {
                        const result = translated[mapping.index];
                        let translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];
                        // Format translated text
                        translatedText = TranslationUtil.formatTranslatedText(translatedText);

                        if (mapping.type === 'name') {
                            translatedFavorites[mapping.idx].name = translatedText;
                        } else if (mapping.type === 'subject') {
                            translatedFavorites[mapping.idx].subject = translatedText;
                        }
                    });

                    console.log('[Translation] Favorite forums translation complete!');
                }
            }
        } catch (error) {
            console.error('[Translation] Error during favorites translation:', error);
        }

        // Render with translated data
        this.renderFavorites(translatedFavorites);
    },

    renderFavorites(dataToRender) {
        const container = document.getElementById('favorite-forums');
        const emptyState = document.getElementById('empty-state');

        if (!container || !emptyState) return;

        // Use provided data or fall back to original favorites
        const data = dataToRender || this.favorites;

        if (data.length === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

        data.forEach((forum, index) => {
            const isFirst = index === 0;
            const isLast = index === data.length - 1;

            html += `
                <div class="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 
                            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_0_20px_rgba(90,157,138,0.3)] 
                            transition-all duration-300 ease-out hover:-translate-y-1 p-5"
                     style="animation: fadeIn 0.3s ease-out ${index * 50}ms both">
                    <div class="flex items-start gap-4">
                        <img src="https://wsrv.nl/?url=${Utils.escapeHtml(forum.avatar)}"
                             alt="${Utils.escapeHtml(forum.name)}"
                             class="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-gray-100 
                                    group-hover:ring-[#5a9d8a]/30 transition-all duration-300 flex-shrink-0"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Crect fill=%22%23e8efed%22 width=%2256%22 height=%2256%22/%3E%3C/svg%3E'">
                        <div class="flex-1 min-w-0">
                            <h6 class="font-bold text-gray-800 group-hover:text-[#5a9d8a] transition-colors mb-1 truncate">
                                <a href="/forum/${Utils.escapeHtml(forum.fid)}" class="hover:underline decoration-2 underline-offset-2">
                                    ${Utils.escapeHtml(forum.name)}
                                </a>
                            </h6>
                            <p class="text-sm text-gray-500 line-clamp-2 mb-3">${Utils.escapeHtml(forum.subject)}</p>
                            <div class="flex items-center gap-1">
                                <button class="move-up-btn p-2 rounded-lg text-gray-400 hover:text-[#5a9d8a] 
                                               hover:bg-[#e8efed] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                        data-index="${index}"
                                        ${isFirst ? 'disabled' : ''}
                                        title="Move up">
                                    <i class="fa-solid fa-arrow-up text-sm"></i>
                                </button>
                                <button class="move-down-btn p-2 rounded-lg text-gray-400 hover:text-[#5a9d8a] 
                                               hover:bg-[#e8efed] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                        data-index="${index}"
                                        ${isLast ? 'disabled' : ''}
                                        title="Move down">
                                    <i class="fa-solid fa-arrow-down text-sm"></i>
                                </button>
                                <button class="delete-favorite-btn p-2 rounded-lg text-gray-400 hover:text-red-500 
                                               hover:bg-red-50 transition-all duration-200 ml-auto"
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

    async translateAndRenderHistory() {
        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderHistory();
            return;
        }

        // Clone history to avoid modifying original
        const translatedHistory = JSON.parse(JSON.stringify(this.history));

        try {
            // Collect all texts to translate
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
                console.log(`[Translation] Translating ${textsToTranslate.length} history texts...`);

                // Translate all texts
                const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                if (translated && translated.length > 0) {
                    // Apply translations
                    textMap.forEach(mapping => {
                        const result = translated[mapping.index];
                        let translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];
                        // Format translated text
                        translatedText = TranslationUtil.formatTranslatedText(translatedText);

                        if (mapping.type === 'subject') {
                            translatedHistory[mapping.idx].subject = translatedText;
                        } else if (mapping.type === 'author') {
                            translatedHistory[mapping.idx].author = translatedText;
                        } else if (mapping.type === 'forumName') {
                            translatedHistory[mapping.idx].forumName = translatedText;
                        }
                    });

                    console.log('[Translation] History translation complete!');
                }
            }
        } catch (error) {
            console.error('[Translation] Error during history translation:', error);
        }

        // Render with translated data
        this.renderHistory(translatedHistory);
    },

    renderHistory(dataToRender) {
        const container = document.getElementById('thread-history');
        if (!container) return;

        // Use provided data or fall back to original history
        const data = dataToRender || this.history;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <i class="fa-solid fa-clock-rotate-left text-4xl mb-3 block"></i>
                    <p class="text-gray-500">No thread history yet</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';

        data.slice(0, 10).forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);

            // Get title styling from API
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);
            const titleClass = titleStyle ? '' : 'text-gray-700';

            html += `
                <a href="/thread/${Utils.escapeHtml(thread.tid)}" 
                   class="group flex items-center justify-between gap-4 p-3 rounded-xl 
                          bg-white/60 hover:bg-white border border-transparent hover:border-gray-100
                          hover:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all duration-200 no-underline"
                   style="animation: fadeIn 0.2s ease-out ${index * 30}ms both">
                    <div class="flex-1 min-w-0">
                        <h6 class="text-sm font-medium ${titleClass} group-hover:text-[#5a9d8a] truncate transition-colors" ${titleStyle}>
                            ${Utils.escapeHtml(thread.subject)}
                        </h6>
                        <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span class="inline-flex items-center gap-1">
                                <i class="fa-solid fa-user"></i> ${Utils.escapeHtml(thread.author)}
                            </span>
                            ${thread.forumName ? `
                            <span class="text-gray-300">•</span>
                            <span class="inline-flex items-center gap-1 text-[#5a9d8a]">
                                <i class="fa-solid fa-folder"></i> ${Utils.escapeHtml(thread.forumName)}
                            </span>` : ''}
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 flex-shrink-0">${timeAgo}</span>
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

// Initialize favorites page
document.addEventListener('DOMContentLoaded', () => {
    const favoritesContainer = document.getElementById('favorite-forums');
    if (favoritesContainer) {
        FavoritesPage.init();
    }
});

window.FavoritesPage = FavoritesPage;

export default FavoritesPage;

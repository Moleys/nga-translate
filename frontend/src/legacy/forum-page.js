// Forum Page - Display all forums categorized
import forumList from './forum-list.js';

const ForumPageApp = {
    favorites: [],

    init() {
        this.loadFavorites();
        this.loadForums();
    },

    loadFavorites() {
        const stored = localStorage.getItem('nga_forum_favorites');
        this.favorites = stored ? JSON.parse(stored) : [];
    },

    saveFavorites() {
        localStorage.setItem('nga_forum_favorites', JSON.stringify(this.favorites));
    },

    isFavorite(fid) {
        return this.favorites.some(f => f.fid === fid);
    },

    toggleFavorite(forum) {
        const index = this.favorites.findIndex(f => f.fid === forum.fid);
        if (index >= 0) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push({
                fid: forum.fid,
                name: forum.name,
                subject: forum.subject || '',
                avatar: forum.avatar || ''
            });
        }
        this.saveFavorites();
        this.renderForums();
    },

    async loadForums() {
        const container = document.getElementById('forum-categories');
        if (!container) return;

        container.innerHTML = `
            <div class="rounded-lg border bg-card">
                <div class="flex items-center justify-center py-16">
                    <div class="text-center">
                        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
                        <p class="text-muted-foreground">Loading forums...</p>
                    </div>
                </div>
            </div>
        `;

        try {
            // Transform local forum-list.js data to expected structure
            const transformedData = {
                __GROUPS: forumList.map(category => category.category),
                __ROWS: forumList.map(category => category.forums)
            };

            this.forums = transformedData;
            await this.translateAndRenderForums();
        } catch (error) {
            console.error('[Forums] Load error:', error);
            container.innerHTML = `
                <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                    <div class="flex items-start gap-3">
                        <i class="fa-solid fa-circle-exclamation text-destructive text-xl"></i>
                        <div>
                            <h5 class="font-semibold text-destructive mb-1">Error Loading Forums</h5>
                            <p class="text-muted-foreground text-sm">${Utils.escapeHtml(error.message)}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    async translateAndRenderForums() {
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderForums();
            return;
        }

        // Translate category names, forum names and subjects
        try {
            const forums = this.forums;
            let textsToTranslate = [];
            let textMap = [];

            // Translate category names
            forums.__GROUPS.forEach((groupName, groupIdx) => {
                textMap.push({ type: 'category', groupIdx, index: textsToTranslate.length });
                textsToTranslate.push(groupName);
            });

            // Translate forum names and subjects
            forums.__ROWS.forEach((row, rowIdx) => {
                row.forEach((forum, colIdx) => {
                    if (forum.name) {
                        textMap.push({ type: 'name', rowIdx, colIdx, index: textsToTranslate.length });
                        textsToTranslate.push(forum.name);
                    }
                    if (forum.subject) {
                        textMap.push({ type: 'subject', rowIdx, colIdx, index: textsToTranslate.length });
                        textsToTranslate.push(forum.subject);
                    }
                });
            });

            if (textsToTranslate.length > 0) {
                const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                textMap.forEach(mapping => {
                    const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                    const formattedText = TranslationUtil.formatTranslatedText(translatedText);

                    if (mapping.type === 'category') {
                        forums.__GROUPS[mapping.groupIdx] = formattedText;
                    } else if (mapping.type === 'name') {
                        forums.__ROWS[mapping.rowIdx][mapping.colIdx].translatedName = formattedText;
                    } else if (mapping.type === 'subject') {
                        forums.__ROWS[mapping.rowIdx][mapping.colIdx].translatedSubject = formattedText;
                    }
                });
            }
        } catch (error) {
            console.error('[Forums] Translation error:', error);
        }

        this.renderForums();
    },

    renderForums() {
        const container = document.getElementById('forum-categories');
        if (!container || !this.forums) return;

        const forums = this.forums;
        let html = '';

        forums.__GROUPS.forEach((groupName, groupIndex) => {
            const forumsInGroup = forums.__ROWS[groupIndex] || [];
            if (forumsInGroup.length === 0) return;

            html += `
                <div class="mb-8 animate-fade-in" style="animation-delay: ${groupIndex * 100}ms">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="h-8 w-1 bg-primary rounded-full"></div>
                        <h2 class="text-lg font-semibold">${Utils.escapeHtml(groupName)}</h2>
                        <span class="text-muted-foreground text-sm">(${forumsInGroup.length})</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            `;

            forumsInGroup.forEach((forum, index) => {
                const isFav = this.isFavorite(forum.fid);
                const displayName = forum.translatedName || forum.name;
                const displaySubject = forum.translatedSubject || forum.subject || '';

                html += `
                    <div class="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200" 
                         style="animation: fadeIn 0.3s ease-out ${index * 30}ms both">
                        <img src="https://wsrv.nl/?url=${Utils.escapeHtml(forum.avatar)}" 
                             alt="${Utils.escapeHtml(displayName)}"
                             class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'">
                        <div class="flex-1 min-w-0">
                            <a href="/forum/${Utils.escapeHtml(forum.fid)}" 
                               class="font-medium hover:text-primary transition-colors line-clamp-1">
                                ${Utils.escapeHtml(displayName)}
                            </a>
                            <p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">${Utils.escapeHtml(displaySubject)}</p>
                        </div>
                        <button class="toggle-favorite-btn flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors ${isFav ? 'text-amber-500' : 'text-muted-foreground'}"
                                data-fid="${Utils.escapeHtml(forum.fid)}"
                                data-name="${Utils.escapeHtml(forum.name)}"
                                data-subject="${Utils.escapeHtml(forum.subject || '')}"
                                data-avatar="${Utils.escapeHtml(forum.avatar || '')}"
                                title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Bind favorite toggle events
        container.querySelectorAll('.toggle-favorite-btn').forEach(btn => {
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const forumCategories = document.getElementById('forum-categories');
    if (forumCategories) {
        ForumPageApp.init();
    }
});

window.ForumPageApp = ForumPageApp;

export default ForumPageApp;

// Forum Page - Display all forums with favorite functionality and premium Tailwind UI
const ForumPage = {
    favorites: [],

    init() {
        // Load favorites from localStorage
        this.loadFavorites();

        // Render all forums from forum-list.js with translation
        this.translateAndRender();
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
            // Find original forum data from forumList (not translated)
            let originalForum = null;
            if (typeof forumList !== 'undefined') {
                forumList.forEach(category => {
                    const found = category.forums.find(f => f.fid === forum.fid);
                    if (found) {
                        originalForum = found;
                    }
                });
            }

            // Add favorite with ORIGINAL Chinese text
            this.favorites.push({
                fid: forum.fid,
                name: originalForum ? originalForum.name : forum.name,
                subject: originalForum ? originalForum.subject : forum.subject,
                avatar: originalForum ? originalForum.avatar : forum.avatar
            });
        }

        this.saveFavorites();
        this.translateAndRender(); // Re-render with translation
    },

    async translateAndRender() {
        const container = document.getElementById('forum-categories');
        if (!container) return;

        if (typeof forumList === 'undefined' || forumList.length === 0) {
            container.innerHTML = `
                <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                    No forums available
                </div>
            `;
            return;
        }

        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderForumList();
            return;
        }

        // Clone forumList to avoid modifying the original
        const translatedForumList = JSON.parse(JSON.stringify(forumList));

        try {
            // Collect all texts to translate
            let textsToTranslate = [];
            let textMap = [];

            translatedForumList.forEach((category, catIdx) => {
                if (category.category) {
                    textMap.push({ type: 'category', catIdx, index: textsToTranslate.length });
                    textsToTranslate.push(category.category);
                }

                category.forums.forEach((forum, forumIdx) => {
                    if (forum.name) {
                        textMap.push({ type: 'forum_name', catIdx, forumIdx, index: textsToTranslate.length });
                        textsToTranslate.push(forum.name);
                    }
                    if (forum.subject) {
                        // Preprocess BBCode - extract text segments
                        const { textSegments, structure, emptyLines } = BBCodeTranslator.prepareBBCodeForTranslation(forum.subject);
                        textMap.push({
                            type: 'forum_subject',
                            catIdx,
                            forumIdx,
                            startIndex: textsToTranslate.length,
                            segmentCount: textSegments.length,
                            structure: structure,
                            emptyLines: emptyLines
                        });
                        // Add all text segments to translation queue
                        textSegments.forEach(segment => {
                            textsToTranslate.push(segment);
                        });
                    }
                });
            });

            console.log(`[Translation] Translating ${textsToTranslate.length} forum texts...`);

            // Translate all texts
            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            if (translated && translated.length > 0) {
                // Apply translations
                textMap.forEach(mapping => {
                    const result = translated[mapping.index];
                    const translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];

                    if (mapping.type === 'category') {
                        translatedForumList[mapping.catIdx].category = translatedText;
                    } else if (mapping.type === 'forum_name') {
                        translatedForumList[mapping.catIdx].forums[mapping.forumIdx].name = translatedText;
                    } else if (mapping.type === 'forum_subject') {
                        // Reconstruct BBCode content from translated segments
                        const translatedSegments = [];
                        for (let i = 0; i < mapping.segmentCount; i++) {
                            const result = translated[mapping.startIndex + i];
                            let segmentText = result?.translations?.[0]?.text || textsToTranslate[mapping.startIndex + i];
                            // Format: split by <br/>, trim, capitalize, join
                            segmentText = TranslationUtil.formatTranslatedText(segmentText);
                            translatedSegments.push(segmentText);
                        }
                        const restored = BBCodeTranslator.restoreBBCodeAfterTranslation(
                            translatedSegments,
                            mapping.structure,
                            mapping.emptyLines
                        );
                        translatedForumList[mapping.catIdx].forums[mapping.forumIdx].subject = restored;
                    }
                });

                console.log('[Translation] Forum list translation complete!');
            }
        } catch (error) {
            console.error('[Translation] Error during forum translation:', error);
        }

        // Render with translated data
        this.renderForumList(translatedForumList);
    },

    renderForumList(dataToRender) {
        const container = document.getElementById('forum-categories');
        if (!container) return;

        // Use provided data or fall back to original forumList
        const data = dataToRender || forumList;

        if (typeof data === 'undefined' || data.length === 0) {
            container.innerHTML = `
                <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                    No forums available
                </div>
            `;
            return;
        }

        let html = '';
        let categoryIndex = 0;

        data.forEach(category => {
            html += `
                <div class="mb-8" style="animation: fadeIn 0.4s ease-out ${categoryIndex * 100}ms both">
                    <div class="bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a] rounded-t-2xl px-6 py-4 shadow-lg">
                        <h4 class="text-white font-bold text-lg flex items-center gap-3 m-0">
                            <i class="fa-solid fa-folder-open"></i>
                            ${Utils.escapeHtml(category.category)}
                        </h4>
                    </div>
                    <div class="bg-white/80 backdrop-blur-sm rounded-b-2xl border border-t-0 border-gray-100/50 p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            `;

            category.forums.forEach((forum, forumIndex) => {
                const isFavorited = this.isFavorited(forum.fid);
                const favoriteClass = isFavorited
                    ? 'text-amber-400 hover:text-amber-500'
                    : 'text-gray-300 hover:text-amber-400';
                const favoriteIcon = isFavorited ? 'fa-solid fa-star' : 'fa-regular fa-star';

                html += `
                    <div class="group flex items-center gap-4 p-4 rounded-xl bg-white/60 border border-gray-100 
                                hover:bg-white hover:shadow-[0_0_20px_rgba(90,157,138,0.15)] 
                                hover:border-[#5a9d8a]/20 transition-all duration-300"
                         style="animation: fadeIn 0.3s ease-out ${forumIndex * 30}ms both">
                        <img src="https://wsrv.nl/?url=${forum.avatar}" 
                             alt="${Utils.escapeHtml(forum.name)}" 
                             class="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-gray-100 
                                    group-hover:ring-[#5a9d8a]/30 transition-all duration-300 flex-shrink-0"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23e8efed%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'">
                        <div class="flex-1 min-w-0">
                            <h6 class="font-bold text-gray-800 group-hover:text-[#5a9d8a] transition-colors mb-0.5 truncate">
                                <a href="/forum/${forum.fid}" class="hover:underline decoration-2 underline-offset-2">
                                    ${Utils.escapeHtml(forum.name)}
                                </a>
                            </h6>
                            <p class="text-xs text-gray-500 line-clamp-1 m-0">${Utils.escapeHtml(forum.subject)}</p>
                        </div>
                        <button class="favorite-btn p-2 rounded-lg ${favoriteClass} transition-all duration-200 
                                       hover:scale-110 flex-shrink-0"
                                data-fid="${forum.fid}"
                                data-name="${Utils.escapeHtml(forum.name)}"
                                data-subject="${Utils.escapeHtml(forum.subject)}"
                                data-avatar="${forum.avatar}"
                                title="${isFavorited ? 'Remove favorite' : 'Add favorite'}">
                            <i class="${favoriteIcon} text-lg"></i>
                        </button>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
            categoryIndex++;
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
    }
};

// Initialize forum page
document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('forum-categories');
    if (categoriesContainer) {
        ForumPage.init();
    }
});

window.ForumPage = ForumPage;

export default ForumPage;

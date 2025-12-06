// History Page - Display thread reading history with premium Tailwind UI
const HistoryPage = {
    history: [],

    init() {
        // Load history from localStorage
        this.loadHistory();

        // Translate and render history
        this.translateAndRenderHistory();

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
            this.translateAndRenderHistory();
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

    async translateAndRenderHistory() {
        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderHistory(this.history);
            return;
        }

        if (this.history.length === 0) {
            this.renderHistory([]);
            return;
        }

        try {
            // Clone history to avoid modifying original raw data
            const translatedHistory = JSON.parse(JSON.stringify(this.history));

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

            if (textsToTranslate.length === 0) {
                this.renderHistory(translatedHistory);
                return;
            }

            // Translate all texts
            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            // Apply translations
            textMap.forEach(mapping => {
                const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                const formattedText = TranslationUtil.formatTranslatedText(translatedText);
                translatedHistory[mapping.idx][mapping.type] = formattedText;
            });

            // Render with translated data
            this.renderHistory(translatedHistory);
        } catch (error) {
            console.error('[History] Translation failed:', error);
            // Fallback: render raw data
            this.renderHistory(this.history);
        }
    },

    renderHistory(historyToRender) {
        const container = document.getElementById('thread-history-list');
        const emptyState = document.getElementById('empty-history-state');
        const countElem = document.getElementById('history-count');

        if (!container || !emptyState) return;

        // Use original history for count
        const historyCount = this.history.length;

        // Update count
        if (countElem) {
            countElem.textContent = historyCount === 1
                ? '1 thread'
                : `${historyCount} threads`;
        }

        if (historyCount === 0) {
            // Show empty state
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hide empty state
        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="space-y-3">';

        historyToRender.forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);
            const fullDate = new Date(thread.timestamp).toLocaleString();

            // Get title styling from API
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);
            const titleClass = titleStyle ? '' : 'text-gray-800';

            html += `
                <a href="/thread/${Utils.escapeHtml(thread.tid)}" 
                   class="group block bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100/50 
                          shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_0_20px_rgba(90,157,138,0.3)] 
                          transition-all duration-300 ease-out hover:-translate-y-1 p-4
                          border-l-4 border-l-transparent hover:border-l-[#5a9d8a] no-underline"
                   style="animation: fadeIn 0.3s ease-out ${index * 30}ms both">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg 
                                             bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 
                                             text-xs font-bold flex-shrink-0">
                                    #${index + 1}
                                </span>
                                <h6 class="text-base font-semibold ${titleClass} group-hover:text-[#5a9d8a] 
                                           transition-colors line-clamp-2" ${titleStyle}>
                                    ${Utils.escapeHtml(thread.subject)}
                                </h6>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-sm">
                                <span class="inline-flex items-center gap-1.5 text-gray-500">
                                    <i class="fa-solid fa-user text-xs text-gray-400"></i> 
                                    ${Utils.escapeHtml(thread.author)}
                                </span>
                                ${thread.forumName ? `
                                <span class="text-gray-300">•</span>
                                <span class="inline-flex items-center gap-1.5 text-[#5a9d8a]">
                                    <i class="fa-solid fa-folder text-xs"></i> 
                                    ${Utils.escapeHtml(thread.forumName)}
                                </span>` : ''}
                            </div>
                        </div>
                        <div class="flex-shrink-0 text-right">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg 
                                         bg-gray-100 text-gray-500 text-xs font-medium"
                                  title="${fullDate}">
                                <i class="fa-solid fa-clock text-gray-400"></i>
                                ${timeAgo}
                            </span>
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
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;

        return new Date(timestamp).toLocaleDateString();
    }
};

// Initialize history page
document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('thread-history-list');
    if (historyList) {
        HistoryPage.init();
    }
});

window.HistoryPage = HistoryPage;

export default HistoryPage;

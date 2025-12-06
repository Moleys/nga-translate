// History Page - Display thread reading history
const HistoryPage = {
    history: [],

    init() {
        this.loadHistory();
        this.translateAndRenderHistory();
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
            btn.addEventListener('click', () => this.clearHistory());
        }
    },

    async translateAndRenderHistory() {
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderHistory(this.history);
            return;
        }

        if (this.history.length === 0) {
            this.renderHistory([]);
            return;
        }

        try {
            const translatedHistory = JSON.parse(JSON.stringify(this.history));
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

            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            textMap.forEach(mapping => {
                const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                const formattedText = TranslationUtil.formatTranslatedText(translatedText);
                translatedHistory[mapping.idx][mapping.type] = formattedText;
            });

            this.renderHistory(translatedHistory);
        } catch (error) {
            console.error('[History] Translation failed:', error);
            this.renderHistory(this.history);
        }
    },

    renderHistory(historyToRender) {
        const container = document.getElementById('thread-history-list');
        const emptyState = document.getElementById('empty-history-state');
        const countElem = document.getElementById('history-count');

        if (!container || !emptyState) return;

        const historyCount = this.history.length;

        if (countElem) {
            countElem.textContent = historyCount === 1 ? '1 thread' : `${historyCount} threads`;
        }

        if (historyCount === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        let html = '<div class="space-y-2">';

        historyToRender.forEach((thread, index) => {
            const timeAgo = this.getTimeAgo(thread.timestamp);
            const fullDate = new Date(thread.timestamp).toLocaleString();
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);

            html += `
                <a href="/thread/${Utils.escapeHtml(thread.tid)}" 
                   class="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors no-underline animate-fade-in"
                   style="animation-delay: ${index * 30}ms">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground text-xs font-medium flex-shrink-0">
                                #${index + 1}
                            </span>
                            <span class="font-medium line-clamp-1 hover:text-primary transition-colors" ${titleStyle}>
                                ${Utils.escapeHtml(thread.subject)}
                            </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span class="inline-flex items-center gap-1">
                                <i class="fa-solid fa-user"></i>
                                ${Utils.escapeHtml(thread.author)}
                            </span>
                            ${thread.forumName ? `
                            <span class="text-border">•</span>
                            <span class="inline-flex items-center gap-1">
                                <i class="fa-solid fa-folder"></i>
                                ${Utils.escapeHtml(thread.forumName)}
                            </span>` : ''}
                        </div>
                    </div>
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs flex-shrink-0" 
                          title="${fullDate}">
                        <i class="fa-solid fa-clock"></i>
                        ${timeAgo}
                    </span>
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

document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('thread-history-list');
    if (historyList) {
        HistoryPage.init();
    }
});

window.HistoryPage = HistoryPage;

export default HistoryPage;

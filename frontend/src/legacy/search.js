// Search App - Display search results
const SearchApp = {
    keyword: '',
    threadPage: 1,
    forumPage: 1,
    loadingThreads: false,
    loadingForums: false,
    hasMoreThreads: true,
    hasMoreForums: true,
    threadObserver: null,
    forumObserver: null,

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.keyword = urlParams.get('q') || '';

        if (!this.keyword) {
            document.getElementById('thread-results').innerHTML = `
                <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div class="flex items-center gap-2 text-amber-800">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Please enter a search keyword</span>
                    </div>
                </div>
            `;
            document.getElementById('forum-results').innerHTML = `
                <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div class="flex items-center gap-2 text-amber-800">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>Please enter a search keyword</span>
                    </div>
                </div>
            `;
            return;
        }

        // Check if keyword is an NGA thread URL and redirect
        const ngaThreadInfo = this.extractNgaThreadId(this.keyword);
        if (ngaThreadInfo) {
            const redirectUrl = ngaThreadInfo.page
                ? `/thread/${ngaThreadInfo.tid}?page=${ngaThreadInfo.page}`
                : `/thread/${ngaThreadInfo.tid}`;
            window.location.href = redirectUrl;
            return;
        }

        this.searchThreads();
        this.setupInfiniteScroll();
    },

    extractNgaThreadId(keyword) {
        const tidMatch = keyword.match(/[?&]tid=(\d+)/i);
        const pageMatch = keyword.match(/[?&]page=(\d+)/i);
        const ngaDomainPattern = /https?:\/\/(?:ngabbs\.com|nga\.178\.com|bbs\.nga\.cn)\//i;
        const isDomainMatch = ngaDomainPattern.test(keyword);

        if (tidMatch && tidMatch[1] && isDomainMatch) {
            return { tid: tidMatch[1], page: pageMatch?.[1] || null };
        }
        return null;
    },

    setupInfiniteScroll() {
        const threadSentinel = document.getElementById('thread-sentinel');
        this.threadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreThreads && !this.loadingThreads) {
                    this.threadPage++;
                    this.searchThreads(true);
                }
            });
        }, { rootMargin: '100px' });
        if (threadSentinel) this.threadObserver.observe(threadSentinel);

        const forumSentinel = document.getElementById('forum-sentinel');
        this.forumObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreForums && !this.loadingForums) {
                    this.forumPage++;
                    this.searchForums(true);
                }
            });
        }, { rootMargin: '100px' });
        if (forumSentinel) this.forumObserver.observe(forumSentinel);
    },

    async searchThreads(append = false) {
        if (this.loadingThreads) return;

        this.loadingThreads = true;
        const container = document.getElementById('thread-results');
        const sentinel = document.getElementById('thread-sentinel');
        const sentinelText = document.getElementById('thread-sentinel-text');

        if (!append) {
            container.innerHTML = `
                <div class="rounded-lg border bg-card">
                    <div class="flex items-center justify-center py-16">
                        <div class="text-center">
                            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
                            <p class="text-muted-foreground">Searching threads...</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            sentinel?.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'inline-block');
            sentinelText && (sentinelText.style.display = 'block');
        }

        try {
            const url = `/api/search/threads?q=${encodeURIComponent(this.keyword)}&page=${this.threadPage}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(container, data.error);
            } else if (data.code !== 0) {
                this.showError(container, data.msg || 'Search failed');
            } else {
                this.renderThreads(data, append);
            }
        } catch (error) {
            this.showError(container, error.message);
        } finally {
            this.loadingThreads = false;
            sentinel?.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'none');
            sentinelText && (sentinelText.style.display = 'none');
        }
    },

    async searchForums(append = false) {
        if (this.loadingForums) return;

        this.loadingForums = true;
        const container = document.getElementById('forum-results');
        const sentinel = document.getElementById('forum-sentinel');
        const sentinelText = document.getElementById('forum-sentinel-text');

        if (!append) {
            container.innerHTML = `
                <div class="rounded-lg border bg-card">
                    <div class="flex items-center justify-center py-16">
                        <div class="text-center">
                            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
                            <p class="text-muted-foreground">Searching forums...</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            sentinel?.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'inline-block');
            sentinelText && (sentinelText.style.display = 'block');
        }

        try {
            const url = `/api/search/forums?q=${encodeURIComponent(this.keyword)}&page=${this.forumPage}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(container, data.error);
            } else if (data.code !== 0) {
                this.showError(container, data.msg || 'Search failed');
            } else {
                this.renderForums(data, append);
            }
        } catch (error) {
            this.showError(container, error.message);
        } finally {
            this.loadingForums = false;
            sentinel?.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'none');
            sentinelText && (sentinelText.style.display = 'none');
        }
    },

    renderThreads(apiData, append = false) {
        const container = document.getElementById('thread-results');

        let threads = apiData.result?.data || (Array.isArray(apiData.result) ? apiData.result : []);
        let attachPrefix = apiData.attachPrefix || apiData.result?.attachPrefix || '';
        let totalPages = apiData.totalPage || apiData.result?.totalPage || 1;
        let currentPage = apiData.currentPage || apiData.result?.currentPage || 1;

        if (!threads || threads.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="rounded-lg border bg-muted/50 p-8 text-center">
                        <i class="fa-solid fa-search text-4xl text-muted-foreground mb-3"></i>
                        <p class="text-muted-foreground">No threads found</p>
                    </div>
                `;
            }
            this.hasMoreThreads = false;
            document.getElementById('thread-sentinel').style.display = 'none';
            document.getElementById('thread-end').style.display = 'block';
            return;
        }

        this.hasMoreThreads = currentPage < totalPages;

        if (!this.hasMoreThreads) {
            document.getElementById('thread-sentinel').style.display = 'none';
            document.getElementById('thread-end').style.display = 'block';
        } else {
            document.getElementById('thread-sentinel').style.display = 'block';
            document.getElementById('thread-end').style.display = 'none';
        }

        let html = '<div class="space-y-3">';

        threads.forEach((thread, index) => {
            const title = thread.subject || 'Untitled';
            const author = thread.author || 'Unknown';
            const replies = thread.replies || 0;
            const tid = thread.tid;
            const fid = thread.fid;
            const postDate = thread.postdate ? new Date(thread.postdate * 1000).toLocaleString() : '';
            const hasAttachment = thread.attachs && thread.attachs.length > 0;
            const thumbnailUrl = hasAttachment ? attachPrefix + thread.attachs[0].attachurl : '';
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);

            html += `
                <div class="group rounded-lg border bg-card p-4 hover:shadow-md transition-all duration-200 animate-fade-in"
                     style="animation-delay: ${index * 30}ms">
                    <div class="flex gap-4">
                        ${hasAttachment ? `
                        <div class="flex-shrink-0">
                            <img src="https://wsrv.nl/?url=${thumbnailUrl}&w=80&h=80&fit=cover&a=attention" 
                                 alt="Thumbnail" 
                                 class="w-20 h-20 object-cover rounded-lg border" 
                                 loading="lazy">
                        </div>
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <a href="/thread/${tid}" 
                               class="font-medium hover:text-primary transition-colors line-clamp-2 group-hover:underline mb-2 block" ${titleStyle}>
                                ${hasAttachment ? '<i class="fa-solid fa-image text-muted-foreground mr-1 text-sm"></i>' : ''}${Utils.escapeHtml(title)}
                            </a>
                            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span class="inline-flex items-center gap-1">
                                    <i class="fa-solid fa-user text-xs"></i>
                                    ${Utils.escapeHtml(author)}
                                </span>
                                ${postDate ? `
                                <span class="inline-flex items-center gap-1">
                                    <i class="fa-solid fa-calendar text-xs"></i>
                                    ${postDate}
                                </span>` : ''}
                                ${fid ? `
                                <a href="/forum/${fid}" class="inline-flex items-center gap-1 hover:text-primary">
                                    <i class="fa-solid fa-folder text-xs"></i>
                                    View Forum
                                </a>` : ''}
                            </div>
                            <div class="mt-2">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    <i class="fa-solid fa-comment-dots"></i>
                                    ${replies} ${replies === 1 ? 'reply' : 'replies'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        if (append) {
            container.querySelector('.space-y-3')?.insertAdjacentHTML('beforeend', html.replace('<div class="space-y-3">', '').replace('</div>', ''));
        } else {
            container.innerHTML = html;
        }
    },

    renderForums(apiData, append = false) {
        const container = document.getElementById('forum-results');

        let forums = apiData.result?.data || (Array.isArray(apiData.result) ? apiData.result : []);
        let totalPages = apiData.totalPage || apiData.result?.totalPage || 1;
        let currentPage = apiData.currentPage || apiData.result?.currentPage || 1;

        if (!forums || forums.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="rounded-lg border bg-muted/50 p-8 text-center">
                        <i class="fa-solid fa-folder-open text-4xl text-muted-foreground mb-3"></i>
                        <p class="text-muted-foreground">No forums found</p>
                    </div>
                `;
            }
            this.hasMoreForums = false;
            document.getElementById('forum-sentinel').style.display = 'none';
            document.getElementById('forum-end').style.display = 'block';
            return;
        }

        this.hasMoreForums = currentPage < totalPages;

        if (!this.hasMoreForums) {
            document.getElementById('forum-sentinel').style.display = 'none';
            document.getElementById('forum-end').style.display = 'block';
        } else {
            document.getElementById('forum-sentinel').style.display = 'block';
            document.getElementById('forum-end').style.display = 'none';
        }

        let html = '<div class="space-y-3">';

        forums.forEach((forum, index) => {
            const name = forum.name || 'Unnamed Forum';
            const fid = forum.fid || forum.id;
            const description = forum.info || forum.description || '';

            html += `
                <a href="/forum/${fid}" 
                   class="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200 no-underline animate-fade-in"
                   style="animation-delay: ${index * 30}ms">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <i class="fa-solid fa-folder text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium group-hover:text-primary transition-colors">${Utils.escapeHtml(name)}</div>
                        ${description ? `<p class="text-sm text-muted-foreground line-clamp-1 mt-0.5">${Utils.escapeHtml(description)}</p>` : ''}
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted-foreground group-hover:text-primary transition-colors"></i>
                </a>
            `;
        });

        html += '</div>';

        if (append) {
            container.querySelector('.space-y-3')?.insertAdjacentHTML('beforeend', html.replace('<div class="space-y-3">', '').replace('</div>', ''));
        } else {
            container.innerHTML = html;
        }
    },

    showError(container, message) {
        container.innerHTML = `
            <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-circle-exclamation text-destructive text-xl"></i>
                    <div>
                        <h5 class="font-semibold text-destructive mb-1">Error</h5>
                        <p class="text-muted-foreground text-sm">${Utils.escapeHtml(message)}</p>
                    </div>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const threadResults = document.getElementById('thread-results');
    const forumResults = document.getElementById('forum-results');

    if (threadResults && forumResults) {
        SearchApp.init();
    }
});

window.SearchApp = SearchApp;

export default SearchApp;

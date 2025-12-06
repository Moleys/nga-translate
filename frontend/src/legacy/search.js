// Search App - Premium Tailwind UI for search results
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
        // Get keyword from URL parameters (more reliable than template variable)
        const urlParams = new URLSearchParams(window.location.search);
        this.keyword = urlParams.get('q') || '';

        if (!this.keyword) {
            document.getElementById('thread-results').innerHTML = `
                <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                    Please enter a search keyword
                </div>
            `;
            document.getElementById('forum-results').innerHTML = `
                <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800">
                    <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                    Please enter a search keyword
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
            console.log('[Search] Detected NGA thread URL, redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
            return;
        }

        // Setup tab switching
        this.setupTabs();

        // Load initial results
        this.searchThreads();

        // Setup infinite scroll
        this.setupInfiniteScroll();
    },

    extractNgaThreadId(keyword) {
        // Match NGA thread URLs with tid parameter at any position
        const tidMatch = keyword.match(/[?&]tid=(\d+)/i);
        const pageMatch = keyword.match(/[?&]page=(\d+)/i);
        const ngaDomainPattern = /https?:\/\/(?:ngabbs\.com|nga\.178\.com|bbs\.nga\.cn)\//i;
        const isDomainMatch = ngaDomainPattern.test(keyword);

        if (tidMatch && tidMatch[1] && isDomainMatch) {
            const tid = tidMatch[1];
            const page = pageMatch && pageMatch[1] ? pageMatch[1] : null;
            console.log('[Search] Extracted tid from URL:', tid, 'page:', page);
            return { tid, page };
        }

        return null;
    },

    setupTabs() {
        const threadsTab = document.getElementById('threads-tab');
        const forumsTab = document.getElementById('forums-tab');

        threadsTab.addEventListener('shown.bs.tab', () => {
            if (this.threadPage === 1) {
                this.searchThreads();
            }
        });

        forumsTab.addEventListener('shown.bs.tab', () => {
            if (this.forumPage === 1) {
                this.searchForums();
            }
        });
    },

    setupInfiniteScroll() {
        // Thread sentinel
        const threadSentinel = document.getElementById('thread-sentinel');
        this.threadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreThreads && !this.loadingThreads) {
                    this.threadPage++;
                    this.searchThreads(true);
                }
            });
        }, { rootMargin: '100px' });
        this.threadObserver.observe(threadSentinel);

        // Forum sentinel
        const forumSentinel = document.getElementById('forum-sentinel');
        this.forumObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreForums && !this.loadingForums) {
                    this.forumPage++;
                    this.searchForums(true);
                }
            });
        }, { rootMargin: '100px' });
        this.forumObserver.observe(forumSentinel);
    },

    async searchThreads(append = false) {
        if (this.loadingThreads) return;

        this.loadingThreads = true;
        const container = document.getElementById('thread-results');

        if (!append) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"></div>
                    <p class="text-gray-500">Searching threads...</p>
                </div>
            `;
        } else {
            document.getElementById('thread-sentinel').querySelector('.spinner-border').style.display = 'inline-block';
            document.getElementById('thread-sentinel-text').style.display = 'block';
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
            document.getElementById('thread-sentinel').querySelector('.spinner-border').style.display = 'none';
            document.getElementById('thread-sentinel-text').style.display = 'none';
        }
    },

    async searchForums(append = false) {
        if (this.loadingForums) return;

        this.loadingForums = true;
        const container = document.getElementById('forum-results');

        if (!append) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"></div>
                    <p class="text-gray-500">Searching forums...</p>
                </div>
            `;
        } else {
            document.getElementById('forum-sentinel').querySelector('.spinner-border').style.display = 'inline-block';
            document.getElementById('forum-sentinel-text').style.display = 'block';
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
            document.getElementById('forum-sentinel').querySelector('.spinner-border').style.display = 'none';
            document.getElementById('forum-sentinel-text').style.display = 'none';
        }
    },

    renderThreads(apiData, append = false) {
        const container = document.getElementById('thread-results');

        let threads = [];
        let totalPages = 1;
        let currentPage = 1;
        let attachPrefix = apiData.attachPrefix || '';

        if (apiData.result && apiData.result.data) {
            threads = apiData.result.data;
            attachPrefix = apiData.result.attachPrefix || attachPrefix;
        } else if (Array.isArray(apiData.result)) {
            threads = apiData.result;
        }

        totalPages = apiData.totalPage || apiData.result?.totalPage || 1;
        currentPage = apiData.currentPage || apiData.result?.currentPage || 1;

        if (!threads || threads.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="bg-sky-50 border-l-4 border-sky-400 p-4 rounded-xl text-sky-800">
                        <i class="fa-solid fa-info-circle mr-2"></i>
                        No threads found
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

        const threadItems = threads.map((thread, index) => {
            const title = thread.subject || 'Untitled';
            const author = thread.author || 'Unknown';
            const replies = thread.replies || 0;
            const tid = thread.tid;
            const fid = thread.fid;
            const postDate = thread.postdate ? new Date(thread.postdate * 1000).toLocaleString('vi-VN') : '';

            const hasAttachment = thread.attachs && thread.attachs.length > 0;
            const thumbnailUrl = hasAttachment ? attachPrefix + thread.attachs[0].attachurl : '';

            // Get title styling from API
            const titleStyle = Utils.getTitleStyle(thread.titlefont_api);
            const titleClass = titleStyle ? '' : 'text-gray-800';

            return `
                <div class="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 
                            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_0_20px_rgba(90,157,138,0.3)] 
                            transition-all duration-300 ease-out hover:-translate-y-1 p-5 mb-4"
                     style="animation: fadeIn 0.3s ease-out ${index * 30}ms both">
                    <div class="flex gap-4">
                        ${hasAttachment ? `
                        <div class="flex-shrink-0">
                            <img src="https://wsrv.nl/?url=${thumbnailUrl}&w=100&h=100&fit=cover&a=attention" 
                                 alt="Thumbnail" 
                                 class="w-24 h-24 object-cover rounded-xl shadow-md ring-1 ring-gray-100" 
                                 loading="lazy">
                        </div>
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <h5 class="text-lg font-semibold ${titleClass} group-hover:text-[#5a9d8a] transition-colors mb-2" ${titleStyle}>
                                <a href="/thread/${tid}" class="hover:underline decoration-2 underline-offset-2">
                                    ${hasAttachment ? '<i class="fa-solid fa-image text-gray-400 mr-2 text-sm"></i>' : ''}${Utils.escapeHtml(title)}
                                </a>
                            </h5>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                                <span class="inline-flex items-center gap-1.5">
                                    <i class="fa-solid fa-user-circle text-gray-400"></i>
                                    ${Utils.escapeHtml(author)}
                                </span>
                                ${postDate ? `
                                <span class="text-gray-300">•</span>
                                <span class="inline-flex items-center gap-1.5">
                                    <i class="fa-solid fa-calendar-days text-gray-400"></i>
                                    ${postDate}
                                </span>` : ''}
                                ${fid ? `
                                <span class="text-gray-300">•</span>
                                <a href="/forum/${fid}" class="inline-flex items-center gap-1.5 text-[#5a9d8a] hover:underline">
                                    View Forum
                                </a>` : ''}
                            </div>
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                         bg-gradient-to-r from-emerald-500 to-[#5a9d8a] text-white text-xs font-semibold shadow-sm">
                                <i class="fa-solid fa-comment-dots"></i>
                                ${replies} ${replies === 1 ? 'reply' : 'replies'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (append) {
            container.insertAdjacentHTML('beforeend', threadItems);
        } else {
            container.innerHTML = threadItems;
        }
    },

    renderForums(apiData, append = false) {
        const container = document.getElementById('forum-results');

        let forums = [];
        let totalPages = 1;
        let currentPage = 1;

        if (apiData.result && Array.isArray(apiData.result)) {
            forums = apiData.result;
        } else if (apiData.result && apiData.result.data) {
            forums = apiData.result.data;
        }

        totalPages = apiData.totalPage || apiData.result?.totalPage || 1;
        currentPage = apiData.currentPage || apiData.result?.currentPage || 1;

        if (!forums || forums.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="bg-sky-50 border-l-4 border-sky-400 p-4 rounded-xl text-sky-800">
                        <i class="fa-solid fa-info-circle mr-2"></i>
                        No forums found
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

        const forumItems = forums.map((forum, index) => {
            const name = forum.name || 'Unnamed Forum';
            const fid = forum.fid || forum.id;
            const description = forum.info || forum.description || '';

            return `
                <div class="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 
                            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_0_20px_rgba(90,157,138,0.3)] 
                            transition-all duration-300 ease-out hover:-translate-y-1 p-5 mb-4"
                     style="animation: fadeIn 0.3s ease-out ${index * 30}ms both">
                    <h5 class="text-lg font-semibold text-gray-800 group-hover:text-[#5a9d8a] transition-colors mb-2">
                        <a href="/forum/${fid}" class="flex items-center gap-3 hover:underline decoration-2 underline-offset-2">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5a9d8a] to-[#4a8d7a] 
                                        flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <i class="fa-solid fa-folder"></i>
                            </div>
                            ${Utils.escapeHtml(name)}
                        </a>
                    </h5>
                    ${description ? `<p class="text-sm text-gray-500 ml-13 pl-0.5">${Utils.escapeHtml(description)}</p>` : ''}
                </div>
            `;
        }).join('');

        if (append) {
            container.insertAdjacentHTML('beforeend', forumItems);
        } else {
            container.innerHTML = forumItems;
        }
    },

    showError(container, message) {
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
                <h5 class="text-red-800 font-bold mb-2">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i>Error
                </h5>
                <p class="text-red-700">${Utils.escapeHtml(message)}</p>
            </div>
        `;
    }
};

// Initialize search page if on search page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the search page by looking for search-specific elements
    const threadResults = document.getElementById('thread-results');
    const forumResults = document.getElementById('forum-results');

    if (threadResults && forumResults) {
        SearchApp.init();
    }
});

window.SearchApp = SearchApp;

export default SearchApp;

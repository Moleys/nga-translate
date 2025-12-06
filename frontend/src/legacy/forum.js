// Forum App - Display forum threads with premium Tailwind UI
const ForumApp = {
    currentPage: 1,
    currentFid: null,
    currentAct: 'list',
    loading: false,
    hasMorePages: true,
    observer: null,

    init() {
        const forumPage = document.getElementById('forum-threads');
        if (forumPage) {
            this.currentFid = forumPage.dataset.fid;
            this.loadThreads();
            this.attachFilterListeners();
            this.setupInfiniteScroll();
        }
    },

    attachFilterListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const act = e.target.dataset.act;
                this.changeFilter(act);
            });
        });
    },

    changeFilter(act) {
        this.currentAct = act;
        this.currentPage = 1;
        this.hasMorePages = true;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-act="${act}"]`).classList.add('active');

        // Reset UI state
        document.getElementById('threads-list').innerHTML = '';
        document.getElementById('scroll-end').style.display = 'none';
        document.getElementById('scroll-sentinel').style.display = 'block';

        this.loadThreads();
    },

    setupInfiniteScroll() {
        const sentinel = document.getElementById('scroll-sentinel');

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMorePages && !this.loading) {
                    this.currentPage++;
                    this.loadThreads(true); // true = append mode
                }
            });
        }, {
            rootMargin: '100px' // Trigger 100px before reaching sentinel
        });

        this.observer.observe(sentinel);
    },

    async loadThreads(append = false) {
        if (this.loading) return;

        this.loading = true;

        if (!append) {
            this.showLoading();
        } else {
            // Show loading spinner inside sentinel
            const sentinel = document.getElementById('scroll-sentinel');
            sentinel.querySelector('.spinner-border').style.display = 'inline-block';
            sentinel.querySelector('#sentinel-text').style.display = 'block';
        }

        try {
            const url = `/api/forum/${this.currentFid}/threads?page=${this.currentPage}&act=${this.currentAct}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
            } else if (data.code !== 0) {
                this.showError(data.msg || 'API Error');
            } else {
                // Translate API data before rendering
                await this.translateAndRender(data, append);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.loading = false;
            // Hide loading spinner
            const sentinel = document.getElementById('scroll-sentinel');
            if (sentinel) {
                sentinel.querySelector('.spinner-border').style.display = 'none';
                sentinel.querySelector('#sentinel-text').style.display = 'none';
            }
        }
    },

    async translateAndRender(apiData, append = false) {
        // Check if translation is enabled
        if (typeof TranslationUtil === 'undefined' || !TranslationUtil.enabled) {
            this.renderThreads(apiData, append);
            return;
        }

        try {
            // Collect all texts to translate
            let textsToTranslate = [];
            let textMap = [];

            // Forum name (only on first load)
            if (!append && apiData.forumname) {
                textMap.push({ type: 'forumname', index: textsToTranslate.length });
                textsToTranslate.push(apiData.forumname);
            }

            // Subforums (only on first load)
            if (!append && apiData.result && apiData.result.subForum) {
                const subforumArray = Object.values(apiData.result.subForum || {});
                subforumArray.forEach((subforum, idx) => {
                    const name = subforum['1'] || subforum.name;
                    const description = subforum['2'] || subforum.info || '';

                    if (name) {
                        textMap.push({ type: 'subforum_name', subforumIdx: idx, index: textsToTranslate.length });
                        textsToTranslate.push(name);
                    }
                    if (description) {
                        textMap.push({ type: 'subforum_desc', subforumIdx: idx, index: textsToTranslate.length });
                        textsToTranslate.push(description);
                    }
                });
            }

            // Extract threads array
            let threads = [];
            if (apiData.result && apiData.result.data) {
                threads = apiData.result.data;
            } else if (Array.isArray(apiData.result)) {
                threads = apiData.result;
            }

            // Thread titles
            threads.forEach((thread, threadIdx) => {
                if (thread.subject) {
                    textMap.push({ type: 'thread_title', threadIdx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.subject);
                }
                if (thread.author) {
                    textMap.push({ type: 'thread_author', threadIdx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.author);
                }
                if (thread.lastposter) {
                    textMap.push({ type: 'thread_lastposter', threadIdx, index: textsToTranslate.length });
                    textsToTranslate.push(thread.lastposter);
                }
            });

            console.log(`[Translation] Translating ${textsToTranslate.length} forum texts...`);

            // Translate all texts
            const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

            if (translated && translated.length > 0) {
                // Apply translations back to apiData
                textMap.forEach(mapping => {
                    const result = translated[mapping.index];
                    let translatedText = result?.translations?.[0]?.text || textsToTranslate[mapping.index];

                    // Format translated text
                    translatedText = TranslationUtil.formatTranslatedText(translatedText);

                    if (mapping.type === 'forumname') {
                        apiData.forumname = translatedText;
                    } else if (mapping.type === 'subforum_name') {
                        const subforumArray = Object.values(apiData.result.subForum);
                        const subforum = subforumArray[mapping.subforumIdx];
                        if (subforum) {
                            // Update both numeric and named properties
                            subforum['1'] = translatedText;
                            if (subforum.name !== undefined) subforum.name = translatedText;
                        }
                    } else if (mapping.type === 'subforum_desc') {
                        const subforumArray = Object.values(apiData.result.subForum);
                        const subforum = subforumArray[mapping.subforumIdx];
                        if (subforum) {
                            subforum['2'] = translatedText;
                            if (subforum.info !== undefined) subforum.info = translatedText;
                        }
                    } else if (mapping.type === 'thread_title') {
                        threads[mapping.threadIdx].subject = translatedText;
                    } else if (mapping.type === 'thread_author') {
                        threads[mapping.threadIdx].author = translatedText;
                    } else if (mapping.type === 'thread_lastposter') {
                        threads[mapping.threadIdx].lastposter = translatedText;
                    }
                });

                console.log('[Translation] Forum translation complete!');
            }
        } catch (error) {
            console.error('[Translation] Error during forum translation:', error);
        }

        // Update document title with translated forum name
        if (!append && apiData.forumname) {
            document.title = `${apiData.forumname} - NGA Forums`;
        }

        // Render with translated data
        this.renderThreads(apiData, append);
    },

    renderThreads(apiData, append = false) {
        const container = document.getElementById('threads-list');

        let threads = [];
        let totalPages = 1;
        let currentPage = 1;
        let attachPrefix = apiData.attachPrefix || '';

        // Extract and display forum name (only on first load)
        if (!append && apiData.forumname) {
            document.getElementById('forum-name').textContent = apiData.forumname;
            document.title = `${apiData.forumname} - NGA Forums`;
        }

        // Extract and display subforums (only on first load)
        if (!append && apiData.result && apiData.result.subForum) {
            this.renderSubforums(apiData.result.subForum);
        }

        // Parse API response - Check top-level first!
        if (apiData.result && apiData.result.data) {
            // Object format: result.data = threads array
            threads = apiData.result.data;
            attachPrefix = apiData.result.attachPrefix || attachPrefix;
        } else if (Array.isArray(apiData.result)) {
            // Array format: result = threads array
            threads = apiData.result;
        }

        // Extract pagination from TOP LEVEL (not from result)
        totalPages = apiData.totalPage || apiData.result?.totalPage || 1;
        currentPage = apiData.currentPage || apiData.result?.currentPage || 1;

        if (!threads || threads.length === 0) {
            if (!append) {
                container.innerHTML = `
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800">
                        <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                        No threads found
                    </div>
                `;
            }
            this.hasMorePages = false;
            document.getElementById('scroll-end').style.display = 'block';
            return;
        }

        // Check if we have more pages
        this.hasMorePages = currentPage < totalPages;

        if (!this.hasMorePages) {
            document.getElementById('scroll-sentinel').style.display = 'none';
            document.getElementById('scroll-end').style.display = 'block';
        } else {
            document.getElementById('scroll-sentinel').style.display = 'block';
            document.getElementById('scroll-end').style.display = 'none';
        }

        const threadItems = threads.map((thread, index) => {
            const title = thread.subject || 'Untitled';
            const author = thread.author || 'Unknown';
            const lastPoster = thread.lastposter || author;
            const replies = thread.replies || 0;
            const tid = thread.tid;
            const postDate = thread.postdate ? new Date(thread.postdate * 1000).toLocaleString('vi-VN') : '';
            const lastPostDate = thread.lastpost ? new Date(thread.lastpost * 1000).toLocaleString('vi-VN') : '';

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
                                 class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl shadow-md ring-1 ring-gray-100" 
                                 loading="lazy">
                        </div>
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <h5 class="text-lg font-semibold ${titleClass} group-hover:text-[#5a9d8a] transition-colors mb-3" ${titleStyle}>
                                <a href="/thread/${tid}" class="hover:underline decoration-2 underline-offset-2">
                                    ${hasAttachment ? '<i class="fa-solid fa-image text-gray-400 mr-2 text-sm"></i>' : ''}${Utils.escapeHtml(title)}
                                </a>
                            </h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2">
                                        <i class="fa-solid fa-user-circle text-gray-400"></i>
                                        <span class="font-medium text-gray-600">Author:</span>
                                        ${Utils.escapeHtml(author)}
                                    </div>
                                    ${postDate ? `
                                    <div class="flex items-center gap-2">
                                        <i class="fa-solid fa-calendar-days text-gray-400"></i>
                                        <span class="font-medium text-gray-600">Posted:</span>
                                        ${postDate}
                                    </div>` : ''}
                                </div>
                                <div class="space-y-1 md:text-right">
                                    ${lastPostDate ? `
                                    <div class="flex items-center gap-2 md:justify-end">
                                        <i class="fa-solid fa-clock-rotate-left text-gray-400"></i>
                                        <span class="font-medium text-gray-600">Last:</span>
                                        ${lastPostDate}
                                    </div>` : ''}
                                    <div class="flex items-center gap-2 md:justify-end">
                                        <i class="fa-solid fa-user text-gray-400"></i>
                                        ${Utils.escapeHtml(lastPoster)}
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                             bg-gradient-to-r from-emerald-500 to-[#5a9d8a] text-white text-xs font-semibold shadow-sm">
                                    <i class="fa-solid fa-comment-dots"></i>
                                    ${replies} ${replies === 1 ? 'reply' : 'replies'}
                                </span>
                                ${hasAttachment ? `
                                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                             bg-gray-100 text-gray-600 text-xs font-semibold">
                                    <i class="fa-solid fa-paperclip"></i>
                                    ${thread.attachs.length}
                                </span>` : ''}
                            </div>
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

    showLoading() {
        const container = document.getElementById('threads-list');
        container.innerHTML = `
            <div class="text-center py-16">
                <div class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"></div>
                <p class="text-gray-500">Loading threads...</p>
            </div>
        `;
    },

    showError(message) {
        const container = document.getElementById('threads-list');
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
                <h5 class="text-red-800 font-bold mb-2">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i>Error
                </h5>
                <p class="text-red-700 mb-4">${Utils.escapeHtml(message)}</p>
                <button class="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium 
                               hover:bg-red-200 transition-colors" onclick="ForumApp.loadThreads()">
                    <i class="fa-solid fa-rotate-right mr-2"></i>Retry
                </button>
            </div>
        `;
    },

    renderSubforums(subForums) {
        const container = document.getElementById('subforum-container');
        const listContainer = document.getElementById('subforum-list');

        // subForum is an object where each key is a subforum entry
        // Each entry: {"0": fid, "1": name, "2": description, "id": fid, "name": name, ...}
        const subforumArray = Object.values(subForums || {});

        if (subforumArray.length === 0) {
            container.style.display = 'none';
            return;
        }

        const subforumItems = subforumArray.map(subforum => {
            // Extract using both numeric indices and named properties as fallback
            const fid = subforum['0'] || subforum.id;
            const name = subforum['1'] || subforum.name || 'Unnamed Forum';
            const description = subforum['2'] || subforum.info || '';

            if (!fid) return ''; // Skip invalid entries

            return `
                <a href="/forum/${fid}" 
                   class="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                          bg-white/60 border border-[#5a9d8a]/20 text-[#5a9d8a] text-sm font-medium
                          hover:bg-[#5a9d8a] hover:text-white hover:border-[#5a9d8a]
                          shadow-sm hover:shadow-md transition-all duration-200 no-underline"
                   title="${Utils.escapeHtml(description)}">
                    <i class="fa-solid fa-folder"></i>
                    ${Utils.escapeHtml(name)}
                </a>
            `;
        }).filter(item => item).join(''); // Remove empty strings

        if (subforumItems) {
            listContainer.innerHTML = subforumItems;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ForumApp.init();
});

window.ForumApp = ForumApp;

export default ForumApp;

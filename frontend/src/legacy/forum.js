// Forum View - Display threads in a forum
import forumList from './forum-list.js';

const ForumViewApp = {
    fid: null,
    currentPage: 1,
    currentAct: 'list',
    loading: false,
    hasMore: true,
    observer: null,
    attachPrefix: '',

    init() {
        const container = document.getElementById('forum-threads');
        if (!container) return;

        this.fid = container.dataset.fid;
        if (!this.fid) return;

        this.loadForumNameFromList();
        this.loadThreads();
        this.setupFilterButtons();
        this.setupInfiniteScroll();
    },

    async loadForumNameFromList() {
        const nameElem = document.getElementById('forum-name');
        if (!nameElem) return;

        // Find forum in local forum-list.js data
        let forumName = null;
        for (const category of forumList) {
            const forum = category.forums.find(f => f.fid === this.fid);
            if (forum) {
                forumName = forum.name;
                break;
            }
        }

        if (!forumName) {
            nameElem.innerHTML = 'Forum';
            return;
        }

        // Translate forum name
        let displayName = forumName;
        if (typeof TranslationUtil !== 'undefined' && TranslationUtil.enabled) {
            try {
                const translated = await TranslationUtil.translateVietphrase([forumName]);
                if (translated && translated[0]?.translations?.[0]?.text) {
                    displayName = TranslationUtil.formatTranslatedText(translated[0].translations[0].text);
                }
            } catch (e) {
                console.error('[Forum] Forum name translation error:', e);
            }
        }

        nameElem.innerHTML = Utils.escapeHtml(displayName);
    },


    setupFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const act = btn.dataset.act;
                if (act === this.currentAct) return;

                // Update active button
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.act === act) {
                        b.classList.add('active');
                    }
                });

                this.currentAct = act;
                this.currentPage = 1;
                this.hasMore = true;
                document.getElementById('threads-list').innerHTML = '';
                document.getElementById('scroll-end').style.display = 'none';
                this.loadThreads();
            });
        });
    },

    setupInfiniteScroll() {
        const sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.loading) {
                    this.currentPage++;
                    this.loadThreads(true);
                }
            });
        }, { rootMargin: '100px' });

        this.observer.observe(sentinel);
    },

    async loadThreads(append = false) {
        if (this.loading) return;
        this.loading = true;

        const container = document.getElementById('threads-list');
        const sentinel = document.getElementById('scroll-sentinel');
        const sentinelText = document.getElementById('sentinel-text');

        if (!append) {
            container.innerHTML = `
                <div class="rounded-lg border bg-card">
                    <div class="flex items-center justify-center py-16">
                        <div class="text-center">
                            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
                            <p class="text-muted-foreground">Loading threads...</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            sentinel.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'inline-block');
            sentinelText && (sentinelText.style.display = 'block');
        }

        try {
            const url = `/api/forum/${this.fid}/threads?page=${this.currentPage}&act=${this.currentAct}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.attachPrefix = data.attachPrefix || '';
            await this.translateAndRenderThreads(data, append);

        } catch (error) {
            console.error('[Forum] Load threads error:', error);
            if (!append) {
                container.innerHTML = `
                    <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-circle-exclamation text-destructive text-xl"></i>
                            <div>
                                <h5 class="font-semibold text-destructive mb-1">Error Loading Threads</h5>
                                <p class="text-muted-foreground text-sm">${Utils.escapeHtml(error.message)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } finally {
            this.loading = false;
            sentinel.querySelector('.spinner-border')?.style && (sentinel.querySelector('.spinner-border').style.display = 'none');
            sentinelText && (sentinelText.style.display = 'none');
        }
    },

    async translateAndRenderThreads(data, append) {
        let threads = [];

        // Parse API response structure from old code
        if (data.result && data.result.data) {
            threads = data.result.data;
        } else if (Array.isArray(data.result)) {
            threads = data.result;
        }

        const totalPages = data.totalPage || data.result?.totalPage || 1;
        const currentPage = data.currentPage || data.result?.currentPage || 1;
        this.attachPrefix = data.attachPrefix || data.result?.attachPrefix || '';

        this.hasMore = currentPage < totalPages;

        if (!this.hasMore) {
            document.getElementById('scroll-sentinel').style.display = 'none';
            document.getElementById('scroll-end').style.display = 'block';
        }

        if (typeof TranslationUtil !== 'undefined' && TranslationUtil.enabled && threads.length > 0) {
            try {
                let textsToTranslate = [];
                let textMap = [];

                threads.forEach((thread, idx) => {
                    if (thread.subject) {
                        textMap.push({ type: 'subject', idx, index: textsToTranslate.length });
                        textsToTranslate.push(thread.subject);
                    }
                    if (thread.author) {
                        textMap.push({ type: 'author', idx, index: textsToTranslate.length });
                        textsToTranslate.push(thread.author);
                    }
                    if (thread.lastposter) {
                        textMap.push({ type: 'lastposter', idx, index: textsToTranslate.length });
                        textsToTranslate.push(thread.lastposter);
                    }
                });

                if (textsToTranslate.length > 0) {
                    const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

                    textMap.forEach(mapping => {
                        const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
                        threads[mapping.idx][mapping.type] = TranslationUtil.formatTranslatedText(translatedText);
                    });
                }
            } catch (error) {
                console.error('[Forum] Translation error:', error);
            }
        }

        this.renderThreads(threads, append);
    },

    renderThreads(threads, append = false) {
        const container = document.getElementById('threads-list');

        if (threads.length === 0 && !append) {
            container.innerHTML = `
                <div class="rounded-lg border bg-muted/50 p-8 text-center">
                    <i class="fa-solid fa-inbox text-4xl text-muted-foreground mb-3"></i>
                    <p class="text-muted-foreground">No threads found</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-3">';

        threads.forEach((thread, index) => {
            const title = thread.subject || 'Untitled';
            const author = thread.author || 'Unknown';
            const replies = thread.replies || 0;
            const tid = thread.tid;
            const postDate = thread.postdate ? new Date(thread.postdate * 1000).toLocaleDateString() : '';
            const lastPostDate = thread.lastpost ? new Date(thread.lastpost * 1000).toLocaleDateString() : '';
            const lastPoster = thread.lastposter || '';

            const hasAttachment = thread.attachs && thread.attachs.length > 0;
            const thumbnailUrl = hasAttachment ? this.attachPrefix + thread.attachs[0].attachurl : '';

            const isTopped = thread.topicmisc && thread.topicmisc.includes('topped');
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
                            <div class="flex items-start gap-2 mb-2">
                                ${isTopped ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"><i class="fa-solid fa-thumbtack mr-1"></i>Topped</span>' : ''}
                                <a href="/thread/${tid}" 
                                   class="font-medium hover:text-primary transition-colors line-clamp-2 group-hover:underline" ${titleStyle}>
                                    ${hasAttachment ? '<i class="fa-solid fa-image text-muted-foreground mr-1 text-sm"></i>' : ''}${Utils.escapeHtml(title)}
                                </a>
                            </div>
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
                                ${lastPoster ? `
                                <span class="inline-flex items-center gap-1">
                                    <i class="fa-solid fa-reply text-xs"></i>
                                    ${Utils.escapeHtml(lastPoster)} ${lastPostDate ? `(${lastPostDate})` : ''}
                                </span>` : ''}
                            </div>
                            <div class="mt-2">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    <i class="fa-solid fa-comment-dots"></i>
                                    ${replies}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        if (append) {
            // Strip outer wrapper tags for appending (remove first and last occurrences)
            const stripped = html.replace('<div class="space-y-3">', '').replace(/<\/div>$/, '');
            container.querySelector('.space-y-3')?.insertAdjacentHTML('beforeend', stripped);
        } else {
            container.innerHTML = html;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const forumThreads = document.getElementById('forum-threads');
    if (forumThreads) {
        ForumViewApp.init();
    }
});

window.ForumViewApp = ForumViewApp;

export default ForumViewApp;

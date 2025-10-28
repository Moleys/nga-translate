const ThreadReader = {
    currentPage: 1,
    currentTid: null,
    loading: false,
    hasMorePages: true,
    observer: null,
    threadInfo: null,

    init() {
        const threadPage = document.getElementById('thread-posts');
        if (threadPage) {
            this.currentTid = threadPage.dataset.tid;
            this.loadPosts();
            this.setupInfiniteScroll();
        }
    },

    setupInfiniteScroll() {
        const sentinel = document.getElementById('scroll-sentinel');

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMorePages && !this.loading) {
                    this.currentPage++;
                    this.loadPosts(true);
                }
            });
        }, {
            rootMargin: '100px'
        });

        this.observer.observe(sentinel);
    },

    async loadPosts(append = false) {
        if (this.loading) return;

        this.loading = true;

        if (!append) {
            this.showLoading();
        } else {
            document.getElementById('scroll-sentinel').querySelector('.spinner-border').style.display = 'inline-block';
            document.getElementById('sentinel-text').style.display = 'block';
        }

        try {
            const url = `/api/thread/${this.currentTid}/posts?page=${this.currentPage}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
            } else if (data.code !== 0) {
                this.showError(data.msg || 'API Error');
            } else {
                this.renderPosts(data, append);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.loading = false;
            const sentinel = document.getElementById('scroll-sentinel');
            if (sentinel) {
                sentinel.querySelector('.spinner-border').style.display = 'none';
                sentinel.querySelector('#sentinel-text').style.display = 'none';
            }
        }
    },

    renderPosts(apiData, append = false) {
        const container = document.getElementById('posts-list');

        let posts = [];
        let totalPages = 1;
        let currentPage = 1;
        let attachPrefix = apiData.attachPrefix || '';
        let hotPosts = apiData.hot_post || [];

        // Extract thread info on first load from top-level metadata
        if (!append) {
            this.threadInfo = {
                subject: apiData.tsubject || 'Untitled Thread',
                author: apiData.tauthor || 'Unknown',
                replies: apiData.vrows || 0,
                postdate: '', // Not available in top-level
                fid: apiData.fid || null,
                forumName: apiData.forum_name || 'Forum'
            };
            this.updateThreadHeader(this.threadInfo);
            this.updateBreadcrumb(this.threadInfo);
        }

        // Parse posts - result is a direct array
        if (Array.isArray(apiData.result)) {
            posts = apiData.result;
        }

        // Pagination info is at top level
        totalPages = apiData.totalPage || 1;
        currentPage = apiData.currentPage || 1;

        if (!posts || posts.length === 0) {
            if (!append) {
                container.innerHTML = '<div class="alert alert-warning">No posts found</div>';
            }
            this.hasMorePages = false;
            document.getElementById('scroll-end').style.display = 'block';
            return;
        }

        this.hasMorePages = currentPage < totalPages;

        if (!this.hasMorePages) {
            document.getElementById('scroll-sentinel').style.display = 'none';
            document.getElementById('scroll-end').style.display = 'block';
        } else {
            document.getElementById('scroll-sentinel').style.display = 'block';
            document.getElementById('scroll-end').style.display = 'none';
        }

        let postItems = '';

        // Render regular posts
        posts.forEach((post, index) => {
            const author = post.author?.username || post.author || 'Unknown';
            const postDate = post.postdate || '';
            const content = this.parseContent(post.content || '', attachPrefix);
            const floor = post.lou !== undefined ? post.lou : (this.currentPage - 1) * 20 + index;
            const pid = post.pid || '';
            const isOriginalPost = floor === 0;
            const voteGood = post.vote_good || 0;
            const voteBad = post.vote_bad || 0;

            postItems += `
                <div class="card mb-3 post-card ${isOriginalPost ? 'original-post' : ''}" id="post-${pid}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="flex-grow-1">
                                <span class="post-author">${this.escapeHtml(author)}</span>
                                ${isOriginalPost ? '<span class="badge bg-primary ms-2">OP</span>' : ''}
                                <br>
                                <small class="text-muted">
                                    <i class="bi bi-clock"></i> ${postDate}
                                </small>
                            </div>
                            <div class="d-flex flex-column align-items-end gap-2">
                                <span class="post-floor">#${floor}</span>
                                ${voteGood > 0 || voteBad > 0 ? `
                                    <div class="vote-info">
                                        ${voteGood > 0 ? `<span class="badge bg-success"><i class="bi bi-hand-thumbs-up-fill"></i> ${voteGood}</span>` : ''}
                                        ${voteBad > 0 ? `<span class="badge bg-secondary ms-1"><i class="bi bi-hand-thumbs-down-fill"></i> ${voteBad}</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="post-content">
                            ${content}
                        </div>
                    </div>
                </div>
            `;

            // Insert hot posts after #0 (only on first page, first load)
            if (isOriginalPost && !append && hotPosts && hotPosts.length > 0) {
                postItems += this.renderHotPosts(hotPosts, attachPrefix);
            }
        });

        if (append) {
            container.insertAdjacentHTML('beforeend', postItems);
        } else {
            container.innerHTML = postItems;
        }
    },

    renderHotPosts(hotPosts, attachPrefix) {
        if (!hotPosts || hotPosts.length === 0) return '';

        let hotPostsHtml = `
            <div class="hot-posts-section mb-4">
                <div class="hot-posts-header">
                    <i class="bi bi-fire"></i> Hot Comments
                </div>
        `;

        hotPosts.forEach((post, index) => {
            const author = post.author?.username || post.author || 'Unknown';
            const postDate = post.postdate || '';
            const content = this.parseContent(post.content || '', attachPrefix);
            const floor = post.lou || 0;
            const pid = post.pid || '';
            const voteGood = post.vote_good || 0;
            const voteBad = post.vote_bad || 0;

            hotPostsHtml += `
                <div class="card hot-post-card mb-2" id="hot-post-${pid}">
                    <div class="card-body py-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <span class="post-author">${this.escapeHtml(author)}</span>
                                <span class="badge bg-danger ms-2">Hot</span>
                                <span class="badge bg-light text-dark ms-1">#${floor}</span>
                                <br>
                                <small class="text-muted">
                                    <i class="bi bi-clock"></i> ${postDate}
                                </small>
                            </div>
                            <div class="vote-info text-end">
                                ${voteGood > 0 ? `<span class="badge bg-success"><i class="bi bi-hand-thumbs-up-fill"></i> ${voteGood}</span>` : ''}
                                ${voteBad > 0 ? `<span class="badge bg-secondary ms-1"><i class="bi bi-hand-thumbs-down-fill"></i> ${voteBad}</span>` : ''}
                            </div>
                        </div>
                        <div class="post-content small">
                            ${content}
                        </div>
                    </div>
                </div>
            `;
        });

        hotPostsHtml += `</div>`;
        return hotPostsHtml;
    },

    updateThreadHeader(result) {
        const subject = result.subject || 'Untitled Thread';
        const author = result.author || 'Unknown';
        // postdate is already formatted
        const postDate = result.postdate || '';
        const replies = result.replies || 0;

        document.getElementById('thread-title').textContent = subject;
        document.title = `${subject} - NGA Forums`;

        document.getElementById('thread-info').innerHTML = `
            <i class="bi bi-person-circle"></i> <strong>${this.escapeHtml(author)}</strong>
            ${postDate ? ` • <i class="bi bi-calendar3"></i> ${postDate}` : ''}
            • <i class="bi bi-chat-left-text"></i> ${replies} ${replies === 1 ? 'reply' : 'replies'}
        `;
    },

    updateBreadcrumb(result) {
        const fid = result.fid;
        const forumName = result.forumName || 'Forum';
        const breadcrumb = document.getElementById('thread-breadcrumb');

        if (!breadcrumb) return;

        const breadcrumbHtml = `
            <li class="breadcrumb-item"><a href="/"><i class="bi bi-house-door"></i> Home</a></li>
            ${fid ? `<li class="breadcrumb-item active" aria-current="page"><a href="/forum/${fid}">${this.escapeHtml(forumName)}</a></li>` : ''}
        `;

        breadcrumb.innerHTML = breadcrumbHtml;
    },

    parseContent(content, attachPrefix) {
        if (!content) return '<p class="text-muted">No content</p>';

        let parsed = content;

        // Parse [quote] tags to blockquote (with XSS protection)
        parsed = parsed.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, (match, quoteContent) => {
            return `<blockquote class="border-start border-3 border-secondary ps-3 py-2 my-2 text-muted">${quoteContent}</blockquote>`;
        });

        // Parse reply to post: [pid=845602903,45452212,1]Reply[/pid]
        // Format: [pid=pid,tid,floor]text[/pid]
        parsed = parsed.replace(/\[pid=([^\]]+)\](.*?)\[\/pid\]/g, (match, pidData, text) => {
            const parts = pidData.split(',');
            const pid = parts[0];
            const tid = parts[1] || '';
            const floor = parts[2] || '';
            const safeText = this.escapeHtml(text);

            if (tid) {
                return `<a href="/thread/${this.escapeHtml(tid)}#post-${this.escapeHtml(pid)}" class="reply-link" title="Jump to floor #${this.escapeHtml(floor)}">
                    <i class="bi bi-reply-fill"></i> ${safeText}
                </a>`;
            }
            return `<span class="reply-link"><i class="bi bi-reply-fill"></i> ${safeText}</span>`;
        });

        // Parse user mention: [uid=43009512]username[/uid]
        parsed = parsed.replace(/\[uid=(\d+)\](.*?)\[\/uid\]/g, (match, uid, username) => {
            const safeUsername = this.escapeHtml(username);
            const safeUid = this.escapeHtml(uid);
            return `<span class="user-mention" title="UID: ${safeUid}"><i class="bi bi-at"></i>${safeUsername}</span>`;
        });

        // Parse [url] tags: [url]link[/url] or [url=link]text[/url]
        parsed = parsed.replace(/\[url=([^\]]+)\](.*?)\[\/url\]/g, (match, url, text) => {
            const safeUrl = this.escapeHtml(url);
            const safeText = this.escapeHtml(text);
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
        });
        parsed = parsed.replace(/\[url\](.*?)\[\/url\]/g, (match, url) => {
            const safeUrl = this.escapeHtml(url);
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
        });

        // Parse [img] tags to actual images
        parsed = parsed.replace(/\[img\](.*?)\[\/img\]/g, (match, url) => {
            const cleanUrl = url.replace(/['"<>]/g, ''); // Remove potential XSS chars
            const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : attachPrefix + cleanUrl;
            return `<img src="https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=800&fit=inside&a=attention" class="img-fluid" loading="lazy" alt="Image">`;
        });

        // Parse [flash] video tags (bilibili, youtube, etc)
        parsed = parsed.replace(/\[flash\](.*?)\[\/flash\]/g, (match, url) => {
            const cleanUrl = url.trim();
            // Check if it's a bilibili video
            if (cleanUrl.includes('bilibili.com')) {
                const bvMatch = cleanUrl.match(/\/video\/(BV[a-zA-Z0-9]+)/);
                if (bvMatch) {
                    const bvid = this.escapeHtml(bvMatch[1]);
                    return `<div class="ratio ratio-16x9 my-3">
                        <iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
                    </div>`;
                }
            }
            // Fallback: show link
            const safeUrl = this.escapeHtml(cleanUrl);
            return `<a href="${safeUrl}" target="_blank" class="btn btn-sm btn-outline-primary my-2"><i class="bi bi-play-circle"></i> View Video</a>`;
        });

        // Convert standalone URLs to links (that are not already in HTML tags)
        parsed = parsed.replace(/(?<!["'])(?<!href=)(https?:\/\/[^\s<>"']+)/g, (url) => {
            const safeUrl = this.escapeHtml(url);
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
        });

        // Convert line breaks
        parsed = parsed.replace(/\n/g, '<br>');

        return parsed || '<p class="text-muted">No content</p>';
    },

    showLoading() {
        const container = document.getElementById('posts-list');
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading posts...</p>
            </div>
        `;
    },

    showError(message) {
        const container = document.getElementById('posts-list');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h5 class="alert-heading">Error</h5>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-sm btn-outline-danger" onclick="ThreadReader.loadPosts()">Retry</button>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize thread reader
document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-list');
    if (postsContainer) {
        ThreadReader.init();
    }
});

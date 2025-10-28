const ThreadReader = {
    currentPage: 1,
    currentTid: null,
    loading: false,
    totalPages: 1,
    threadInfo: null,

    init() {
        const threadPage = document.getElementById('thread-posts');
        if (threadPage) {
            this.currentTid = threadPage.dataset.tid;

            // Get page from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            this.currentPage = parseInt(urlParams.get('page')) || 1;

            this.loadPosts();
            this.setupPaginationHandlers();
        }
    },

    setupPaginationHandlers() {
        // Previous page button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'prev-page' || e.target.closest('#prev-page')) {
                e.preventDefault();
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            }
        });

        // Next page button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'next-page' || e.target.closest('#next-page')) {
                e.preventDefault();
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            }
        });

        // Page number buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-num-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.goToPage(page);
                }
            }
        });

        // Page input form
        const pageForm = document.getElementById('page-jump-form');
        if (pageForm) {
            pageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('page-input');
                const page = parseInt(input.value);
                if (page && page >= 1 && page <= this.totalPages) {
                    this.goToPage(page);
                } else {
                    input.value = this.currentPage;
                }
            });
        }
    },

    goToPage(page) {
        this.currentPage = page;

        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load posts
        this.loadPosts();
    },

    async loadPosts() {
        if (this.loading) return;

        this.loading = true;
        this.showLoading();

        try {
            const url = `/api/thread/${this.currentTid}/posts?page=${this.currentPage}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
            } else if (data.code !== 0) {
                this.showError(data.msg || 'API Error');
            } else {
                this.renderPosts(data);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.loading = false;
        }
    },

    renderPosts(apiData) {
        const container = document.getElementById('posts-list');

        let posts = [];
        let attachPrefix = apiData.attachPrefix || '';
        let hotPosts = apiData.hot_post || [];

        // Extract thread info on first page load
        if (this.currentPage === 1) {
            this.threadInfo = {
                subject: apiData.tsubject || 'Untitled Thread',
                author: apiData.tauthor || 'Unknown',
                replies: apiData.vrows || 0,
                postdate: '',
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
        this.totalPages = apiData.totalPage || 1;
        const currentPage = apiData.currentPage || 1;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No posts found</div>';
            this.renderPagination();
            return;
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

            // Insert hot posts after #0 (only on first page)
            if (isOriginalPost && this.currentPage === 1 && hotPosts && hotPosts.length > 0) {
                postItems += this.renderHotPosts(hotPosts, attachPrefix);
            }
        });

        container.innerHTML = postItems;
        this.renderPagination();
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

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '<nav aria-label="Thread pagination"><ul class="pagination justify-content-center">';

        // Previous button
        paginationHtml += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" id="prev-page" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;

        // Page numbers with ellipsis
        const maxVisible = 5;
        const half = Math.floor(maxVisible / 2);
        let startPage = Math.max(1, this.currentPage - half);
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

        // Adjust start if end is at max
        if (endPage === this.totalPages) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // First page + ellipsis
        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link page-num-btn" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link page-num-btn" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Ellipsis + last page
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link page-num-btn" href="#" data-page="${this.totalPages}">${this.totalPages}</a></li>`;
        }

        // Next button
        paginationHtml += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" id="next-page" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;

        paginationHtml += '</ul></nav>';

        // Jump to page input
        paginationHtml += `
            <div class="d-flex justify-content-center align-items-center mt-2 gap-2">
                <span class="text-muted small">Jump to:</span>
                <form id="page-jump-form" class="d-flex gap-2">
                    <input type="number"
                           id="page-input"
                           class="form-control form-control-sm"
                           style="width: 80px;"
                           min="1"
                           max="${this.totalPages}"
                           value="${this.currentPage}"
                           autocomplete="off">
                    <button type="submit" class="btn btn-sm btn-primary">Go</button>
                </form>
                <span class="text-muted small">/ ${this.totalPages}</span>
            </div>
        `;

        container.innerHTML = paginationHtml;
    },

    parseContent(content, attachPrefix) {
        if (!content) return '<p class="text-muted">No content</p>';

        let parsed = content;

        // Parse emoticons first: [s:category:emoticon_name]
        parsed = parsed.replace(/\[s:([^:]+):([^\]]+)\]/g, (match, category, name) => {
            if (typeof getEmoticonUrl === 'function') {
                const emoticonUrl = getEmoticonUrl(name, category);
                if (emoticonUrl) {
                    return `<img src="${emoticonUrl}" alt="${this.escapeHtml(name)}" class="emoticon" loading="lazy" title="${this.escapeHtml(name)}">`;
                }
            }
            return match;
        });

        // Parse [b]Reply to [pid]...[/pid] Post by [uid]...[/uid] (date)[/b] pattern
        // Use [\s\S]*? to match any character including newlines
        const replyToPattern = /\[b\]Reply to \[pid=([^\]]+)\]([\s\S]*?)\[\/pid\] Post by \[uid=(\d+)\]([\s\S]*?)\[\/uid\]\s*\(([^)]+)\)\[\/b\]/g;
        if (/\[b\]Reply to \[pid=/.test(parsed)) {
            console.log('[DEBUG] Found Reply-to pattern in content');
        }
        parsed = parsed.replace(replyToPattern,
            (match, pidData, pidText, uid, username, date) => {
                console.log('[DEBUG] Replacing Reply-to:', {pidData, username, date});
                const parts = pidData.split(',');
                const pid = parts[0];
                const tid = parts[1] || '';
                const floor = parseInt(parts[2]) || 0;
                const page = Math.floor(floor / 20) + 1;
                const safeUsername = this.escapeHtml(username);
                const safeDate = this.escapeHtml(date);

                if (tid) {
                    return `<div class="reply-to-header"><i class="bi bi-reply-fill"></i> Reply to <a href="/thread/${this.escapeHtml(tid)}?page=${page}#post-${this.escapeHtml(pid)}" class="quote-reply-link" title="Jump to floor #${floor}"><span class="quote-author">${safeUsername}</span></a> <span class="text-muted">(${safeDate})</span></div>`;
                }
                return `<div class="reply-to-header"><i class="bi bi-reply-fill"></i> Reply to <span class="quote-author">${safeUsername}</span> <span class="text-muted">(${safeDate})</span></div>`;
            }
        );

        // Parse [quote] blocks BEFORE other BBCode (to preserve structure)
        parsed = parsed.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, (match, quoteContent) => {
            let quoteParsed = quoteContent;

            // Parse [tid] inside quote for topic link
            quoteParsed = quoteParsed.replace(/\[tid=([^\]]+)\](.*?)\[\/tid\]/g, (m, tid, text) => {
                const safeTid = this.escapeHtml(tid);
                const safeText = this.escapeHtml(text);
                return `<a href="/thread/${safeTid}" class="quote-reply-link" title="View thread">${safeText}</a>`;
            });

            // Parse "Reply[/pid] [b]Post by [uid]...[/uid] (date):[/b]" pattern in quote (same format as outside)
            if (/\[pid=.*?\[b\]Post by/.test(quoteParsed)) {
                console.log('[DEBUG] Found Reply pattern in quote block');
            }
            quoteParsed = quoteParsed.replace(/\[pid=([^\]]+)\](.*?)\[\/pid\]\s+\[b\]Post by \[uid=(\d+)\](.*?)\[\/uid\]\s*\(([^)]+)\):\[\/b\]/g,
                (m, pidData, pidText, uid, username, date) => {
                    console.log('[DEBUG] Replacing Reply in quote:', {pidData, username, date});
                    const parts = pidData.split(',');
                    const pid = parts[0];
                    const tid = parts[1] || '';
                    const floor = parseInt(parts[2]) || 0;
                    const page = Math.floor(floor / 20) + 1;
                    const safeUsername = this.escapeHtml(username);
                    const safeDate = this.escapeHtml(date);

                    if (tid) {
                        return `<div class="reply-to-header"><i class="bi bi-reply-fill"></i> Reply to <a href="/thread/${this.escapeHtml(tid)}?page=${page}#post-${this.escapeHtml(pid)}" class="quote-reply-link" title="Jump to floor #${floor}"><span class="quote-author">${safeUsername}</span></a> <span class="text-muted">(${safeDate})</span></div>`;
                    }
                    return `<div class="reply-to-header"><i class="bi bi-reply-fill"></i> Reply to <span class="quote-author">${safeUsername}</span> <span class="text-muted">(${safeDate})</span></div>`;
                }
            );

            // Parse remaining [pid] inside quote - USE BADGES like outside quote
            quoteParsed = quoteParsed.replace(/\[pid=([^\]]+)\](.*?)\[\/pid\]/g, (m, pidData, text) => {
                const parts = pidData.split(',');
                const pid = parts[0];
                const tid = parts[1] || '';
                const floor = parseInt(parts[2]) || 0;
                const page = Math.floor(floor / 20) + 1;
                const safeText = this.escapeHtml(text);

                if (tid) {
                    return `<a href="/thread/${this.escapeHtml(tid)}?page=${page}#post-${this.escapeHtml(pid)}" class="badge bg-secondary text-decoration-none" title="Jump to floor #${floor}">${safeText}</a>`;
                }
                return `<span class="badge bg-secondary">${safeText}</span>`;
            });

            // Parse [uid] inside quote - USE BADGES like outside quote
            quoteParsed = quoteParsed.replace(/\[uid=(\d+)\](.*?)\[\/uid\]/g, (m, uid, username) => {
                const safeUsername = this.escapeHtml(username);
                const safeUid = this.escapeHtml(uid);
                return `<span class="badge bg-info text-dark" title="UID: ${safeUid}">${safeUsername}</span>`;
            });

            // Parse [b] tags inside quote
            quoteParsed = quoteParsed.replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>');

            return `<blockquote class="border-start border-3 border-secondary ps-3 py-2 my-2 bg-light">${quoteParsed}</blockquote>`;
        });

        // Parse text formatting BBCode
        // Bold: [b]...[/b]
        parsed = parsed.replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>');

        // Italic: [i]...[/i]
        parsed = parsed.replace(/\[i\]([\s\S]*?)\[\/i\]/g, '<em>$1</em>');

        // Underline: [u]...[/u]
        parsed = parsed.replace(/\[u\]([\s\S]*?)\[\/u\]/g, '<u>$1</u>');

        // Strikethrough: [del]...[/del]
        parsed = parsed.replace(/\[del\]([\s\S]*?)\[\/del\]/g, '<del>$1</del>');

        // Color: [color=red]...[/color]
        parsed = parsed.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/g, (match, color, text) => {
            const safeColor = this.escapeHtml(color);
            return `<span style="color:${safeColor}">${text}</span>`;
        });

        // Size: [size=14px]...[/size]
        parsed = parsed.replace(/\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/g, (match, size, text) => {
            const safeSize = this.escapeHtml(size);
            return `<span style="font-size:${safeSize}">${text}</span>`;
        });

        // Align: [align=center]...[/align]
        parsed = parsed.replace(/\[align=([^\]]+)\]([\s\S]*?)\[\/align\]/g, (match, align, text) => {
            const safeAlign = this.escapeHtml(align);
            return `<div style="text-align:${safeAlign}">${text}</div>`;
        });

        // Collapse: [collapse]...[/collapse] or [collapse=title]...[/collapse]
        parsed = parsed.replace(/\[collapse(?:=([^\]]+))?\]([\s\S]*?)\[\/collapse\]/g, (match, title, content) => {
            const summary = title ? this.escapeHtml(title) : '已折叠，点击展开';
            return `<details class="collapse-block"><summary>${summary}</summary><div class="collapse-content">${content}</div></details>`;
        });

        // Parse remaining [pid] tags (outside quote/reply-to)
        // Format: [pid=pid,tid,floor]text[/pid]
        parsed = parsed.replace(/\[pid=([^\]]+)\](.*?)\[\/pid\]/g, (match, pidData, text) => {
            const parts = pidData.split(',');
            const pid = parts[0];
            const tid = parts[1] || '';
            const floor = parseInt(parts[2]) || 0;
            const page = Math.floor(floor / 20) + 1;
            const safeText = this.escapeHtml(text);

            if (tid) {
                return `<a href="/thread/${this.escapeHtml(tid)}?page=${page}#post-${this.escapeHtml(pid)}" class="badge bg-secondary text-decoration-none" title="Jump to floor #${floor}">${safeText}</a>`;
            }
            return `<span class="badge bg-secondary">${safeText}</span>`;
        });

        // Parse remaining [uid] tags (outside quote/reply-to)
        parsed = parsed.replace(/\[uid=(\d+)\](.*?)\[\/uid\]/g, (match, uid, username) => {
            const safeUsername = this.escapeHtml(username);
            const safeUid = this.escapeHtml(uid);
            return `<span class="badge bg-info text-dark" title="UID: ${safeUid}">${safeUsername}</span>`;
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
            return `<img src="https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}" class="img-fluid" loading="lazy" alt="Image">`;
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

        // Convert standalone URLs to links (but not URLs in HTML attributes)
        // Split by existing HTML tags to avoid modifying URLs inside tags
        const parts = parsed.split(/(<[^>]+>)/);
        parsed = parts.map((part, index) => {
            // Skip HTML tags (odd indices after split)
            if (part.startsWith('<') && part.endsWith('>')) {
                return part;
            }
            // Convert URLs in text content only
            return part.replace(/(https?:\/\/[^\s<>"]+)/g, (url) => {
                const safeUrl = this.escapeHtml(url);
                return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
            });
        }).join('');

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

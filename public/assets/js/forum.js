const ForumApp = {
    currentPage: 1,
    currentFid: null,
    currentAct: 'list',
    loading: false,
    totalPages: 1,

    init() {
        const forumPage = document.getElementById('forum-threads');
        if (forumPage) {
            this.currentFid = forumPage.dataset.fid;
            this.loadThreads();
            this.attachFilterListeners();
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
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-act="${act}"]`).classList.add('active');
        
        this.loadThreads();
    },

    async loadThreads() {
        if (this.loading) return;
        
        this.loading = true;
        this.showLoading();

        try {
            const url = `/api/forum/${this.currentFid}/threads?page=${this.currentPage}&act=${this.currentAct}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
            } else if (data.code !== 0) {
                this.showError(data.msg || 'API Error');
            } else {
                this.renderThreads(data);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.loading = false;
        }
    },

    renderThreads(apiData) {
        const container = document.getElementById('threads-list');
        
        let threads = [];
        let totalPages = 1;
        let currentPage = 1;
        let attachPrefix = apiData.attachPrefix || '';
        
        // Check if result is array (hot/topped) or object (list)
        if (Array.isArray(apiData.result)) {
            // Hot/Topped filter returns array directly
            threads = apiData.result;
            totalPages = 1; // No pagination for hot/topped
            currentPage = 1;
        } else if (apiData.result && apiData.result.data) {
            // List filter returns object with data array
            threads = apiData.result.data;
            totalPages = apiData.result.totalPage || 1;
            currentPage = apiData.result.currentPage || 1;
            attachPrefix = apiData.result.attachPrefix || attachPrefix;
        }
        
        if (!threads || threads.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No threads found</div>';
            this.updatePagination(1, 1);
            return;
        }

        this.totalPages = totalPages;
        this.currentPage = currentPage;

        const threadItems = threads.map(thread => {
            const title = thread.subject || 'Untitled';
            const author = thread.author || 'Unknown';
            const lastPoster = thread.lastposter || author;
            const replies = thread.replies || 0;
            const tid = thread.tid;
            const postDate = thread.postdate ? new Date(thread.postdate * 1000).toLocaleString('vi-VN') : '';
            const lastPostDate = thread.lastpost ? new Date(thread.lastpost * 1000).toLocaleString('vi-VN') : '';
            
            // Get thumbnail if exists
            const hasAttachment = thread.attachs && thread.attachs.length > 0;
            const thumbnailUrl = hasAttachment ? attachPrefix + thread.attachs[0].attachurl : '';

            return `
                <div class="card mb-3 hover-shadow">
                    <div class="card-body">
                        <div class="row">
                            ${hasAttachment ? `
                            <div class="col-auto">
                                <img src="${thumbnailUrl}" alt="Thumbnail" class="thread-thumbnail" loading="lazy">
                            </div>
                            ` : ''}
                            <div class="${hasAttachment ? 'col' : 'col-12'}">
                                <h5 class="card-title mb-3">
                                    <a href="https://ngabbs.com/read.php?tid=${tid}" target="_blank" class="text-decoration-none text-dark">
                                        ${hasAttachment ? '<i class="bi bi-image text-muted me-2"></i>' : ''}${this.escapeHtml(title)}
                                    </a>
                                </h5>
                                <div class="row">
                                    <div class="col-md-6">
                                        <small class="text-muted">
                                            <i class="bi bi-person-circle"></i> <strong>Author:</strong> ${this.escapeHtml(author)}<br>
                                            ${postDate ? `<i class="bi bi-calendar3"></i> <strong>Posted:</strong> ${postDate}` : ''}
                                        </small>
                                    </div>
                                    <div class="col-md-6 text-md-end">
                                        <small class="text-muted">
                                            ${lastPostDate ? `<i class="bi bi-clock-history"></i> <strong>Last:</strong> ${lastPostDate}<br>` : ''}
                                            <i class="bi bi-person"></i> ${this.escapeHtml(lastPoster)}
                                        </small>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <span class="badge bg-primary rounded-pill">
                                        <i class="bi bi-chat-left-text"></i> ${replies} ${replies === 1 ? 'reply' : 'replies'}
                                    </span>
                                    ${hasAttachment ? `<span class="badge bg-secondary rounded-pill ms-1"><i class="bi bi-paperclip"></i> ${thread.attachs.length}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = threadItems;
        this.updatePagination(this.currentPage, this.totalPages);
    },

    showLoading() {
        const container = document.getElementById('threads-list');
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading threads...</p>
            </div>
        `;
    },

    showError(message) {
        const container = document.getElementById('threads-list');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h5 class="alert-heading">Error</h5>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-sm btn-outline-danger" onclick="ForumApp.loadThreads()">Retry</button>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updatePagination(current, total) {
        const paginationContainer = document.getElementById('pagination-container');
        console.log('updatePagination called:', { current, total, containerFound: !!paginationContainer });
        
        if (!paginationContainer) {
            console.error('pagination-container not found!');
            return;
        }

        if (total <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const maxButtons = 7;
        let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
        let endPage = Math.min(total, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        let html = '<nav><ul class="pagination justify-content-center">';
        
        html += `
            <li class="page-item ${current === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current - 1}">&laquo; Prev</a>
            </li>
        `;
        
        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === current ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        if (endPage < total) {
            if (endPage < total - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${total}">${total}</a></li>`;
        }
        
        html += `
            <li class="page-item ${current === total ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current + 1}">Next &raquo;</a>
            </li>
        `;
        
        html += '</ul></nav>';
        html += `<div class="text-center text-muted small mt-2">Page ${current} of ${total}</div>`;
        
        paginationContainer.innerHTML = html;
        
        paginationContainer.querySelectorAll('a.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== current && page >= 1 && page <= total) {
                    this.goToPage(page);
                }
            });
        });
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadThreads();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ForumApp.init();
});

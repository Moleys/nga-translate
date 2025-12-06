// Login Page - Handle NGA authentication credentials with premium UI
const LoginPage = {
    init() {
        this.loadExistingCredentials();
        this.setupFormHandlers();
        this.updateLoginStatus();
    },

    loadExistingCredentials() {
        const access_uid = Cookies.get('nga_access_uid');
        const access_token = Cookies.get('nga_access_token');
        const app_id = Cookies.get('nga_app_id') || '1010';

        if (access_uid) {
            document.getElementById('access_uid').value = access_uid;
        }
        if (access_token) {
            document.getElementById('access_token').value = access_token;
        }
        if (app_id) {
            document.getElementById('app_id').value = app_id;
        }
    },

    setupFormHandlers() {
        const form = document.getElementById('login-form');
        const logoutBtn = document.getElementById('logout-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCredentials();
        });

        logoutBtn.addEventListener('click', () => {
            this.clearCredentials();
        });
    },

    saveCredentials() {
        const access_uid = document.getElementById('access_uid').value.trim();
        const access_token = document.getElementById('access_token').value.trim();
        const app_id = document.getElementById('app_id').value.trim();

        if (!access_uid || !access_token || !app_id) {
            this.showStatus('Please fill in all required fields', 'warning');
            return;
        }

        try {
            // Save to cookies (1 year expiry)
            Cookies.set('nga_access_uid', access_uid, { expires: 365, sameSite: 'Lax' });
            Cookies.set('nga_access_token', access_token, { expires: 365, sameSite: 'Lax' });
            Cookies.set('nga_app_id', app_id, { expires: 365, sameSite: 'Lax' });
            Cookies.set('nga_auth_saved_at', Date.now(), { expires: 365, sameSite: 'Lax' });

            this.showStatus('Credentials saved successfully!', 'success');
            this.updateLoginStatus();

            // Dispatch event for other modules to update
            window.dispatchEvent(new Event('nga_auth_updated'));
        } catch (error) {
            this.showStatus('Failed to save credentials: ' + error.message, 'error');
        }
    },

    clearCredentials() {
        if (confirm('Are you sure you want to clear all saved credentials?')) {
            try {
                // Delete cookies
                Cookies.remove('nga_access_uid');
                Cookies.remove('nga_access_token');
                Cookies.remove('nga_app_id');
                Cookies.remove('nga_auth_saved_at');

                // Clear form
                document.getElementById('access_uid').value = '';
                document.getElementById('access_token').value = '';
                document.getElementById('app_id').value = '1010';

                this.showStatus('Credentials cleared successfully', 'info');
                this.updateLoginStatus();

                // Dispatch event
                window.dispatchEvent(new Event('nga_auth_updated'));
            } catch (error) {
                this.showStatus('Failed to clear credentials: ' + error.message, 'error');
            }
        }
    },

    getAuth() {
        const access_uid = Cookies.get('nga_access_uid');
        const access_token = Cookies.get('nga_access_token');
        const app_id = Cookies.get('nga_app_id');
        const saved_at = Cookies.get('nga_auth_saved_at');

        if (access_uid && access_token) {
            return {
                access_uid: access_uid,
                access_token: access_token,
                app_id: app_id || '1010',
                saved_at: saved_at ? parseInt(saved_at) : null
            };
        }

        return null;
    },

    updateLoginStatus() {
        const auth = this.getAuth();
        const statusDiv = document.getElementById('login-status');

        if (auth) {
            const savedDate = auth.saved_at ? new Date(auth.saved_at).toLocaleString() : 'Unknown';
            statusDiv.className = 'mb-6 p-4 rounded-xl bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800';
            statusDiv.classList.remove('hidden');
            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-500 text-xl mt-0.5"></i>
                    <div>
                        <strong class="block text-emerald-800">Logged in</strong>
                        <div class="text-sm mt-2 space-y-1 text-emerald-700">
                            <div>User ID: <code class="px-1.5 py-0.5 bg-emerald-100 rounded">${Utils.escapeHtml(auth.access_uid)}</code></div>
                            <div>Token: <code class="px-1.5 py-0.5 bg-emerald-100 rounded">${this.maskToken(auth.access_token)}</code></div>
                            <div>Saved: ${savedDate}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            statusDiv.className = 'mb-6 p-4 rounded-xl bg-amber-50 border-l-4 border-amber-400 text-amber-800';
            statusDiv.classList.remove('hidden');
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                    <span><strong>Not logged in</strong> - Enter your credentials below</span>
                </div>
            `;
        }
    },

    showStatus(message, type) {
        const statusDiv = document.getElementById('login-status');

        const styles = {
            success: 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800',
            error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
            warning: 'bg-amber-50 border-l-4 border-amber-400 text-amber-800',
            info: 'bg-sky-50 border-l-4 border-sky-400 text-sky-800'
        };

        const icons = {
            success: 'fa-circle-check text-emerald-500',
            error: 'fa-circle-exclamation text-red-500',
            warning: 'fa-triangle-exclamation text-amber-500',
            info: 'fa-info-circle text-sky-500'
        };

        statusDiv.className = `mb-6 p-4 rounded-xl ${styles[type]}`;
        statusDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fa-solid ${icons[type]}"></i>
                <span>${message}</span>
            </div>
        `;
        statusDiv.classList.remove('hidden');

        // Auto hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.updateLoginStatus();
            }, 5000);
        }
    },

    maskToken(token) {
        if (!token) return '';
        if (token.length <= 8) return token;
        return token.substring(0, 6) + '...' + token.substring(token.length - 6);
    }
};

// Initialize login page
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        LoginPage.init();
    }
});

window.LoginPage = LoginPage;

export default LoginPage;

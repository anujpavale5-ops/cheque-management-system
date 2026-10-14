// Core Application Logic

class App {
    constructor() {
        this.initTheme();
        this.initSidebarCollapse();
        this.initSidebarMobile();
        this.initRouter();
        this.initNotifications();
        this.initSearch();
        
        // Expose formatters globally
        window.formatCurrency = this.formatCurrency;
        window.formatDate = this.formatDate;
        window.showToast = this.showToast.bind(this);
        window.getBadgeClass = this.getBadgeClass.bind(this);
        
        if(window.lucide) {
            lucide.createIcons();
        }
    }

    // --- Theme ---
    initTheme() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        toggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            toggleBtn.innerHTML = theme === 'light' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
            if(window.lucide) lucide.createIcons();
        });
        
        // Set initial icon
        toggleBtn.innerHTML = currentTheme === 'light' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
    }

    // --- Sidebar Collapse (Desktop) ---
    initSidebarCollapse() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const toggleIcon = document.getElementById('sidebar-toggle-icon');
        const body = document.body;
        
        // Check localStorage preference
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            body.classList.add('sidebar-collapsed');
            if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'panel-left-open');
        }

        toggleBtn.addEventListener('click', () => {
            const currentlyCollapsed = body.classList.contains('sidebar-collapsed');
            if (currentlyCollapsed) {
                body.classList.remove('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');
                toggleIcon.setAttribute('data-lucide', 'panel-left-close');
            } else {
                body.classList.add('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
                toggleIcon.setAttribute('data-lucide', 'panel-left-open');
            }
            if(window.lucide) lucide.createIcons();
        });
    }

    // --- Sidebar Mobile ---
    initSidebarMobile() {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menu-btn');
        const closeBtn = document.getElementById('mobile-close-btn');
        
        menuBtn.addEventListener('click', () => sidebar.classList.add('open'));
        closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
        
        // Close sidebar on click outside in mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
        
        // Ensure desktop collapse state doesn't interfere with mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                // Remove collapsed class on mobile to ensure full drawer shows
                document.body.classList.remove('sidebar-collapsed');
            } else {
                // Restore preference on desktop
                const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                if (isCollapsed) document.body.classList.add('sidebar-collapsed');
            }
        });
    }

    // --- Router (Vanilla SPA) ---
    initRouter() {
        window.addEventListener('hashchange', this.handleRoute.bind(this));
        
        if (!window.location.hash) {
            window.location.hash = '#/dashboard';
        } else {
            this.handleRoute();
        }
    }

    async handleRoute() {
        const path = window.location.hash.substring(1) || '/dashboard';
        const contentDiv = document.getElementById('app-content');
        
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-path="${path}"]`);
        if (activeNav) activeNav.classList.add('active');

        contentDiv.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
        
        try {
            const pageName = path.replace('/', '');
            const cacheBuster = new Date().getTime();
            const response = await fetch(`pages/${pageName}.html?v=${cacheBuster}`);
            
            if (!response.ok) throw new Error('Page not found');
            
            const html = await response.text();
            contentDiv.innerHTML = html;
            
            if(window.lucide) lucide.createIcons();
            this.initPageScript(pageName);
            
            // Close mobile sidebar on navigation
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
            
        } catch (error) {
            console.error(error);
            contentDiv.innerHTML = `
                <div class="page-header">
                    <div class="page-title">
                        <h1>Error Loading Page</h1>
                        <p>Could not load ${path}. Make sure you are running a local web server.</p>
                    </div>
                </div>
            `;
        }
    }

    initPageScript(pageName) {
        const initFnName = 'init' + pageName.charAt(0).toUpperCase() + pageName.slice(1);
        if (typeof window[initFnName] === 'function') {
            window[initFnName]();
        }
    }

    // --- Notifications ---
    async initNotifications() {
        const btn = document.getElementById('notification-btn');
        const dropdown = document.getElementById('notification-dropdown');
        const markAllBtn = document.getElementById('mark-all-read');
        
        btn.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
        });
        
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        markAllBtn.addEventListener('click', async () => {
            await api.markNotificationsRead();
            this.renderNotifications();
        });
        
        document.addEventListener('notificationAdded', (e) => {
            this.showToast(e.detail.message, e.detail.type);
            this.renderNotifications();
        });
        
        this.renderNotifications();
    }
    
    async renderNotifications() {
        const notifs = await api.getNotifications();
        const unreadCount = notifs.filter(n => !n.read).length;
        
        const badge = document.getElementById('notification-badge');
        if (unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = unreadCount;
        } else {
            badge.style.display = 'none';
        }
        
        const list = document.getElementById('notification-list');
        list.innerHTML = notifs.length === 0 
            ? '<div style="padding: 24px; text-align: center; color: var(--text-secondary);">No new notifications</div>'
            : notifs.map(n => {
                let iconClass = 'notif-info';
                let iconName = 'info';
                if(n.type === 'success') { iconClass = 'notif-success'; iconName = 'check'; }
                if(n.type === 'warning' || n.type === 'error') { iconClass = 'notif-warning'; iconName = 'alert-triangle'; }
                
                return `
                <div class="notification-item ${n.read ? '' : 'unread'}">
                    <div class="notification-icon-wrapper ${iconClass}">
                        <i data-lucide="${iconName}"></i>
                    </div>
                    <div class="notification-text">
                        <p>${n.title}</p>
                        <p>${n.message}</p>
                        <span class="notification-time">${this.timeAgo(n.time)}</span>
                    </div>
                </div>
            `}).join('');
            
        if(window.lucide) lucide.createIcons();
    }

    // --- Search ---
    initSearch() {
        const input = document.getElementById('global-search');
        const dropdown = document.getElementById('search-results-dropdown');
        
        let timeout;
        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                dropdown.style.display = 'none';
                return;
            }
            
            timeout = setTimeout(async () => {
                const teachers = await api.getTeachers();
                const cheques = await api.getCheques();
                
                const cResults = teachers.filter(c => c.name.toLowerCase().includes(query) || c.account.includes(query));
                const chqResults = cheques.filter(c => c.number.includes(query) || c.amount.toString().includes(query));
                
                if (cResults.length === 0 && chqResults.length === 0) {
                    dropdown.innerHTML = '<div style="padding: 16px; color: var(--text-secondary);">No results found</div>';
                } else {
                    let html = '';
                    if (cResults.length > 0) {
                        html += '<div class="search-group">Teachers</div>';
                        cResults.forEach(c => {
                            html += `<div class="search-result-item" onclick="window.location.hash='#/teachers'">
                                <span class="search-result-title">${c.name}</span>
                                <span class="search-result-desc">A/C: ${c.account}</span>
                            </div>`;
                        });
                    }
                    if (chqResults.length > 0) {
                        html += '<div class="search-group">Cheques</div>';
                        chqResults.forEach(c => {
                            const cust = teachers.find(cus => cus.id === c.teacherId);
                            html += `<div class="search-result-item" onclick="window.location.hash='#/cheques'">
                                <span class="search-result-title">Cheque #${c.number}</span>
                                <span class="search-result-desc">${cust ? cust.name : 'Unknown'} • ${this.formatCurrency(c.amount)}</span>
                            </div>`;
                        });
                    }
                    dropdown.innerHTML = html;
                }
                dropdown.style.display = 'block';
            }, 300);
        });
        
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // --- Utilities ---
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconName = 'info';
        if(type === 'success') iconName = 'check';
        if(type === 'error') iconName = 'alert-triangle';
        
        toast.innerHTML = `
            <div class="toast-icon-wrapper">
                <i data-lucide="${iconName}"></i>
            </div>
            <span style="font-size: 14px; font-weight: 500;">${message}</span>
        `;
        
        container.appendChild(toast);
        if(window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    getBadgeClass(status) {
        switch(status) {
            case 'deposited':
            case 'cleared': return 'badge-emerald';
            case 'collected':
            case 'ready_for_deposit': return 'badge-amber';
            case 'bounced': return 'badge-red';
            case 'clearing': return 'badge-blue';
            case 'cancelled': return 'badge-slate';
            default: return 'badge-slate';
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    formatDate(dateString) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }
    
    timeAgo(dateParam) {
        const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
        const today = new Date();
        const seconds = Math.round((today - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

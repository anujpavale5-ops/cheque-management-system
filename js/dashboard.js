async function initDashboard() {
    setGreeting();
    await loadStats();
    await loadRecentCheques();
}

function setGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';
    
    document.getElementById('greeting-title').textContent = `${greeting}, Anuj`;
}

async function loadStats() {
    try {
        const stats = await api.getDashboardStats();
        
        const statsHtml = `
            <div class="card stat-card">
                <span class="stat-title">Total Teachers</span>
                <span class="stat-value">${stats.totalTeachers}</span>
                <span class="stat-change positive"><i data-lucide="trending-up" style="width:14px;"></i> 2 this week</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">Total Cheques</span>
                <span class="stat-value">${stats.totalCheques}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">Pending Deposit</span>
                <span class="stat-value">${stats.pendingDeposit}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">Deposited</span>
                <span class="stat-value">${stats.deposited}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-title">Cleared</span>
                <span class="stat-value">${stats.cleared}</span>
            </div>
            <div class="card stat-card" style="border-left: 4px solid var(--error);">
                <span class="stat-title">Bounced</span>
                <span class="stat-value">${stats.bounced}</span>
            </div>
        `;
        
        document.getElementById('dashboard-stats').innerHTML = statsHtml;
        if(window.lucide) lucide.createIcons();
    } catch (e) {
        console.error("Error loading stats", e);
    }
}

async function loadRecentCheques() {
    try {
        const cheques = await api.getCheques();
        const teachers = await api.getTeachers();
        
        // Sort by date desc and take top 5
        const recent = cheques.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        const tbody = document.getElementById('recent-cheques-table');
        
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:var(--text-secondary);">No cheques found.</td></tr>';
            return;
        }
        
        let html = '';
        recent.forEach(cheque => {
            const teacher = teachers.find(c => c.id === cheque.teacherId);
            html += `
                <tr>
                    <td style="font-weight: 500;">${cheque.number}</td>
                    <td>${teacher ? teacher.name : 'Unknown'}</td>
                    <td class="amount">${window.formatCurrency(cheque.amount)}</td>
                    <td>${window.formatDate(cheque.date)}</td>
                    <td><span class="badge ${window.getBadgeClass(cheque.status)}">${cheque.status.replace(/_/g, ' ')}</span></td>
                    <td>
                        <button class="btn btn-text" onclick="window.location.hash='#/cheques'">View</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        if(window.lucide) lucide.createIcons();
        
    } catch (e) {
        console.error("Error loading recent cheques", e);
    }
}

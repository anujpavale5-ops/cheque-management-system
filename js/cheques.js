let allCheques = [];
let allTeachers = [];

async function initCheques() {
    document.getElementById('cheque-search').addEventListener('input', debounce(renderChequesTable, 300));
    document.getElementById('status-filter').addEventListener('change', renderChequesTable);
    
    await loadChequesData();
}

async function loadChequesData() {
    const tbody = document.getElementById('cheques-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner" style="width:20px;height:20px;margin:auto;"></div></td></tr>';
    
    allCheques = await api.getCheques();
    allTeachers = await api.getTeachers();
    
    renderChequesTable();
}

function renderChequesTable() {
    const searchTerm = document.getElementById('cheque-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    let filtered = allCheques.filter(c => {
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchSearch = c.number.includes(searchTerm) || c.amount.toString().includes(searchTerm);
        return matchStatus && matchSearch;
    });
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tbody = document.getElementById('cheques-table-body');
    document.getElementById('cheque-count-info').textContent = `Showing ${filtered.length} cheques`;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:var(--text-secondary); padding: 32px;">No cheques found matching criteria.</td></tr>';
        return;
    }
    
    let html = '';
    filtered.forEach(c => {
        const teacher = allTeachers.find(cust => cust.id === c.teacherId);
        html += `
            <tr>
                <td style="font-weight: 500;">${c.number}</td>
                <td>${teacher ? teacher.name : 'Unknown'}</td>
                <td class="amount">${window.formatCurrency(c.amount)}</td>
                <td>${window.formatDate(c.date)}</td>
                <td>${window.formatDate(c.collectedDate)}</td>
                <td><span class="badge ${window.getBadgeClass(c.status)}">${c.status.replace(/_/g, ' ')}</span></td>
                <td>
                    <button class="btn btn-text" onclick="viewCheque('${c.id}')">View</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function viewCheque(id) {
    const cheque = allCheques.find(c => c.id === id);
    const teacher = allTeachers.find(c => c.id === cheque.teacherId);
    
    if (!cheque) return;
    
    document.getElementById('modal-cheque-title').textContent = `Cheque #${cheque.number}`;
    
    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <div>
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">Teacher</p>
                <p style="font-weight: 500; color: var(--text-primary);">${teacher ? teacher.name : 'Unknown'}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">Amount</p>
                <p style="font-weight: 600; font-size: 18px; color: var(--text-primary);">${window.formatCurrency(cheque.amount)}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">Bank</p>
                <p style="font-weight: 500; color: var(--text-primary);">${cheque.bank}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">Cheque Date</p>
                <p style="font-weight: 500; color: var(--text-primary);">${window.formatDate(cheque.date)}</p>
            </div>
            <div style="grid-column: span 2;">
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Current Status</p>
                <span class="badge ${window.getBadgeClass(cheque.status)}">${cheque.status.replace(/_/g, ' ')}</span>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Change Status To</label>
            <select class="form-control" id="modal-status-select">
                <option value="collected" ${cheque.status==='collected'?'selected':''}>Collected</option>
                <option value="ready_for_deposit" ${cheque.status==='ready_for_deposit'?'selected':''}>Ready for Deposit</option>
                <option value="deposited" ${cheque.status==='deposited'?'selected':''}>Deposited</option>
                <option value="cleared" ${cheque.status==='cleared'?'selected':''}>Cleared</option>
                <option value="bounced" ${cheque.status==='bounced'?'selected':''}>Bounced</option>
            </select>
        </div>
    `;
    
    document.getElementById('modal-cheque-content').innerHTML = html;
    if(window.lucide) lucide.createIcons();
    
    const updateBtn = document.getElementById('btn-change-status');
    const newUpdateBtn = updateBtn.cloneNode(true);
    updateBtn.parentNode.replaceChild(newUpdateBtn, updateBtn);
    
    newUpdateBtn.addEventListener('click', async () => {
        const newStatus = document.getElementById('modal-status-select').value;
        if(newStatus !== cheque.status) {
            newUpdateBtn.disabled = true;
            newUpdateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;display:inline-block;vertical-align:middle;border-top-color:#fff;"></div>';
            await api.updateChequeStatus(cheque.id, newStatus);
            closeChequeModal();
            await loadChequesData();
        } else {
            closeChequeModal();
        }
    });
    
    document.getElementById('cheque-modal').classList.add('active');
}

function closeChequeModal() {
    document.getElementById('cheque-modal').classList.remove('active');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

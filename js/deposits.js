let readyCheques = [];

async function initDeposits() {
    await loadDepositData();
    
    document.getElementById('select-all-deposits')?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.dep-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
}

async function loadDepositData() {
    const cheques = await api.getCheques();
    const teachers = await api.getTeachers();
    
    // Status 'collected' or 'ready_for_deposit'
    readyCheques = cheques.filter(c => c.status === 'collected' || c.status === 'ready_for_deposit');
    const pendingAmt = readyCheques.reduce((sum, c) => sum + c.amount, 0);
    
    document.getElementById('dep-pending-count').textContent = `${readyCheques.length} cheques`;
    document.getElementById('dep-pending-amt').textContent = window.formatCurrency(pendingAmt);
    
    const tbody = document.getElementById('ready-deposit-table');
    
    if (readyCheques.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-secondary); padding: 32px;">No cheques ready for deposit.</td></tr>';
        return;
    }
    
    let html = '';
    readyCheques.forEach(c => {
        const teacher = teachers.find(cust => cust.id === c.teacherId);
        html += `
            <tr>
                <td><input type="checkbox" class="dep-checkbox" value="${c.id}"></td>
                <td style="font-weight: 500;">${c.number}</td>
                <td>${teacher ? teacher.name : 'Unknown'}</td>
                <td class="amount">${window.formatCurrency(c.amount)}</td>
                <td><span class="badge ${window.getBadgeClass(c.status)}">${c.status.replace(/_/g, ' ')}</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function createDepositBatch() {
    const checkboxes = document.querySelectorAll('.dep-checkbox:checked');
    if (checkboxes.length === 0) {
        window.showToast('Please select at least one cheque to deposit.', 'error');
        return;
    }
    
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        for(let id of selectedIds) {
            await api.updateChequeStatus(id, 'deposited');
        }
        
        await api.addNotification({
            title: 'Deposit Batch Created',
            message: `Batch #DB-${new Date().toISOString().slice(0,10).replace(/-/g,'')} created with ${selectedIds.length} cheques.`,
            type: 'success'
        });
        
        window.showToast(`Batch created with ${selectedIds.length} cheques!`, 'success');
        
        document.getElementById('dep-today-count').textContent = selectedIds.length;
        
        await loadDepositData(); 
        
    } catch (e) {
        window.showToast('Failed to create batch.', 'error');
    }
}

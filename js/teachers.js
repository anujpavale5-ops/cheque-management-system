async function initTeachers() {
    await loadTeachersData();
}

async function loadTeachersData() {
    const tbody = document.getElementById('teachers-table-body');
    
    try {
        const teachers = await api.getTeachers();
        const cheques = await api.getCheques();
        
        if (teachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--text-secondary); padding: 32px;">No teachers found.</td></tr>';
            return;
        }
        
        let html = '';
        teachers.forEach(c => {
            const teacherCheques = cheques.filter(chq => chq.teacherId === c.id);
            const maskAccount = c.account.slice(0, -4).replace(/./g, 'X') + c.account.slice(-4);
            
            html += `
                <tr>
                    <td>
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">${c.name}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">${c.email}</div>
                    </td>
                    <td style="font-family: monospace; color: var(--text-secondary);">${maskAccount}</td>
                    <td style="color: var(--text-secondary);">${c.phone}</td>
                    <td>
                        <span class="badge badge-slate" style="background-color: var(--bg-color); border: 1px solid var(--border); color: var(--text-primary);">
                            ${teacherCheques.length} Cheques
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-text" onclick="window.showToast('Profile view simulated', 'info')">View Profile</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (e) {
        console.error("Error loading teachers", e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--error); padding: 32px;">Error loading data.</td></tr>';
    }
}

function openAddTeacherModal() {
    document.getElementById('add-teacher-form').reset();
    document.getElementById('add-teacher-modal').style.display = 'flex';
}

function closeAddTeacherModal() {
    document.getElementById('add-teacher-modal').style.display = 'none';
}

async function submitAddTeacher(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-teacher');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div>';
    
    const teacher = {
        name: document.getElementById('t-name').value,
        email: document.getElementById('t-email').value,
        phone: document.getElementById('t-phone').value,
        account: document.getElementById('t-account').value
    };
    
    try {
        await api.addTeacher(teacher);
        window.showToast('Teacher added successfully!', 'success');
        closeAddTeacherModal();
        await loadTeachersData();
    } catch (err) {
        window.showToast('Failed to add teacher.', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Teacher';
    }
}

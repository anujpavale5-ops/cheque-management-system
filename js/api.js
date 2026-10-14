// True API Layer connected to FastAPI Backend

const BASE_URL = "http://127.0.0.1:8000/api";

const api = {
    // Utility delay
    delay: (ms = 300) => new Promise(resolve => setTimeout(resolve, ms)),

    // Teachers
    async getTeachers() {
        try {
            const res = await fetch(`${BASE_URL}/teachers`);
            if (!res.ok) return [];
            const data = await res.json();
            // Map backend schema to frontend expectation
            return data.map(t => ({
                id: String(t.id),
                name: t.name,
                account: t.account_number || '',
                phone: t.phone || '',
                email: t.email || ''
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    
    async addTeacher(teacher) {
        const payload = {
            name: teacher.name,
            account_number: teacher.account,
            phone: teacher.phone,
            email: teacher.email,
            address: ""
        };
        const res = await fetch(`${BASE_URL}/teachers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const t = await res.json();
        return {
            id: String(t.id),
            name: t.name,
            account: t.account_number,
            phone: t.phone,
            email: t.email
        };
    },

    // Cheques
    async getCheques() {
        try {
            const res = await fetch(`${BASE_URL}/cheques`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.map(c => ({
                id: String(c.id),
                number: c.cheque_number || 'Unknown',
                teacherId: String(c.teacher_id),
                amount: c.amount || 0,
                date: c.cheque_date ? c.cheque_date.split('T')[0] : '2026-01-01',
                status: c.status ? c.status.toLowerCase() : 'collected',
                collectedDate: c.created_at ? c.created_at.split('T')[0] : '2026-01-01',
                bank: c.bank_name || 'Unknown'
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    
    async addCheque(cheque) {
        const payload = {
            teacher_id: parseInt(cheque.teacherId),
            cheque_number: cheque.number,
            account_number: cheque.account || "Unknown",
            bank_name: cheque.bank || "Unknown",
            amount: parseFloat(cheque.amount),
            cheque_date: cheque.date || new Date().toISOString().split('T')[0],
            status: "COLLECTED",
            ocr_confidence: cheque.confidence || 0.95
        };
        
        try {
            const res = await fetch(`${BASE_URL}/cheques/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const c = await res.json();
            
            await this.addNotification({
                title: 'New Cheque Saved',
                message: `Cheque #${c.cheque_number} securely saved to Database.`,
                type: 'success'
            });
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    },
    
    async updateChequeStatus(id, newStatus) {
        try {
            const res = await fetch(`${BASE_URL}/cheques/${id}/status?status=${newStatus.toUpperCase()}`, {
                method: 'PATCH'
            });
            if (!res.ok) return false;
            
            await this.addNotification({
                title: 'Status Updated',
                message: `Cheque status changed to ${newStatus.replace('_', ' ')}.`,
                type: 'info'
            });
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    },

    // Notifications (Keep in localStorage for now as it's UI state)
    async getNotifications() {
        const data = JSON.parse(localStorage.getItem('chequeTrackerData')) || { notifications: [] };
        return (data.notifications || []).sort((a,b) => new Date(b.time) - new Date(a.time));
    },
    async addNotification(notif) {
        const data = JSON.parse(localStorage.getItem('chequeTrackerData')) || { notifications: [] };
        const newNotif = { 
            ...notif, 
            id: 'NOTIF-' + Math.floor(Math.random()*10000), 
            time: new Date().toISOString(),
            read: false 
        };
        if(!data.notifications) data.notifications = [];
        data.notifications.push(newNotif);
        localStorage.setItem('chequeTrackerData', JSON.stringify(data));
        
        document.dispatchEvent(new CustomEvent('notificationAdded', { detail: newNotif }));
        return newNotif;
    },
    async markNotificationsRead() {
        const data = JSON.parse(localStorage.getItem('chequeTrackerData')) || { notifications: [] };
        if(data.notifications) {
            data.notifications.forEach(n => n.read = true);
            localStorage.setItem('chequeTrackerData', JSON.stringify(data));
        }
        return true;
    },

    // Dashboard Stats
    async getDashboardStats() {
        // Fetch fresh from backend
        const cheques = await this.getCheques();
        const teachers = await this.getTeachers();
        
        return {
            totalTeachers: teachers.length,
            totalCheques: cheques.length,
            pendingDeposit: cheques.filter(c => c.status === 'collected' || c.status === 'ready_for_deposit').length,
            deposited: cheques.filter(c => c.status === 'deposited').length,
            cleared: cheques.filter(c => c.status === 'cleared').length,
            bounced: cheques.filter(c => c.status === 'bounced').length
        };
    },

    // Scrutiny connected to FastAPI OpenCV Pipeline
    async runChequeScrutiny(file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/ocr/scrutinize", {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("API failed");
            return await response.json();
        } catch (error) {
            return {
                is_cheque: false,
                confidence: 0,
                image_quality: "poor",
                document_boundary: false,
                reason: "Request Failed",
                issues: ["Could not connect to the ML backend."]
            };
        }
    },

    // OCR Extraction connected to FastAPI Pipeline
    async processOCR(file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/ocr/process", {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("API failed");
            return await response.json();
        } catch (error) {
            return {
                number: "000000",
                amount: 0,
                date: "2026-01-01",
                payee: "Unknown",
                account: "XXXX0000",
                bank: "Unknown Bank",
                confidence: 0.0
            };
        }
    }
};

// Initial mock data structure
const initialData = {
    teachers: [
        { id: 'CUST-001', name: 'Rahul Sharma', account: '123456789012', phone: '+91 9876543210', email: 'rahul.s@example.com' },
        { id: 'CUST-002', name: 'Amit Patil', account: '987654321098', phone: '+91 9123456789', email: 'amit.p@example.com' },
        { id: 'CUST-003', name: 'Priya Shah', account: '456789012345', phone: '+91 9988776655', email: 'priya.s@example.com' },
        { id: 'CUST-004', name: 'Sneha Kulkarni', account: '112233445566', phone: '+91 9876512345', email: 'sneha.k@example.com' },
        { id: 'CUST-005', name: 'Rohan Deshmukh', account: '998877665544', phone: '+91 9122334455', email: 'rohan.d@example.com' }
    ],
    cheques: [
        { id: 'CHQ-001', number: '458721', teacherId: 'CUST-001', amount: 25000, date: '2026-08-25', status: 'deposited', collectedDate: '2026-08-25', bank: 'HDFC Bank' },
        { id: 'CHQ-002', number: '458722', teacherId: 'CUST-002', amount: 12500, date: '2026-08-25', status: 'collected', collectedDate: '2026-08-25', bank: 'ICICI Bank' },
        { id: 'CHQ-003', number: '458723', teacherId: 'CUST-003', amount: 8000, date: '2026-08-24', status: 'cleared', collectedDate: '2026-08-22', bank: 'SBI' },
        { id: 'CHQ-004', number: '112233', teacherId: 'CUST-004', amount: 50000, date: '2026-08-20', status: 'bounced', collectedDate: '2026-08-20', bank: 'Axis Bank' },
        { id: 'CHQ-005', number: '998877', teacherId: 'CUST-005', amount: 15000, date: '2026-08-26', status: 'ready_for_deposit', collectedDate: '2026-08-25', bank: 'Kotak Bank' }
    ],
    notifications: [
        { id: 'NOTIF-001', title: 'Cheque #458721 deposited', message: '₹25,000 deposited for Rahul Sharma', time: new Date(Date.now() - 1000 * 60 * 2).toISOString(), read: false, type: 'info' },
        { id: 'NOTIF-002', title: 'New cheque added', message: 'Cheque #458722 collected from Amit Patil', time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), read: false, type: 'info' },
        { id: 'NOTIF-003', title: 'Cheque Cleared', message: 'Cheque #458723 (₹8,000) has been cleared.', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true, type: 'success' }
    ],
    depositBatches: []
};

// Initialize localStorage if empty
function initializeData() {
    const existing = localStorage.getItem('chequeTrackerData');
    if (!existing) {
        localStorage.setItem('chequeTrackerData', JSON.stringify(initialData));
    } else {
        // Auto-migrate old 'customers' to 'teachers' if needed
        try {
            let data = JSON.parse(existing);
            if (data.customers && !data.teachers) {
                data.teachers = data.customers;
                delete data.customers;
                localStorage.setItem('chequeTrackerData', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Migration error", e);
        }
    }
}

// Generate random ID
function generateId(prefix) {
    return `${prefix}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

// Data Access Layer
const db = {
    get: function() {
        return JSON.parse(localStorage.getItem('chequeTrackerData'));
    },
    save: function(data) {
        localStorage.setItem('chequeTrackerData', JSON.stringify(data));
    }
};

// Run on load
initializeData();

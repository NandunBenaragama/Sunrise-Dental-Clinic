// Dynamic Base URL Configuration
const API_ENDPOINTS = [
    'http://localhost:8080/Sunrise_Dental_Clinic/webresources'
];

// Strict Token Auth Guard: Token එකක් හෝ Doctor session එකක් නොමැති නම් කෙලින්ම Login එකට Redirect කිරීම
(function checkDoctorAuth() {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    const doctor = localStorage.getItem('doctorName') || localStorage.getItem('loggedUser');

    if (!token || !doctor) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
})();

// Browser Back Button Cache Guard: Logout වූ පසු Browser එකේ Back button එක එබූ විට නැවත ඒම වළක්වයි
window.addEventListener('pageshow', function(event) {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (event.persisted || !token || !localStorage.getItem('loggedUser')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
});

// Doctor Clean Logout Handler
function logoutDoctor() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('login.html');
}

let loggedDoctorName = localStorage.getItem('doctorName') || localStorage.getItem('loggedUser') || 'Doctor';

// Helper Function: Match doctor records accurately (handles "Dr.", extra spaces, and case-insensitivity)
function isMatchingDoctor(recordDocName, currentDoc) {
    if (!recordDocName || !currentDoc) return false;
    
    const clean = (str) => str.toString().toLowerCase().replace(/^dr\.?\s*/i, '').replace(/[^a-z0-9]/g, '').trim();
    
    const target = clean(currentDoc);
    const incoming = clean(recordDocName);
    
    return incoming.includes(target) || target.includes(incoming);
}

async function apiFetch(endpoint, options = {}) {
    let opts = { ...options };
    if (!opts.headers) opts.headers = {};
    
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (token) {
        opts.headers['Authorization'] = 'Bearer ' + token;
    }

    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
        opts.headers['Content-Type'] = 'application/json';
    }

    let lastError = null;
    for (const baseUrl of API_ENDPOINTS) {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, opts);
            if (res.ok) return await res.json();
            const errText = await res.text();
            lastError = new Error(`HTTP ${res.status}: ${errText}`);
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error('API connection failed');
}

// 1. Dynamic Component Loader
async function loadDoctorComponents() {
    const navNameEl = document.getElementById('docNavName');
    if (navNameEl) navNameEl.innerText = 'Dr. ' + loggedDoctorName.replace(/^dr\.?\s*/i, '');

    const docHeroName = document.getElementById('docHeroName');
    if (docHeroName) docHeroName.innerText = 'Welcome back, Dr. ' + loggedDoctorName.replace(/^dr\.?\s*/i, '');

    const files = [
        'doctor_dashboard/appointments.html',
        'doctor_dashboard/patient_history.html',
        'doctor_dashboard/invoices.html',
        'doctor_dashboard/guide.html'
    ];

    const contentArea = document.getElementById('doctor-dynamic-content');
    if (contentArea) {
        contentArea.innerHTML = '';
        for (const file of files) {
            try {
                const res = await fetch(file);
                if (res.ok) {
                    contentArea.innerHTML += await res.text();
                }
            } catch (e) {
                console.error('Failed to load component:', file);
            }
        }
    }

    fetchDoctorAppointments();
    fetchDoctorBills();
    fetchDoctorPatientHistory();

    // Default පළමු Tab එක Auto Open කිරීම
    setTimeout(() => {
        switchTab('appointments-tab');
    }, 50);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    let target = document.getElementById(tabId);
    let btn = document.getElementById('tab-btn-' + tabId);

    // Fallback ID normalization
    if (!target && tabId === 'appointments-tab') target = document.getElementById('my-appointments');
    if (!target && tabId === 'my-appointments') target = document.getElementById('appointments-tab');

    if (!btn && tabId === 'appointments-tab') btn = document.getElementById('tab-btn-my-appointments');
    if (!btn && tabId === 'my-appointments') btn = document.getElementById('tab-btn-appointments-tab');

    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');

    if (tabId === 'appointments-tab' || tabId === 'my-appointments') {
        fetchDoctorAppointments();
    } else if (tabId === 'invoices-tab' || tabId === 'my-invoices') {
        fetchDoctorBills();
    } else if (tabId === 'patient-history-tab' || tabId === 'patient-history') {
        fetchDoctorPatientHistory();
    }
}

// 2. Fetch Doctor Appointments (Strict Doctor-Only Filter)
async function fetchDoctorAppointments() {
    try {
        const list = await apiFetch('/all_appointments');
        const tbody = document.getElementById('docApptBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Filter appointments belonging ONLY to the logged doctor
        const myAppts = (Array.isArray(list) ? list : []).filter(a => {
            const doc = a.dentist_name || a.dentistName || '';
            return isMatchingDoctor(doc, loggedDoctorName);
        });

        const statAppt = document.getElementById('statApptCount');
        if (statAppt) statAppt.innerText = myAppts.length;

        let pendingCount = 0;
        let completedCount = 0;

        if (myAppts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#64748b; padding:20px;">No appointments assigned to you.</td></tr>';
            if (document.getElementById('statPendingCount')) document.getElementById('statPendingCount').innerText = '0';
            if (document.getElementById('statCompletedCount')) document.getElementById('statCompletedCount').innerText = '0';
            return;
        }

        myAppts.forEach(a => {
            const apptNo = a.appointment_num || a.appointment_no || a.id || '-';
            const patId = a.patient_id || 'PAT-001';
            const pName = a.patient_name || a.name || 'Patient';
            const treatment = a.treatment_type || '-';
            const dateTime = a.appt_date_time || '-';
            const st = a.status || 'Pending';

            if (st.toLowerCase() === 'pending') pendingCount++;
            if (st.toLowerCase() === 'completed' || st.toLowerCase() === 'done') completedCount++;

            let badgeClass = 'badge-pending';
            if (st.toLowerCase() === 'done') {
                badgeClass = 'badge-done';
            } else if (st.toLowerCase() === 'completed') {
                badgeClass = 'badge-completed';
            }

            const safePName = pName.replace(/'/g, "\\'");
            const safeTreat = treatment.replace(/'/g, "\\'");

            tbody.innerHTML += `
                <tr>
                    <td><strong>${apptNo}</strong></td>
                    <td><span style="color:var(--teal-700); font-weight:700;">${patId}</span></td>
                    <td><strong>${pName}</strong></td>
                    <td>${treatment}</td>
                    <td>${dateTime}</td>
                    <td><span class="badge ${badgeClass}">${st}</span></td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <select id="statusSelect_${apptNo}" class="select-status">
                                <option value="Pending" ${st==='Pending'?'selected':''}>Pending</option>
                                <option value="Done" ${st==='Done'?'selected':''}>Done</option>
                                <option value="Completed" ${st==='Completed'?'selected':''}>Completed</option>
                            </select>
                            <button class="btn-update" onclick="updateAppointmentStatus('${apptNo}')">Save</button>
                        </div>
                    </td>
                    <td>
                        <button class="btn-calc" onclick="calculateBillViaAPI('${apptNo}', '${safePName}', '${safeTreat}')">Calculate</button>
                    </td>
                </tr>`;
        });

        const statPending = document.getElementById('statPendingCount');
        if (statPending) statPending.innerText = pendingCount;

        const statCompleted = document.getElementById('statCompletedCount');
        if (statCompleted) statCompleted.innerText = completedCount;

    } catch (e) {
        console.error('Fetch appointments error:', e);
        const tbody = document.getElementById('docApptBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">Failed to load appointments.</td></tr>';
    }
}

// 3. Update Appointment Status in Database
window.updateAppointmentStatus = async function(apptNo) {
    const selectEl = document.getElementById('statusSelect_' + apptNo);
    if (!selectEl) {
        alert('Status dropdown not found for ' + apptNo);
        return;
    }

    const newStatus = selectEl.value;

    try {
        const res = await apiFetch('/update_appointment_status', {
            method: 'POST',
            body: {
                appointmentNumber: apptNo,
                status: newStatus
            }
        });

        alert(`Appointment ${apptNo} status successfully updated to "${newStatus}"!`);
        fetchDoctorAppointments();
    } catch (err) {
        console.error('Update status error:', err);
        alert('Failed to update status in Database: ' + err.message);
    }
};

// 4. Fetch Issued Bills (Filtered strictly by Assigned Doctor)
async function fetchDoctorBills() {
    try {
        const [billsList, apptsList] = await Promise.all([
            apiFetch('/bills'),
            apiFetch('/all_appointments')
        ]);

        const tbody = document.getElementById('docBillBody');
        const statBill = document.getElementById('statBillCount');
        const statRev = document.getElementById('statRevenueCount');

        const myApptNumbers = new Set(
            (Array.isArray(apptsList) ? apptsList : [])
                .filter(a => isMatchingDoctor(a.dentist_name || a.dentistName, loggedDoctorName))
                .map(a => a.appointment_num || a.appointment_no)
        );

        let billsArray = (Array.isArray(billsList) ? billsList : []).filter(b => {
            const apptNo = b.appointment_num || b.appointmentNum;
            return myApptNumbers.has(apptNo);
        });

        if (statBill) statBill.innerText = billsArray.length;
        if (tbody) tbody.innerHTML = '';

        let totalRevenue = 0;

        if (billsArray.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:20px;">No invoices issued for your appointments yet.</td></tr>';
            if (statRev) statRev.innerText = '0.00';
            return;
        }

        billsArray.forEach(b => {
            const bId = 'BIL-' + (b.bill_id || b.billId || b.id || '0');
            const apptNo = b.appointment_num || b.appointmentNum || '-';
            const patName = b.patient_name || b.patientName || '-';
            const treat = b.treatment_type || b.treatmentType || '-';
            
            const consult = parseFloat(b.consultation_fee || b.consultationFee || 2000) || 0;
            const treatFee = parseFloat(b.treatment_fee || b.treatmentFee || 0) || 0;
            let total = parseFloat(b.total_amount || b.totalAmount || (consult + treatFee)) || 0;

            totalRevenue += total;

            if (tbody) {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${bId}</strong></td>
                        <td>${apptNo}</td>
                        <td><strong>${patName}</strong></td>
                        <td>${treat}</td>
                        <td>LKR ${consult.toFixed(2)}</td>
                        <td>LKR ${treatFee.toFixed(2)}</td>
                        <td><strong style="color:var(--success);">LKR ${total.toFixed(2)}</strong></td>
                    </tr>`;
            }
        });

        if (statRev) {
            statRev.innerText = totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

    } catch (e) {
        console.error('Failed to load bills:', e);
        const tbody = document.getElementById('docBillBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Failed to load invoices.</td></tr>';
    }
}

// 5. Live Bill Calculation
window.calculateBillViaAPI = async function(apptNum, pName, treatment) {
    try {
        let fee = 3000.00;
        const tLower = (treatment || '').toLowerCase();
        if (tLower.includes('clean')) fee = 5000.00;
        else if (tLower.includes('fill')) fee = 4000.00;
        else if (tLower.includes('root')) fee = 25000.00;
        else if (tLower.includes('extract')) fee = 6000.00;

        const total = 2000.00 + fee;

        const section = document.getElementById('invoiceSection');
        if (section) section.style.display = 'block';

        const billAppt = document.getElementById('billAppt');
        const billName = document.getElementById('billName');
        const billTreatment = document.getElementById('billTreatment');
        const billTreatmentFee = document.getElementById('billTreatmentFee');
        const billTotal = document.getElementById('billTotal');
        const billDate = document.getElementById('billDate');

        if (billAppt) billAppt.innerText = apptNum;
        if (billName) billName.innerText = pName;
        if (billTreatment) billTreatment.innerText = treatment;
        if (billTreatmentFee) billTreatmentFee.innerText = fee.toFixed(2);
        if (billTotal) billTotal.innerText = 'LKR ' + total.toFixed(2);
        if (billDate) billDate.innerText = new Date().toLocaleString();

        const fAppt = document.getElementById('formApptNum');
        const fName = document.getElementById('formPName');
        const fTreat = document.getElementById('formTreatment');
        const fTreatFee = document.getElementById('formTreatmentFee');
        const fTotal = document.getElementById('formTotalAmount');

        if (fAppt) fAppt.value = apptNum;
        if (fName) fName.value = pName;
        if (fTreat) fTreat.value = treatment;
        if (fTreatFee) fTreatFee.value = fee;
        if (fTotal) fTotal.value = total;

        if (section) section.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert('Calculation failed: ' + err.message);
    }
};

// 6. Save Bill to Database
window.handleSaveBill = async function(e) {
    if (e) e.preventDefault();

    const apptNum = document.getElementById('formApptNum')?.value;
    const pName = document.getElementById('formPName')?.value;
    const treatment = document.getElementById('formTreatment')?.value;
    const consultFee = parseFloat(document.getElementById('formConsultFee')?.value) || 2000.00;
    const treatFee = parseFloat(document.getElementById('formTreatmentFee')?.value) || 0.00;
    const totalAmount = parseFloat(document.getElementById('formTotalAmount')?.value) || (consultFee + treatFee);

    if (!apptNum || !pName) {
        alert('Please calculate an appointment bill first.');
        return;
    }

    const payload = {
        appointmentNumber: apptNum,
        patientName: pName,
        treatment: treatment,
        consultationFee: consultFee,
        treatmentFee: treatFee,
        totalAmount: totalAmount
    };

    try {
        let res;
        try {
            res = await apiFetch('/save_bill', { method: 'POST', body: payload });
        } catch (err1) {
            res = await apiFetch('/bills', { method: 'POST', body: payload });
        }

        alert('Invoice Issued & Saved to Database Successfully!');
        const section = document.getElementById('invoiceSection');
        if (section) section.style.display = 'none';

        fetchDoctorBills();
        switchTab('invoices-tab');
    } catch (err) {
        console.error('Save bill error:', err);
        alert('Failed to save invoice: ' + err.message);
    }
};

// 7. Fetch Patient History (Strict Doctor-Only Filter)
async function fetchDoctorPatientHistory() {
    try {
        const list = await apiFetch('/all_appointments');
        const tbody = document.getElementById('patientHistoryBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        let myHistory = (Array.isArray(list) ? list : []).filter(a => {
            const doc = a.dentist_name || a.dentistname || '';
            return isMatchingDoctor(doc, loggedDoctorName);
        });

        if (myHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:20px;">No patient treatment history found for you.</td></tr>';
            return;
        }

        myHistory.forEach(item => {
            const patId = item.patient_id || 'PAT-001';
            const patName = item.patient_name || item.name || 'Patient';
            const contact = item.patient_contact || item.contact || '-';
            const apptNo = item.appointment_num || item.appointment_no || '-';
            const treatment = item.treatment_type || '-';
            const dt = item.appt_date_time || '-';
            const st = item.status || 'Pending';

            let badgeClass = 'badge-pending';
            if (st.toLowerCase() === 'done') {
                badgeClass = 'badge-done';
            } else if (st.toLowerCase() === 'completed') {
                badgeClass = 'badge-completed';
            }

            tbody.innerHTML += `
                <tr>
                    <td><strong style="color:var(--teal-700);">${patId}</strong></td>
                    <td><strong>${patName}</strong></td>
                    <td>${contact}</td>
                    <td><strong>${apptNo}</strong></td>
                    <td>${treatment}</td>
                    <td>${dt}</td>
                    <td><span class="badge ${badgeClass}">${st}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Failed to load patient history:', err);
        const tbody = document.getElementById('patientHistoryBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Failed to load patient history.</td></tr>';
    }
}

// 8. Table Search Filter
function filterTable(tableId, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tableId);
    if (!table) return;
    const tr = table.getElementsByTagName('tr');
    for (let i = 1; i < tr.length; i++) {
        let show = false;
        const td = tr[i].getElementsByTagName('td');
        for (let j = 0; j < td.length; j++) {
            if (td[j] && (td[j].textContent || td[j].innerText).toUpperCase().indexOf(filter) > -1) {
                show = true;
                break;
            }
        }
        tr[i].style.display = show ? '' : 'none';
    }
}

// 9. Smooth-scroll helper for the continuous doctor dashboard nav.
// switchTab() still runs first (keeps its existing active-state/data-refresh
// behaviour) — this only adds the visible scroll for the now-always-visible sections.
function scrollToSection(tabId) {
    let el = document.getElementById(tabId);
    if (!el && tabId === 'appointments-tab') el = document.getElementById('my-appointments');
    if (!el && tabId === 'my-appointments') el = document.getElementById('appointments-tab');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.addEventListener('DOMContentLoaded', loadDoctorComponents);
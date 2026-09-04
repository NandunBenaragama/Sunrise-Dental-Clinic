// Strict Token Auth Guard: User කෙනෙක් හෝ Token එකක් නැතිනම් කෙලින්ම Login පිටුවට Redirect කරයි
(function checkAuth() {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    const user = localStorage.getItem('loggedUser');
    if (!token || !user) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
})();

// Browser Back Button Cache Guard: Back button එබූ විට Cache එකෙන් පැමිණීම වළක්වයි
window.addEventListener('pageshow', function(event) {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (event.persisted || !token || !localStorage.getItem('loggedUser')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
});

// Dynamic Base URL Configuration
const API_ENDPOINTS = [
    'http://localhost:8080/Sunrise_Dental_Clinic/api',
    'http://localhost:8080/Sunrise_Dental_Clinic-1.0-SNAPSHOT/api',
    'http://localhost:8080/Sunrise%20Dental%20Clinic/api'
];

let allPatientsCache = [];

async function apiFetch(endpoint, options = {}) {
    let finalOptions = { ...options };
    if (!finalOptions.headers) {
        finalOptions.headers = {};
    }
    
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (token) {
        finalOptions.headers['Authorization'] = 'Bearer ' + token;
    }

    if (finalOptions.body && typeof finalOptions.body === 'object') {
        finalOptions.body = JSON.stringify(finalOptions.body);
        finalOptions.headers['Content-Type'] = 'application/json';
    }

    let lastError = null;
    for (const baseUrl of API_ENDPOINTS) {
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, finalOptions);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            lastError = e;
        }
    }
    throw new Error(lastError ? lastError.message : 'Failed to connect to API');
}

// 1. Component Loader & Dynamic Form Event Binder
async function loadComponents() {
    const loggedUser = localStorage.getItem('loggedUser') || localStorage.getItem('username') || 'Staff Officer';
    const navStaffName = document.getElementById('navStaffName');
    if (navStaffName) {
        navStaffName.innerText = loggedUser;
    }

    const files = [
        'staff_dashboard/register_doctor.html',
        'staff_dashboard/register_patient.html',
        'staff_dashboard/add_treatment.html',
        'staff_dashboard/new_appointment.html',
        'staff_dashboard/appointments.html',
        'staff_dashboard/saved_receipts.html',
        'staff_dashboard/staff_guide.html'
    ];

    const contentArea = document.getElementById('dynamic-content-area');
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

    try {
        const printRes = await fetch('staff_dashboard/print_receipt_template.html');
        const printContainer = document.getElementById('print-template-container');
        if (printContainer && printRes.ok) {
            printContainer.innerHTML = await printRes.text();
        }
    } catch(e) {}

    bindFormEvents();
    fetchAllData();

    // Default පළමු Tab එක Auto Open කිරීම
    setTimeout(() => {
        switchTab('add-doctor');
    }, 50);
}

// 2. Form Buttons Event Binder
function bindFormEvents() {
    document.addEventListener('click', function(e) {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        if (targetBtn.classList.contains('tab-btn')) {
            return;
        }

        const btnText = targetBtn.innerText.trim();

        if (targetBtn.type === 'submit' || targetBtn.classList.contains('btn-submit') || targetBtn.classList.contains('btn-register-doc')) {
            if (btnText.includes('Register Doctor') || btnText.includes('Register Doctor & Account')) {
                e.preventDefault();
                submitDoctor();
            } else if (btnText.includes('Register Patient')) {
                e.preventDefault();
                submitPatient();
            } else if (btnText.includes('Save Treatment')) {
                e.preventDefault();
                submitTreatment();
            } else if (btnText.includes('Save & Confirm')) {
                e.preventDefault();
                submitAppointment();
            }
        }
    });
}

function fetchAllData() {
    loadDoctors();
    loadPatients();
    loadTreatments();
    loadAppointments();
    loadBills();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    let target = document.getElementById(tabId);
    let btn = document.getElementById('tab-btn-' + tabId);

    if (!target && tabId === 'add-doctor') target = document.getElementById('register-doctor');
    if (!target && tabId === 'register-doctor') target = document.getElementById('add-doctor');
    if (!target && tabId === 'add-appointment') target = document.getElementById('new-appointment');
    if (!target && tabId === 'new-appointment') target = document.getElementById('add-appointment');
    if (!target && tabId === 'schedule-details') target = document.getElementById('appointments');
    if (!target && tabId === 'appointments') target = document.getElementById('schedule-details');

    if (!btn && tabId === 'add-doctor') btn = document.getElementById('tab-btn-register-doctor');
    if (!btn && tabId === 'register-doctor') btn = document.getElementById('tab-btn-add-doctor');
    if (!btn && tabId === 'add-appointment') btn = document.getElementById('tab-btn-new-appointment');
    if (!btn && tabId === 'new-appointment') btn = document.getElementById('tab-btn-add-appointment');
    if (!btn && tabId === 'schedule-details') btn = document.getElementById('tab-btn-appointments');
    if (!btn && tabId === 'appointments') btn = document.getElementById('tab-btn-schedule-details');

    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');

    if (tabId === 'add-doctor' || tabId === 'register-doctor') {
        loadDoctors();
    } else if (tabId === 'register-patient') {
        loadPatients();
    } else if (tabId === 'add-treatment') {
        loadTreatments();
    } else if (tabId.includes('appointment') || tabId === 'add-appointment' || tabId === 'new-appointment') {
        loadDoctors();
        loadTreatments();
        loadPatients();
    } else if (tabId === 'appointments' || tabId === 'schedule-details') {
        loadAppointments();
    } else if (tabId === 'saved-receipts') {
        loadBills();
    }
}

// 3. Load Doctors (With Edit & Delete Buttons)
async function loadDoctors() {
    const tbody = document.getElementById('docTableBody');
    const statDoc = document.getElementById('statDocCount');
    const dropdowns = [
        document.getElementById('dentistDropdown'),
        document.getElementById('appointmentDoctor'),
        document.getElementById('docSelect'),
        document.querySelector('select[name="dentist"]'),
        document.querySelector('select[name="dentistName"]')
    ].filter(Boolean);

    dropdowns.forEach(d => d.innerHTML = '<option value="">-- Select Dentist --</option>');

    try {
        const res = await apiFetch('/doctors');
        let doctors = [];
        if (Array.isArray(res)) {
            doctors = res;
        } else if (res && Array.isArray(res.data)) {
            doctors = res.data;
        } else if (res && Array.isArray(res.doctors)) {
            doctors = res.doctors;
        }

        if (statDoc) statDoc.innerText = doctors.length || 0;
        if (tbody) tbody.innerHTML = '';

        if (doctors.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No doctors registered yet.</td></tr>';
            return;
        }

        doctors.forEach(doc => {
            const id = doc.doctor_id || doc.doctorId || doc.id || '-';
            const name = doc.doctor_name || doc.doctorName || doc.name || '-';
            const loc = doc.location || doc.branch || 'Nugegoda';
            const tel = doc.tel_no || doc.telNo || doc.telephone || '-';

            const safeName = name.replace(/'/g, "\\'");
            const safeLoc = loc.replace(/'/g, "\\'");
            const safeTel = tel.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>${id}</strong></td>
                    <td><strong>${name}</strong></td>
                    <td><i class="fa-solid fa-location-dot" style="color:#888; margin-right:4px;"></i> ${loc}</td>
                    <td><i class="fa-solid fa-phone" style="color:#888; margin-right:4px;"></i> ${tel}</td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" onclick="openEditDoctorModal('${id}', '${safeName}', '${safeLoc}', '${safeTel}')" 
                                    style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Edit Doctor">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" onclick="deleteDoctor('${id}', '${safeName}')" 
                                    style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Delete Doctor">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }

            dropdowns.forEach(d => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (${loc})`;
                d.appendChild(opt);
            });
        });
    } catch (err) {
        console.error('Load Doctors Error:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Failed to load doctors.</td></tr>';
    }
}

// Modal Handlers for Edit Doctor
window.openEditDoctorModal = function(id, name, location, tel) {
    const modal = document.getElementById('editDoctorModal');
    if (!modal) return;
    document.getElementById('editDocId').value = id;
    document.getElementById('editDocName').value = name;
    document.getElementById('editDocLocation').value = location;
    document.getElementById('editDocTel').value = tel;
    modal.style.display = 'flex';
};

window.closeEditDocModal = function() {
    const modal = document.getElementById('editDoctorModal');
    if (modal) modal.style.display = 'none';
};

window.handleUpdateDoctor = async function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editDocId').value.trim();
    const name = document.getElementById('editDocName').value.trim();
    const location = document.getElementById('editDocLocation').value.trim();
    const tel = document.getElementById('editDocTel').value.trim();

    try {
        const encodedId = encodeURIComponent(id);
        const res = await apiFetch(`/doctors/${encodedId}`, {
            method: 'PUT',
            body: { doctorName: name, location: location, telNo: tel }
        });
        alert(res.message || 'Doctor updated successfully!');
        closeEditDocModal();
        loadDoctors();
    } catch (err) {
        alert('Failed to update doctor: ' + err.message);
    }
};

window.deleteDoctor = async function(docId, docName) {
    if (!confirm(`Are you sure you want to remove Doctor: "${docName}" (ID: ${docId})?`)) {
        return;
    }

    try {
        const encodedId = encodeURIComponent(docId.trim());
        const res = await apiFetch(`/doctors/${encodedId}`, { method: 'DELETE' });
        alert(res.message || 'Doctor deleted successfully!');
        loadDoctors();
    } catch (err) {
        alert('Failed to delete doctor: ' + err.message);
    }
};

// 4. Load Patients (With Edit & Delete Buttons)
async function loadPatients() {
    const tbody = document.getElementById('patientTableBody');
    const dropdown = document.getElementById('patientSelectDropdown');

    try {
        const list = await apiFetch('/patients');
        allPatientsCache = Array.isArray(list) ? list : [];

        if (tbody) tbody.innerHTML = '';
        if (dropdown) dropdown.innerHTML = '<option value="">-- Choose Existing Patient --</option>';

        if (allPatientsCache.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No patients registered yet.</td></tr>';
            return;
        }

        allPatientsCache.forEach(p => {
            const pId = p.patient_id || p.patientId || '-';
            const name = p.name || p.patient_name || '-';
            const address = p.address || '-';
            const contact = p.contact || '-';

            const safeName = name.replace(/'/g, "\\'");
            const safeAddr = address.replace(/'/g, "\\'");
            const safeContact = contact.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>${pId}</strong></td>
                    <td><strong>${name}</strong></td>
                    <td>${address}</td>
                    <td><i class="fa-solid fa-phone" style="color:#888; margin-right:4px;"></i> ${contact}</td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" onclick="openEditPatientModal('${pId}', '${safeName}', '${safeAddr}', '${safeContact}')" 
                                    style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Edit Patient">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" onclick="deletePatient('${pId}', '${safeName}')" 
                                    style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Delete Patient">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }

            if (dropdown) {
                const opt = document.createElement('option');
                opt.value = pId;
                opt.textContent = `${name} (${pId} - ${contact})`;
                dropdown.appendChild(opt);
            }
        });
    } catch (e) {
        console.error('Failed to load patients:', e);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Failed to load patients.</td></tr>';
    }
}

// Modal Handlers for Edit Patient
window.openEditPatientModal = function(id, name, address, contact) {
    const modal = document.getElementById('editPatientModal');
    if (!modal) return;
    document.getElementById('editPatId').value = id;
    document.getElementById('editPatName').value = name;
    document.getElementById('editPatAddress').value = address;
    document.getElementById('editPatContact').value = contact;
    modal.style.display = 'flex';
};

window.closeEditPatientModal = function() {
    const modal = document.getElementById('editPatientModal');
    if (modal) modal.style.display = 'none';
};

window.handleUpdatePatient = async function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editPatId').value.trim();
    const name = document.getElementById('editPatName').value.trim();
    const address = document.getElementById('editPatAddress').value.trim();
    const contact = document.getElementById('editPatContact').value.trim();

    try {
        const encodedId = encodeURIComponent(id);
        const res = await apiFetch(`/patients/${encodedId}`, {
            method: 'PUT',
            body: { name: name, address: address, contact: contact }
        });
        alert(res.message || 'Patient updated successfully!');
        closeEditPatientModal();
        loadPatients();
    } catch (err) {
        alert('Failed to update patient: ' + err.message);
    }
};

window.deletePatient = async function(patId, patName) {
    if (!confirm(`Are you sure you want to remove Patient: "${patName}" (${patId})?`)) {
        return;
    }

    try {
        const encodedId = encodeURIComponent(patId.trim());
        const res = await apiFetch(`/patients/${encodedId}`, { method: 'DELETE' });
        alert(res.message || 'Patient deleted successfully!');
        loadPatients();
    } catch (err) {
        alert('Failed to delete patient: ' + err.message);
    }
};

window.onPatientSelected = function(patId) {
    if (!patId) return;
    const pat = allPatientsCache.find(p => (p.patient_id === patId || p.patientId === patId));
    if (pat) {
        const nameInput = document.getElementById('apptPatientName') || document.querySelector('#add-appointment input[placeholder*="Full Name"]');
        const addrInput = document.getElementById('apptAddress') || document.querySelector('#add-appointment input[placeholder*="Address"]');
        const phoneInput = document.getElementById('apptContact') || document.querySelector('#add-appointment input[placeholder*="077"]');

        if (nameInput) nameInput.value = pat.name || '';
        if (addrInput) addrInput.value = pat.address || '';
        if (phoneInput) phoneInput.value = pat.contact || '';
    }
};

// 5. Load Treatments (With Edit & Delete Buttons)
async function loadTreatments() {
    try {
        const list = await apiFetch('/treatments');
        const tbody = document.getElementById('treatTableBody');
        const dropdown = document.getElementById('treatmentDropdown');

        if (tbody) tbody.innerHTML = '';
        if (dropdown) dropdown.innerHTML = '<option value="">-- Select Treatment --</option>';

        const statT = document.getElementById('statTreatCount');
        if (statT) statT.innerText = list.length || 0;

        if (!list || list.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">No treatments found.</td></tr>';
            return;
        }

        list.forEach(t => {
            const id = t.treatment_id || t.treatmentId || t.id || '-';
            const name = t.treatment_name || t.treatmentName || t.name || '-';
            const rawCost = Number(t.cost || t.price || 0);
            const costFormatted = rawCost.toFixed(2);

            const safeName = name.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>TRT-${id}</strong></td>
                    <td><strong>${name}</strong></td>
                    <td><strong style="color:#10b981;">LKR ${costFormatted}</strong></td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" onclick="openEditTreatmentModal('${id}', '${safeName}', ${rawCost})" 
                                    style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Edit Treatment">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" onclick="deleteTreatment('${id}', '${safeName}')" 
                                    style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Delete Treatment">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }
            if (dropdown) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (LKR ${costFormatted})`;
                dropdown.appendChild(opt);
            }
        });
    } catch (e) {
        if (document.getElementById('treatTableBody')) {
            document.getElementById('treatTableBody').innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Failed to load treatments.</td></tr>';
        }
    }
}

// Modal Handlers for Edit Treatment
window.openEditTreatmentModal = function(id, name, cost) {
    const modal = document.getElementById('editTreatmentModal');
    if (!modal) return;
    document.getElementById('editTreatId').value = id;
    document.getElementById('editTreatName').value = name;
    document.getElementById('editTreatCost').value = cost;
    modal.style.display = 'flex';
};

window.closeEditTreatmentModal = function() {
    const modal = document.getElementById('editTreatmentModal');
    if (modal) modal.style.display = 'none';
};

window.handleUpdateTreatment = async function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editTreatId').value.trim();
    const name = document.getElementById('editTreatName').value.trim();
    const cost = parseFloat(document.getElementById('editTreatCost').value);

    if (!name || isNaN(cost)) {
        alert('Please enter a valid treatment name and cost.');
        return;
    }

    try {
        const res = await apiFetch(`/treatments/${id}`, {
            method: 'PUT',
            body: { treatmentName: name, cost: cost }
        });
        alert(res.message || 'Treatment updated successfully!');
        closeEditTreatmentModal();
        loadTreatments();
    } catch (err) {
        console.error('Update treatment error:', err);
        alert('Failed to update treatment: ' + err.message);
    }
};

window.deleteTreatment = async function(treatId, treatName) {
    if (!confirm(`Are you sure you want to remove Treatment: "${treatName}" (TRT-${treatId})?`)) {
        return;
    }

    try {
        const res = await apiFetch(`/treatments/${treatId}`, { method: 'DELETE' });
        alert(res.message || 'Treatment deleted successfully!');
        loadTreatments();
    } catch (err) {
        console.error('Delete treatment error:', err);
        alert('Failed to delete treatment: ' + err.message);
    }
};

// 6. Load Appointments (With Edit & Delete Buttons)
async function loadAppointments() {
    try {
        const list = await apiFetch('/all_appointments');
        const tbody = document.getElementById('apptTableBody');
        if (tbody) tbody.innerHTML = '';

        const statA = document.getElementById('statApptCount');
        if (statA) statA.innerText = list.length || 0;
        let pending = 0;

        if (!list || list.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">No appointments found.</td></tr>';
            return;
        }

        list.forEach(a => {
            const apptNo = a.appointment_num || a.appointment_no || a.id || '-';
            const patName = a.patient_name || a.patientName || a.name || '-';
            const contact = a.patient_contact || a.contact || '-';
            const dentist = a.dentist_name || a.dentistName || '-';
            const treat = a.treatment_type || a.treatmentType || '-';
            const dt = a.appt_date_time || a.apptDateTime || '-';
            const st = a.status || a.appt_status || 'Pending';

            if (st.toLowerCase() === 'pending') pending++;

            let badgeClass = 'badge-pending';
            let icon = 'fa-regular fa-clock';
            if (st.toLowerCase() === 'done') { 
                badgeClass = 'badge-done'; 
                icon = 'fa-solid fa-spinner'; 
            } else if (st.toLowerCase() === 'completed') { 
                badgeClass = 'badge-completed'; 
                icon = 'fa-solid fa-check-double'; 
            }

            const safeDentist = dentist.replace(/'/g, "\\'");
            const safeTreat = treat.replace(/'/g, "\\'");
            const safeDt = dt.replace(/'/g, "\\'");
            const safeSt = st.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>${apptNo}</strong></td>
                    <td><strong>${patName}</strong></td>
                    <td><i class="fa-solid fa-phone" style="color:var(--text-muted); margin-right:4px;"></i> ${contact}</td>
                    <td>${dentist}</td>
                    <td>${treat}</td>
                    <td><i class="fa-regular fa-calendar" style="color:var(--text-muted); margin-right:4px;"></i> ${dt}</td>
                    <td><span class="badge ${badgeClass}"><i class="${icon}"></i> ${st}</span></td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" onclick="openEditAppointmentModal('${apptNo}', '${safeDentist}', '${safeTreat}', '${safeDt}', '${safeSt}')" 
                                    style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Edit Booking">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" onclick="deleteAppointment('${apptNo}')" 
                                    style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Delete Booking">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }
        });

        const statP = document.getElementById('statPendingCount');
        if (statP) statP.innerText = pending;
    } catch (e) {
        if (document.getElementById('apptTableBody')) {
            document.getElementById('apptTableBody').innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">Failed to load appointments.</td></tr>';
        }
    }
}

// Modal Handlers for Edit Appointment
window.openEditAppointmentModal = async function(apptNo, dentist, treatment, dt, status) {
    const modal = document.getElementById('editAppointmentModal');
    if (!modal) return;

    document.getElementById('editApptNo').value = apptNo;
    document.getElementById('editApptStatus').value = status || 'Pending';

    if (dt && dt.includes('T')) {
        document.getElementById('editApptDateTime').value = dt.substring(0, 16);
    } else {
        document.getElementById('editApptDateTime').value = dt || '';
    }

    const docSelect = document.getElementById('editApptDoctor');
    if (docSelect) {
        docSelect.innerHTML = '';
        try {
            const doctors = await apiFetch('/doctors');
            (Array.isArray(doctors) ? doctors : []).forEach(d => {
                const dName = d.doctor_name || d.doctorName || d.name;
                const opt = document.createElement('option');
                opt.value = dName;
                opt.textContent = `${dName} (${d.location || 'Nugegoda'})`;
                if (dName.toLowerCase() === dentist.toLowerCase()) opt.selected = true;
                docSelect.appendChild(opt);
            });
        } catch(e) {}
    }

    const treatSelect = document.getElementById('editApptTreatment');
    if (treatSelect) {
        treatSelect.innerHTML = '';
        try {
            const treatments = await apiFetch('/treatments');
            (Array.isArray(treatments) ? treatments : []).forEach(t => {
                const tName = t.treatment_name || t.treatmentName || t.name;
                const opt = document.createElement('option');
                opt.value = tName;
                opt.textContent = tName;
                if (tName.toLowerCase() === treatment.toLowerCase()) opt.selected = true;
                treatSelect.appendChild(opt);
            });
        } catch(e) {}
    }

    modal.style.display = 'flex';
};

window.closeEditAppointmentModal = function() {
    const modal = document.getElementById('editAppointmentModal');
    if (modal) modal.style.display = 'none';
};

window.handleUpdateAppointment = async function(e) {
    if (e) e.preventDefault();
    const apptNo = document.getElementById('editApptNo').value.trim();
    const dentist = document.getElementById('editApptDoctor').value;
    const treatment = document.getElementById('editApptTreatment').value;
    const dateTime = document.getElementById('editApptDateTime').value;
    const status = document.getElementById('editApptStatus').value;

    if (!dentist || !treatment || !dateTime) {
        alert('Please complete all fields.');
        return;
    }

    try {
        const encodedNo = encodeURIComponent(apptNo);
        const res = await apiFetch(`/appointments/${encodedNo}`, {
            method: 'PUT',
            body: { 
                dentistName: dentist, 
                treatmentType: treatment, 
                apptDateTime: dateTime, 
                status: status 
            }
        });
        alert(res.message || 'Appointment updated successfully!');
        closeEditAppointmentModal();
        loadAppointments();
    } catch (err) {
        console.error('Update appointment error:', err);
        alert('Failed to update appointment: ' + err.message);
    }
};

window.deleteAppointment = async function(apptNo) {
    if (!confirm(`Are you sure you want to delete appointment: "${apptNo}"?`)) {
        return;
    }

    try {
        const encodedNo = encodeURIComponent(apptNo.trim());
        const res = await apiFetch(`/appointments/${encodedNo}`, { method: 'DELETE' });
        alert(res.message || 'Appointment deleted successfully!');
        loadAppointments();
    } catch (err) {
        console.error('Delete appointment error:', err);
        alert('Failed to delete appointment: ' + err.message);
    }
};

// 7. Load Bills
async function loadBills() {
    try {
        const list = await apiFetch('/bills');
        const tbody = document.getElementById('billTableBody');
        if (tbody) tbody.innerHTML = '';

        const statB = document.getElementById('statBillCount');
        if (statB) statB.innerText = list.length || 0;

        if (!list || list.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No receipts found.</td></tr>';
            return;
        }

        list.forEach(b => {
            const bId = 'BIL-' + (b.bill_id || b.billId || b.id || '0');
            const apptNo = b.appointment_num || b.appointmentNum || '-';
            const patName = b.patient_name || b.patientName || '-';
            const treat = b.treatment_type || b.treatmentType || '-';
            const consult = Number(b.consultation_fee || b.consultationFee || 0).toFixed(2);
            const treatFee = Number(b.treatment_fee || b.treatmentFee || 0).toFixed(2);
            const total = Number(b.total_amount || b.totalAmount || 0).toFixed(2);

            const safePName = patName.replace(/'/g, "\\'");
            const safeTreat = treat.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>${bId}</strong></td>
                    <td>${apptNo}</td>
                    <td><strong>${patName}</strong></td>
                    <td>${treat}</td>
                    <td>LKR ${consult}</td>
                    <td>LKR ${treatFee}</td>
                    <td><strong style="color:#10b981;">LKR ${total}</strong></td>
                    <td>
                        <button type="button" onclick="printSingleBill('${bId}', '${apptNo}', '${safePName}', '${safeTreat}', ${consult}, ${treatFee}, ${total})" 
                                class="btn-submit" style="padding: 7px 14px; font-size:12px; background:var(--primary);">
                            <i class="fa-solid fa-print"></i> Print Receipt
                        </button>
                    </td>
                </tr>`;
            }
        });
    } catch (e) {
        if (document.getElementById('billTableBody')) {
            document.getElementById('billTableBody').innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">Failed to load receipts.</td></tr>';
        }
    }
}

// 8. Submit Handlers
async function submitDoctor() {
    const inputs = document.querySelectorAll('#add-doctor input, #register-doctor input, .tab-content.active input');
    
    const docId = (document.getElementById('regDocId') || document.querySelector('input[placeholder*="DOC-"]') || inputs[0])?.value.trim() || '';
    const docName = (document.getElementById('regDocName') || document.querySelector('input[placeholder*="Firstname"]') || inputs[1])?.value.trim() || '';
    const location = (document.getElementById('regDocLocation') || document.querySelector('input[placeholder*="Branch"]') || inputs[2])?.value.trim() || 'Nugegoda';
    const telNo = (document.getElementById('regDocTel') || document.querySelector('input[placeholder*="Contact"]') || inputs[3])?.value.trim() || '-';
    const username = (document.getElementById('regDocUsername') || document.querySelector('input[placeholder*="username"]') || inputs[4])?.value.trim() || docId;
    const password = (document.getElementById('regDocPassword') || document.querySelector('input[placeholder*="Password"]') || inputs[5])?.value.trim() || '1234';

    if (!docName) {
        alert('Please fill in Doctor Full Name.');
        return;
    }

    const data = {
        doctorId: docId || ('DOC-' + Math.floor(100 + Math.random() * 900)),
        doctorName: docName,
        location: location,
        telNo: telNo,
        username: username,
        password: password
    };

    try {
        const res = await apiFetch('/doctors', { method: 'POST', body: data });
        alert(res.message || 'Doctor registered successfully!');
        inputs.forEach(i => i.value = '');
        loadDoctors();
    } catch (err) {
        alert('Failed to register doctor: ' + err.message);
    }
}

async function submitPatient() {
    const nameInput = document.getElementById('patientRegName') || document.querySelector('#register-patient input[placeholder*="Full Name"]');
    const addrInput = document.getElementById('patientRegAddress') || document.querySelector('#register-patient input[placeholder*="Resident"]');
    const contactInput = document.getElementById('patientRegContact') || document.querySelector('#register-patient input[placeholder*="077"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const address = addrInput ? addrInput.value.trim() : 'N/A';
    const contact = contactInput ? contactInput.value.trim() : '';

    if (!name || !contact) {
        alert('Please fill in Patient Name and Contact Number.');
        return;
    }

    try {
        const res = await apiFetch('/patients', {
            method: 'POST',
            body: { name, address, contact }
        });
        alert(res.message || 'Patient registered successfully!');
        if (nameInput) nameInput.value = '';
        if (addrInput) addrInput.value = '';
        if (contactInput) contactInput.value = '';
        loadPatients();
    } catch (err) {
        alert('Failed to register patient: ' + err.message);
    }
}

async function submitTreatment() {
    const nameInput = document.getElementById('treatRegName') || document.querySelector('#add-treatment input[type="text"]');
    const costInput = document.getElementById('treatRegCost') || document.querySelector('#add-treatment input[type="number"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const cost = costInput ? parseFloat(costInput.value) : NaN;

    if (!name || isNaN(cost)) {
        alert('Please enter a valid treatment name and procedure cost.');
        return;
    }

    try {
        const res = await apiFetch('/treatments', { 
            method: 'POST', 
            body: { treatmentName: name, cost: cost } 
        });
        alert(res.message || 'Treatment added successfully!');
        if (nameInput) nameInput.value = '';
        if (costInput) costInput.value = '';
        loadTreatments();
    } catch (err) {
        alert('Failed to save treatment: ' + err.message);
    }
}

async function submitAppointment() {
    const inputs = document.querySelectorAll('#add-appointment input, .tab-content.active input');
    const selects = document.querySelectorAll('#add-appointment select, .tab-content.active select');

    const patName = (document.getElementById('apptPatientName') || inputs[0])?.value.trim();
    const address = (document.getElementById('apptAddress') || inputs[1])?.value.trim() || 'N/A';
    const contact = (document.getElementById('apptContact') || inputs[2])?.value.trim();
    const dentist = (document.getElementById('dentistDropdown') || selects[1] || selects[0])?.value;
    const treatment = (document.getElementById('treatmentDropdown') || selects[2] || selects[1])?.value;
    const apptDateTime = (document.getElementById('apptDateTime') || inputs[3])?.value;

    if (!patName || !contact || !dentist || !treatment || !apptDateTime) {
        alert('Please complete all appointment fields.');
        return;
    }

    const data = {
        patientName: patName,
        address: address,
        contact: contact,
        dentistName: dentist,
        treatmentType: treatment,
        apptDateTime: apptDateTime
    };

    try {
        const res = await apiFetch('/create_appointment', { method: 'POST', body: data });
        alert('Appointment Confirmed! Appointment Number: ' + (res.appointmentNumber || ''));
        inputs.forEach(i => i.value = '');
        loadAppointments();
        switchTab('appointments');
    } catch (err) {
        alert('Failed to register appointment: ' + err.message);
    }
}

// 9. Print Function
function printSingleBill(billId, apptNum, pName, treatment, consultFee, treatFee, total) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setVal('prBillId', billId);
    setVal('prDate', new Date().toLocaleString());
    setVal('prApptNum', apptNum);
    setVal('prPatientName', pName);
    setVal('prTreatment', treatment);
    setVal('prConsultFee', Number(consultFee).toFixed(2));
    setVal('prTreatFee', Number(treatFee).toFixed(2));
    setVal('prTotal', Number(total).toFixed(2));
    
    window.print();
}

// 10. Table Search Filter
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

// Auto-fill Username helper
window.autoFillUsername = function(name) {
    const userField = document.getElementById('regDocUsername');
    if (!userField || userField.dataset.customEdited) return;
    
    const clean = name.toLowerCase().replace(/^dr\.?\s*/i, '').replace(/[^a-z0-9]/g, '');
    userField.value = clean ? `doc.${clean}` : '';
};

// Next Auto Doctor ID Generator
function generateNextDoctorId(doctorsList) {
    let maxNum = 0;
    doctorsList.forEach(d => {
        const idStr = (d.doctor_id || d.doctorId || '').toString().toUpperCase();
        const match = idStr.match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
        }
    });
    return `DOC-${maxNum + 1}`;
}

// 3. Load Doctors (With Auto ID generation for new registrations)
async function loadDoctors() {
    const tbody = document.getElementById('docTableBody');
    const statDoc = document.getElementById('statDocCount');
    const docIdField = document.getElementById('regDocId');
    const dropdowns = [
        document.getElementById('dentistDropdown'),
        document.getElementById('appointmentDoctor'),
        document.getElementById('docSelect'),
        document.querySelector('select[name="dentist"]'),
        document.querySelector('select[name="dentistName"]')
    ].filter(Boolean);

    dropdowns.forEach(d => d.innerHTML = '<option value="">-- Select Dentist --</option>');

    try {
        const res = await apiFetch('/doctors');
        let doctors = [];
        if (Array.isArray(res)) {
            doctors = res;
        } else if (res && Array.isArray(res.data)) {
            doctors = res.data;
        } else if (res && Array.isArray(res.doctors)) {
            doctors = res.doctors;
        }

        if (statDoc) statDoc.innerText = doctors.length || 0;
        
        // Next Doctor ID එක Input Field එකට Auto-Fill කිරීම
        if (docIdField) {
            docIdField.value = generateNextDoctorId(doctors);
        }

        if (tbody) tbody.innerHTML = '';

        if (doctors.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No doctors registered yet.</td></tr>';
            return;
        }

        doctors.forEach(doc => {
            const id = doc.doctor_id || doc.doctorId || doc.id || '-';
            const name = doc.doctor_name || doc.doctorName || doc.name || '-';
            const loc = doc.location || doc.branch || 'Nugegoda';
            const tel = doc.tel_no || doc.telNo || doc.telephone || '-';

            const safeName = name.replace(/'/g, "\\'");
            const safeLoc = loc.replace(/'/g, "\\'");
            const safeTel = tel.replace(/'/g, "\\'");

            if (tbody) {
                tbody.innerHTML += `<tr>
                    <td><strong>${id}</strong></td>
                    <td><strong>${name}</strong></td>
                    <td><i class="fa-solid fa-location-dot" style="color:#888; margin-right:4px;"></i> ${loc}</td>
                    <td><i class="fa-solid fa-phone" style="color:#888; margin-right:4px;"></i> ${tel}</td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex; gap:8px;">
                            <button type="button" onclick="openEditDoctorModal('${id}', '${safeName}', '${safeLoc}', '${safeTel}')" 
                                    style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Edit Doctor">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" onclick="deleteDoctor('${id}', '${safeName}')" 
                                    style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;" title="Delete Doctor">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }

            dropdowns.forEach(d => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (${loc})`;
                d.appendChild(opt);
            });
        });
    } catch (err) {
        console.error('Load Doctors Error:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Failed to load doctors.</td></tr>';
    }
}

// 8. Submit Doctor
async function submitDoctor() {
    const docId = document.getElementById('regDocId')?.value.trim();
    const docName = document.getElementById('regDocName')?.value.trim();
    const location = document.getElementById('regDocLocation')?.value.trim() || 'Nugegoda';
    const telNo = document.getElementById('regDocTel')?.value.trim() || '-';
    const username = document.getElementById('regDocUsername')?.value.trim() || docId;
    const password = document.getElementById('regDocPassword')?.value.trim() || '1234';

    if (!docName || !docId) {
        alert('Please fill in Doctor Full Name.');
        return;
    }

    const data = {
        doctorId: docId,
        doctorName: docName,
        location: location,
        telNo: telNo,
        username: username,
        password: password
    };

    try {
        const res = await apiFetch('/doctors', { method: 'POST', body: data });
        alert(res.message || 'Doctor registered successfully!');
        
        // Reset form
        document.getElementById('regDocName').value = '';
        document.getElementById('regDocLocation').value = 'Nugegoda';
        document.getElementById('regDocTel').value = '';
        document.getElementById('regDocUsername').value = '';
        document.getElementById('regDocPassword').value = '';

        loadDoctors();
    } catch (err) {
        alert('Failed to register doctor: ' + err.message);
    }
}
// 1. Component Loader
async function loadComponents() {
    const loggedUser = localStorage.getItem('loggedUser') || localStorage.getItem('username') || 'Staff Officer';
    const navStaffName = document.getElementById('navStaffName');
    if (navStaffName) {
        navStaffName.innerText = loggedUser;
    }

    const files = [
        'staff_dashboard/register_doctor.html',
        'staff_dashboard/register_patient.html',
        'staff_dashboard/add_treatment.html',
        'staff_dashboard/new_appointment.html',
        'staff_dashboard/appointments.html',
        'staff_dashboard/saved_receipts.html',
        'staff_dashboard/staff_guide.html',
        'staff_dashboard/profile.html' // අලුතින් එක් කළ Profile Component එක
    ];

    const contentArea = document.getElementById('dynamic-content-area');
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

    try {
        const printRes = await fetch('staff_dashboard/print_receipt_template.html');
        const printContainer = document.getElementById('print-template-container');
        if (printContainer && printRes.ok) {
            printContainer.innerHTML = await printRes.text();
        }
    } catch(e) {}

    bindFormEvents();
    fetchAllData();

    setTimeout(() => {
        switchTab('add-doctor');
    }, 50);
}

// Populate Staff Profile Form
function loadStaffProfileData() {
    const username = localStorage.getItem('username') || localStorage.getItem('loggedUser') || 'staff';
    const fullName = localStorage.getItem('fullName') || localStorage.getItem('loggedUser') || 'Saman Perera';
    const role = localStorage.getItem('userRole') || 'Receptionist';

    const uInput = document.getElementById('profUsername');
    const nInput = document.getElementById('profFullName');
    const titleText = document.getElementById('profDisplayTitle');
    const badge = document.getElementById('profRoleBadge');

    if (uInput) uInput.value = username;
    if (nInput) nInput.value = fullName;
    if (titleText) titleText.innerText = fullName;
    if (badge) badge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Authorized ${role}`;
}

// Update switchTab function
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    let target = document.getElementById(tabId);
    let btn = document.getElementById('tab-btn-' + tabId);

    if (!target && tabId === 'add-doctor') target = document.getElementById('register-doctor');
    if (!target && tabId === 'register-doctor') target = document.getElementById('add-doctor');
    if (!target && tabId === 'add-appointment') target = document.getElementById('new-appointment');
    if (!target && tabId === 'new-appointment') target = document.getElementById('add-appointment');
    if (!target && tabId === 'schedule-details') target = document.getElementById('appointments');
    if (!target && tabId === 'appointments') target = document.getElementById('schedule-details');

    if (!btn && tabId === 'add-doctor') btn = document.getElementById('tab-btn-register-doctor');
    if (!btn && tabId === 'register-doctor') btn = document.getElementById('tab-btn-add-doctor');
    if (!btn && tabId === 'add-appointment') btn = document.getElementById('tab-btn-new-appointment');
    if (!btn && tabId === 'new-appointment') btn = document.getElementById('tab-btn-add-appointment');
    if (!btn && tabId === 'schedule-details') btn = document.getElementById('tab-btn-appointments');
    if (!btn && tabId === 'appointments') btn = document.getElementById('tab-btn-schedule-details');

    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');

    if (tabId === 'add-doctor' || tabId === 'register-doctor') {
        loadDoctors();
    } else if (tabId === 'register-patient') {
        loadPatients();
    } else if (tabId === 'add-treatment') {
        loadTreatments();
    } else if (tabId.includes('appointment') || tabId === 'add-appointment' || tabId === 'new-appointment') {
        loadDoctors();
        loadTreatments();
        loadPatients();
    } else if (tabId === 'appointments' || tabId === 'schedule-details') {
        loadAppointments();
    } else if (tabId === 'saved-receipts') {
        loadBills();
    } else if (tabId === 'staff-profile') {
        loadStaffProfileData();
    }
}

// Handle Profile Update Request
window.handleUpdateStaffProfile = async function(e) {
    if (e) e.preventDefault();

    const username = document.getElementById('profUsername').value.trim();
    const fullName = document.getElementById('profFullName').value.trim();
    const currentPass = document.getElementById('profCurrentPass').value.trim();
    const newPass = document.getElementById('profNewPass').value.trim();

    if (!fullName) {
        alert('Display Name cannot be empty.');
        return;
    }

    if (newPass && !currentPass) {
        alert('Please enter your current password to set a new password.');
        return;
    }

    try {
        const res = await apiFetch('/users/update_profile', {
            method: 'PUT',
            body: {
                username: username,
                fullName: fullName,
                currentPassword: currentPass,
                newPassword: newPass
            }
        });

        alert(res.message || 'Profile updated successfully!');
        
        localStorage.setItem('fullName', fullName);
        localStorage.setItem('loggedUser', fullName);
        
        const navStaffName = document.getElementById('navStaffName');
        if (navStaffName) {
            navStaffName.innerText = fullName;
        }

        document.getElementById('profCurrentPass').value = '';
        document.getElementById('profNewPass').value = '';
        loadStaffProfileData();
    } catch (err) {
        alert('Failed to update profile: ' + err.message);
    }
};

// 11. Clean Logout Handler
function logoutStaff() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('login.html');
}

window.addEventListener('DOMContentLoaded', loadComponents);
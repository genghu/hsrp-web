// Global state
let currentUser = null;
let currentExperiment = null;
let currentMode = null; // 'create' or 'edit'
let currentSession = null; // Track current session for editing

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                currentUser = data.data;
                updateNavigation(true);
                showDashboard();
                return;
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    // Show home page by default
    showPage('home');
}

// Navigation functions
function showPage(pageName) {
    console.log('showPage called with:', pageName);

    const pageElement = document.getElementById(`page-${pageName}`);
    if (!pageElement) {
        console.error(`Page not found: page-${pageName}`);
        return;
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    pageElement.classList.add('active');
    console.log(`Switched to page: ${pageName}`);
}

function updateNavigation(isLoggedIn) {
    document.getElementById('nav-login').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('nav-register').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('nav-dashboard').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('nav-logout').style.display = isLoggedIn ? 'block' : 'none';
    updateFloatingButton();
}

function showDashboard() {
    if (!currentUser) {
        showPage('login');
        return;
    }

    if (currentUser.role === 'researcher') {
        showPage('researcher-dashboard');
        loadResearcherExperiments();
    } else {
        showPage('subject-dashboard');
        loadAvailableExperiments();
    }
}

// Role selector handler - wrapped in DOMContentLoaded to ensure element exists
document.addEventListener('DOMContentLoaded', () => {
    const registerRole = document.getElementById('register-role');
    if (registerRole) {
        registerRole.addEventListener('change', (e) => {
            const researcherFields = document.getElementById('researcher-fields');
            if (researcherFields) {
                researcherFields.style.display = e.target.value === 'researcher' ? 'block' : 'none';
            }
        });
    }
});

// Authentication handlers
async function handleLogin(event) {
    event.preventDefault();

    console.log('Login form submitted');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    // Clear previous errors
    errorEl.textContent = '';
    errorEl.classList.remove('show');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Login successful');
            localStorage.setItem('token', data.data.token);
            currentUser = data.data.user;
            showNotification(`Welcome back, ${data.data.user.firstName}!`, 'success');
            updateNavigation(true);
            showDashboard();
        } else {
            console.error('Login failed:', data.error);
            errorEl.textContent = data.error || 'Login failed';
            errorEl.classList.add('show');
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
        showNotification('An error occurred. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    console.log('Register form submitted');

    const firstName = document.getElementById('register-firstName').value;
    const lastName = document.getElementById('register-lastName').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const institution = document.getElementById('register-institution').value;
    const department = document.getElementById('register-department').value;
    const errorEl = document.getElementById('register-error');

    // Clear previous errors
    errorEl.textContent = '';
    errorEl.classList.remove('show');

    const userData = {
        firstName,
        lastName,
        email,
        password,
        role
    };

    if (role === 'researcher') {
        userData.institution = institution;
        userData.department = department;
    }

    console.log('Sending registration data:', { ...userData, password: '***' });

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log('Registration response:', data);

        if (response.ok && data.success) {
            console.log('Registration successful');
            localStorage.setItem('token', data.data.token);
            currentUser = data.data.user;
            showNotification('Registration successful! Welcome to HSRP!', 'success');
            updateNavigation(true);
            showDashboard();
        } else {
            console.error('Registration failed:', data.error);
            errorEl.textContent = data.error || 'Registration failed';
            errorEl.classList.add('show');
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
        showNotification('An error occurred. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateNavigation(false);
    showPage('home');
}

// Researcher Dashboard Functions
async function loadResearcherExperiments() {
    const container = document.getElementById('researcher-experiments-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('/api/experiments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>No experiments yet. Create your first experiment to get started!</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.data.map(exp => renderExperimentCard(exp)).join('');
            }
        } else {
            container.innerHTML = '<p class="error-message show">Error loading experiments</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message show">Error loading experiments</p>';
    }
}

function renderExperimentCard(exp) {
    const t = translations[currentLanguage];
    const statusKey = exp.status === 'draft' ? 'draft' :
                      exp.status === 'open' ? 'open_for_recruitment' :
                      exp.status === 'in_progress' ? 'in_progress' : 'completed';
    const statusBadge = `<span class="status-badge status-${exp.status}">${t[statusKey]}</span>`;

    return `
        <div class="experiment-card">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4><i class="fas fa-flask me-2"></i>${exp.title}</h4>
                    ${statusBadge}
                </div>
                <div class="d-flex gap-2">
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="editExperiment('${exp._id}')"><i class="fas fa-edit me-1"></i>${t['edit']}</button>
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="viewSessions('${exp._id}')"><i class="fas fa-calendar me-1"></i>${t['sessions']}</button>
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="deleteExperiment('${exp._id}')"><i class="fas fa-trash me-1"></i>${t['delete']}</button>
                </div>
            </div>
            <p style="margin-bottom: 1rem;">${exp.description}</p>
            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div><i class="fas fa-map-marker-alt me-2"></i><strong>${t['location']}:</strong></div>
                    <div>${exp.location}</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-clock me-2"></i><strong>${t['duration']}:</strong></div>
                    <div>${exp.duration} ${t['minutes']}</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-dollar-sign me-2"></i><strong>${t['compensation']}:</strong></div>
                    <div>${exp.compensation}</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-users me-2"></i><strong>${t['max_participants']}:</strong></div>
                    <div>${exp.maxParticipants}</div>
                </div>
            </div>
            ${exp.requirements && exp.requirements.length > 0 ? `
                <div class="mb-3">
                    <strong><i class="fas fa-list-check me-2"></i>${t['requirements']}:</strong>
                    <ul class="requirements-list" style="margin-top: 0.5rem;">
                        ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${exp.sessions && exp.sessions.length > 0 ? renderSessionsPreview(exp.sessions) : `<p style="margin-top: 1rem; color: rgba(255, 255, 255, 0.7);"><i class="fas fa-info-circle me-2"></i>${t['no_sessions_scheduled']}</p>`}
        </div>
    `;
}

function renderSessionsPreview(sessions) {
    const t = translations[currentLanguage];
    return `
        <div class="sessions-container">
            <strong>${t['scheduled_sessions']} (${sessions.length}):</strong>
            ${sessions.slice(0, 3).map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <span class="session-time">${formatDate(session.startTime)}</span>
                        <span class="session-info">${session.participants.filter(p => p.status !== 'cancelled').length}/${session.maxParticipants} ${t['participants']}</span>
                    </div>
                    <div class="session-info">📍 ${session.location}</div>
                </div>
            `).join('')}
            ${sessions.length > 3 ? `<p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">+${sessions.length - 3} ${t['sessions']}</p>` : ''}
        </div>
    `;
}

// Experiment CRUD Functions
function showCreateExperiment() {
    currentMode = 'create';
    currentExperiment = null;
    const t = translations[currentLanguage];
    document.getElementById('experiment-modal-title').textContent = t['create_experiment'];
    document.getElementById('experiment-form').reset();
    document.getElementById('exp-status').value = 'draft';
    document.getElementById('experiment-modal').classList.add('show');
}

async function editExperiment(expId) {
    currentMode = 'edit';

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentExperiment = data.data;
            const t = translations[currentLanguage];
            document.getElementById('experiment-modal-title').textContent = t['edit_experiment'];
            document.getElementById('exp-title').value = data.data.title;
            document.getElementById('exp-description').value = data.data.description;
            document.getElementById('exp-location').value = data.data.location;
            document.getElementById('exp-duration').value = data.data.duration;
            document.getElementById('exp-compensation').value = data.data.compensation;
            document.getElementById('exp-maxParticipants').value = data.data.maxParticipants;
            document.getElementById('exp-requirements').value = data.data.requirements.join('\n');
            document.getElementById('exp-status').value = data.data.status;
            document.getElementById('experiment-modal').classList.add('show');
        }
    } catch (error) {
        alert('Error loading experiment');
    }
}

async function handleExperimentSubmit(event) {
    event.preventDefault();

    const experimentData = {
        title: document.getElementById('exp-title').value,
        description: document.getElementById('exp-description').value,
        location: document.getElementById('exp-location').value,
        duration: parseInt(document.getElementById('exp-duration').value),
        compensation: document.getElementById('exp-compensation').value,
        maxParticipants: parseInt(document.getElementById('exp-maxParticipants').value),
        requirements: document.getElementById('exp-requirements').value.split('\n').filter(r => r.trim()),
        status: document.getElementById('exp-status').value
    };

    const errorEl = document.getElementById('experiment-error');

    try {
        const url = currentMode === 'edit' ? `/api/experiments/${currentExperiment._id}` : '/api/experiments';
        const method = currentMode === 'edit' ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(experimentData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            closeExperimentModal();
            loadResearcherExperiments();
        } else {
            errorEl.textContent = data.error || 'Failed to save experiment';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
    }
}

async function deleteExperiment(expId) {
    if (!confirm('Are you sure you want to delete this experiment?')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadResearcherExperiments();
        } else {
            alert('Error deleting experiment');
        }
    } catch (error) {
        alert('Error deleting experiment');
    }
}

function closeExperimentModal() {
    document.getElementById('experiment-modal').classList.remove('show');
    document.getElementById('experiment-error').classList.remove('show');
}

// Session Management
async function viewSessions(expId) {
    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSessionsModal(data.data);
        }
    } catch (error) {
        alert('Error loading sessions');
    }
}

function showSessionsModal(experiment) {
    currentExperiment = experiment;
    const t = translations[currentLanguage];

    const content = `
        <div class="modal-content">
            <span class="close" onclick="closeSessionsModal()">&times;</span>
            <h2>${t['sessions']} - ${experiment.title}</h2>
            <button class="btn btn-primary" onclick="showAddSession()" style="margin-bottom: 1rem;">${t['add_session']}</button>
            <div id="sessions-list">
                ${experiment.sessions.length === 0 ? `<p>${t['no_sessions_scheduled']}</p>` : experiment.sessions.map(session => renderSessionDetails(session, experiment._id)).join('')}
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'sessions-view-modal';
    modal.className = 'modal show';
    modal.innerHTML = content;
    document.body.appendChild(modal);
}

function renderSessionDetails(session, experimentId) {
    const t = translations[currentLanguage];
    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <strong>${formatDate(session.startTime)} - ${formatTime(session.endTime)}</strong>
                    <p class="session-info">📍 ${session.location}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-small btn-primary" onclick="editSession('${experimentId}', '${session._id}')">${t['edit']}</button>
                    <button class="btn btn-small btn-danger" onclick="deleteSession('${experimentId}', '${session._id}')">${t['delete']}</button>
                </div>
            </div>
            <p><strong>${t['participants']}:</strong> ${session.participants.filter(p => p.status !== 'cancelled').length}/${session.maxParticipants}</p>
            ${session.notes ? `<p><strong>${t['notes']}:</strong> ${session.notes}</p>` : ''}
            ${session.participants.length > 0 ? `
                <div class="participants-list">
                    <strong>${t['registered_participants']}:</strong>
                    ${session.participants.map(p => renderParticipant(p, experimentId, session._id)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function renderParticipant(participant, experimentId, sessionId) {
    const t = translations[currentLanguage];
    const user = participant.user;
    const statusKey = participant.status === 'registered' ? 'registered' :
                      participant.status === 'confirmed' ? 'confirmed' :
                      participant.status === 'attended' ? 'attended' :
                      participant.status === 'no_show' ? 'no_show' : 'cancelled';
    const statusBadge = `<span class="badge badge-${participant.status}">${t[statusKey]}</span>`;

    return `
        <div class="participant-item">
            <div>
                <strong>${user.firstName} ${user.lastName}</strong> (${user.email})
                ${statusBadge}
            </div>
            <div>
                <select onchange="updateParticipantStatus('${experimentId}', '${sessionId}', '${user._id}', this.value)">
                    <option value="registered" ${participant.status === 'registered' ? 'selected' : ''}>${t['registered']}</option>
                    <option value="confirmed" ${participant.status === 'confirmed' ? 'selected' : ''}>${t['confirmed']}</option>
                    <option value="attended" ${participant.status === 'attended' ? 'selected' : ''}>${t['attended']}</option>
                    <option value="no_show" ${participant.status === 'no_show' ? 'selected' : ''}>${t['no_show']}</option>
                    <option value="cancelled" ${participant.status === 'cancelled' ? 'selected' : ''}>${t['cancelled']}</option>
                </select>
            </div>
        </div>
    `;
}

function closeSessionsModal() {
    const modal = document.getElementById('sessions-view-modal');
    if (modal) {
        modal.remove();
    }
}

function showAddSession() {
    closeSessionsModal();
    if (!currentExperiment) return;

    currentMode = 'create';
    currentSession = null;
    const t = translations[currentLanguage];
    document.getElementById('session-modal-title').textContent = t['add_session'];
    document.getElementById('session-form').reset();
    document.getElementById('session-location').value = currentExperiment.location;
    document.getElementById('session-maxParticipants').value = currentExperiment.maxParticipants;
    document.getElementById('session-modal').classList.add('show');
}

async function editSession(experimentId, sessionId) {
    closeSessionsModal();
    try {
        const response = await fetch(`/api/experiments/${experimentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentExperiment = data.data;
            currentSession = data.data.sessions.find(s => s._id === sessionId);

            if (!currentSession) {
                alert('Session not found');
                return;
            }

            currentMode = 'edit';
            const t = translations[currentLanguage];
            document.getElementById('session-modal-title').textContent = t['edit_session'];

            // Format datetime for input fields (YYYY-MM-DDTHH:mm)
            const startTime = new Date(currentSession.startTime);
            const endTime = new Date(currentSession.endTime);

            document.getElementById('session-startTime').value = startTime.toISOString().slice(0, 16);
            document.getElementById('session-endTime').value = endTime.toISOString().slice(0, 16);
            document.getElementById('session-location').value = currentSession.location;
            document.getElementById('session-maxParticipants').value = currentSession.maxParticipants;
            document.getElementById('session-notes').value = currentSession.notes || '';

            document.getElementById('session-modal').classList.add('show');
        }
    } catch (error) {
        alert('Error loading session');
    }
}

async function handleSessionSubmit(event) {
    event.preventDefault();

    const sessionData = {
        startTime: document.getElementById('session-startTime').value,
        endTime: document.getElementById('session-endTime').value,
        location: document.getElementById('session-location').value,
        maxParticipants: parseInt(document.getElementById('session-maxParticipants').value),
        notes: document.getElementById('session-notes').value
    };

    const errorEl = document.getElementById('session-error');

    try {
        const url = currentMode === 'edit'
            ? `/api/experiments/${currentExperiment._id}/sessions/${currentSession._id}`
            : `/api/experiments/${currentExperiment._id}/sessions`;
        const method = currentMode === 'edit' ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(sessionData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            closeSessionModal();
            closeSessionsModal();
            loadResearcherExperiments();
            const message = currentMode === 'edit' ? 'Session updated successfully!' : 'Session added successfully!';
            showNotification(message, 'success');
        } else {
            errorEl.textContent = data.error || `Failed to ${currentMode === 'edit' ? 'update' : 'add'} session`;
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
    }
}

async function deleteSession(experimentId, sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            closeSessionsModal();
            viewSessions(experimentId);
        } else {
            alert('Error deleting session');
        }
    } catch (error) {
        alert('Error deleting session');
    }
}

async function updateParticipantStatus(experimentId, sessionId, userId, status) {
    try {
        const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/participants/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            alert('Error updating participant status');
        }
    } catch (error) {
        alert('Error updating participant status');
    }
}

function closeSessionModal() {
    document.getElementById('session-modal').classList.remove('show');
    document.getElementById('session-error').classList.remove('show');
}

// Subject Dashboard Functions
function showSubjectTab(tab, event) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tab === 'available') {
        document.getElementById('subject-available-container').classList.add('active');
        loadAvailableExperiments();
    } else {
        document.getElementById('subject-registered-container').classList.add('active');
        loadRegisteredSessions();
    }
}

async function loadAvailableExperiments() {
    const container = document.getElementById('subject-available-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('/api/experiments?status=open', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔬</div>
                        <p>No experiments available at the moment. Check back later!</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.data.map(exp => renderSubjectExperimentCard(exp)).join('');
            }
        } else {
            container.innerHTML = '<p class="error-message show">Error loading experiments</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message show">Error loading experiments</p>';
    }
}

function renderSubjectExperimentCard(exp) {
    const t = translations[currentLanguage];
    return `
        <div class="card">
            <h3 class="card-title">${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">${t['researcher']}</span>
                    <span class="info-value">${exp.researcher.firstName} ${exp.researcher.lastName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t['location']}</span>
                    <span class="info-value">${exp.location}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t['duration']}</span>
                    <span class="info-value">${exp.duration} ${t['minutes']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t['compensation']}</span>
                    <span class="info-value">${exp.compensation}</span>
                </div>
            </div>
            ${exp.requirements && exp.requirements.length > 0 ? `
                <div>
                    <strong>${t['requirements']}:</strong>
                    <ul class="requirements-list">
                        ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${exp.sessions && exp.sessions.length > 0 ? `
                <div class="sessions-container">
                    <strong>${t['available_sessions']}:</strong>
                    ${exp.sessions.map(session => renderSubjectSession(session, exp._id)).join('')}
                </div>
            ` : `<p style="margin-top: 1rem; color: var(--text-muted);">${t['no_sessions_scheduled']}</p>`}
        </div>
    `;
}

function renderSubjectSession(session, experimentId) {
    const t = translations[currentLanguage];
    const spotsLeft = session.maxParticipants - session.participants.filter(p => p.status !== 'cancelled').length;
    const isRegistered = session.participants.some(p => p.user === currentUser._id || p.user._id === currentUser._id);

    return `
        <div class="session-card">
            <div class="session-header">
                <div>
                    <span class="session-time">${formatDate(session.startTime)}</span>
                    <div class="session-info">📍 ${session.location}</div>
                    <div class="session-info">${spotsLeft} ${t['spots_left']}</div>
                </div>
                ${isRegistered
                    ? `<span class="badge badge-open">${t['registered']}</span>`
                    : spotsLeft > 0
                        ? `<button class="btn btn-small btn-success" onclick="registerForSession('${experimentId}', '${session._id}')">${t['register']}</button>`
                        : `<span class="badge badge-cancelled">${t['full']}</span>`
                }
            </div>
        </div>
    `;
}

async function registerForSession(experimentId, sessionId) {
    try {
        const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Successfully registered for session!');
            loadAvailableExperiments();
        } else {
            alert(data.error || 'Failed to register');
        }
    } catch (error) {
        alert('Error registering for session');
    }
}

async function loadRegisteredSessions() {
    const container = document.getElementById('subject-registered-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('/api/experiments/my-sessions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p>You haven't registered for any sessions yet.</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.data.map(exp => renderRegisteredExperiment(exp)).join('');
            }
        } else {
            container.innerHTML = '<p class="error-message show">Error loading sessions</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-message show">Error loading sessions</p>';
    }
}

function renderRegisteredExperiment(exp) {
    const t = translations[currentLanguage];
    return `
        <div class="card">
            <h3 class="card-title">${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="sessions-container">
                ${exp.sessions.map(session => {
                    const myParticipant = session.participants.find(p =>
                        (p.user._id || p.user) === currentUser._id
                    );
                    const statusKey = myParticipant.status === 'registered' ? 'registered' :
                                      myParticipant.status === 'confirmed' ? 'confirmed' :
                                      myParticipant.status === 'attended' ? 'attended' :
                                      myParticipant.status === 'no_show' ? 'no_show' : 'cancelled';
                    return `
                        <div class="session-card">
                            <div class="session-header">
                                <div>
                                    <span class="session-time">${formatDate(session.startTime)}</span>
                                    <div class="session-info">📍 ${session.location}</div>
                                    <span class="badge badge-${myParticipant.status}">${t[statusKey]}</span>
                                </div>
                                ${myParticipant.status === 'registered' || myParticipant.status === 'confirmed'
                                    ? `<button class="btn btn-small btn-danger" onclick="cancelRegistration('${exp._id}', '${session._id}')">${t['cancel']}</button>`
                                    : ''
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

async function cancelRegistration(experimentId, sessionId) {
    if (!confirm('Are you sure you want to cancel your registration?')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/register`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Registration cancelled successfully');
            loadRegisteredSessions();
        } else {
            alert(data.error || 'Failed to cancel registration');
        }
    } catch (error) {
        alert('Error cancelling registration');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const icon = notification.querySelector('i');

    // Update icon based on type
    icon.className = type === 'success' ? 'fas fa-check-circle me-2' :
                     type === 'error' ? 'fas fa-exclamation-circle me-2' :
                     'fas fa-info-circle me-2';

    notificationText.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Language Switcher
let currentLanguage = 'en';

const translations = {
    en: {
        // Navigation
        'home': 'Home',
        'login': 'Login',
        'register': 'Register',
        'dashboard': 'Dashboard',
        'logout': 'Logout',

        // Home Page
        'welcome_title': 'Welcome to HSRP',
        'welcome_subtitle': 'Human Subject Recruitment Platform',
        'welcome_description': 'Connect researchers with participants for scientific studies',
        'get_started': 'Get Started',
        'sign_in': 'Sign In',
        'for_researchers': 'For Researchers',
        'researchers_desc': 'Create experiments, manage sessions, and recruit participants efficiently',
        'for_participants': 'For Participants',
        'participants_desc': 'Browse available studies, sign up for sessions, and contribute to science',
        'secure_reliable': 'Secure & Reliable',
        'security_desc': 'Your data is protected with enterprise-grade security',

        // Login Page
        'login_title': 'Login',
        'email': 'Email',
        'password': 'Password',
        'no_account': "Don't have an account?",

        // Register Page
        'register_title': 'Register',
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'i_am_a': 'I am a:',
        'participant': 'Participant (Subject)',
        'researcher': 'Researcher',
        'institution': 'Institution',
        'department': 'Department',
        'already_have_account': 'Already have an account?',

        // Researcher Dashboard
        'researcher_dashboard': 'Researcher Dashboard',
        'create_new_experiment': 'Create New Experiment',
        'no_experiments': 'No experiments yet. Create your first experiment to get started!',

        // Subject Dashboard
        'available_experiments': 'Available Experiments',
        'available_studies': 'Available Studies',
        'my_registrations': 'My Registrations',
        'no_available': 'No experiments available at the moment. Check back later!',
        'no_registered': "You haven't registered for any sessions yet.",

        // Experiment Details
        'location': 'Location',
        'duration': 'Duration',
        'compensation': 'Compensation',
        'max_participants': 'Max Participants',
        'requirements': 'Requirements',
        'status': 'Status',
        'minutes': 'minutes',
        'researcher': 'Researcher',
        'no_sessions_scheduled': 'No sessions scheduled yet.',
        'scheduled_sessions': 'Scheduled Sessions',
        'participants': 'Participants',
        'spots_left': 'spots left',

        // Modal titles and labels
        'create_experiment': 'Create Experiment',
        'edit_experiment': 'Edit Experiment',
        'title': 'Title',
        'description': 'Description',
        'duration_minutes': 'Duration (minutes)',
        'max_participants_per_session': 'Max Participants per Session',
        'requirements_one_per_line': 'Requirements (one per line)',
        'draft': 'Draft',
        'open_for_recruitment': 'Open for Recruitment',
        'in_progress': 'In Progress',
        'completed': 'Completed',

        // Session Modal
        'add_session': 'Add Session',
        'edit_session': 'Edit Session',
        'start_time': 'Start Time',
        'end_time': 'End Time',
        'notes_optional': 'Notes (optional)',
        'notes': 'Notes',
        'registered_participants': 'Registered Participants',
        'available_sessions': 'Available Sessions',

        // Participant statuses
        'confirmed': 'Confirmed',
        'attended': 'Attended',
        'no_show': 'No Show',
        'cancelled': 'Cancelled',

        // Actions
        'edit': 'Edit',
        'delete': 'Delete',
        'sessions': 'Sessions',
        'cancel': 'Cancel',
        'save': 'Save',
        'register': 'Register',
        'registered': 'Registered',
        'full': 'Full',

        // Messages
        'language_changed': 'Language changed to English',
        'loading': 'Loading...',
        'error_loading': 'Error loading experiments'
    },
    zh: {
        // Navigation
        'home': '首页',
        'login': '登录',
        'register': '注册',
        'dashboard': '仪表板',
        'logout': '退出登录',

        // Home Page
        'welcome_title': '欢迎来到HSRP',
        'welcome_subtitle': '人类受试者招募平台',
        'welcome_description': '连接研究人员与科学研究参与者',
        'get_started': '开始使用',
        'sign_in': '登录',
        'for_researchers': '为研究人员',
        'researchers_desc': '创建实验、管理会话并高效招募参与者',
        'for_participants': '为参与者',
        'participants_desc': '浏览可用研究、报名参加会话并为科学做出贡献',
        'secure_reliable': '安全可靠',
        'security_desc': '您的数据受到企业级安全保护',

        // Login Page
        'login_title': '登录',
        'email': '电子邮箱',
        'password': '密码',
        'no_account': '还没有账户？',

        // Register Page
        'register_title': '注册',
        'first_name': '名',
        'last_name': '姓',
        'i_am_a': '我是：',
        'participant': '参与者（受试者）',
        'researcher': '研究人员',
        'institution': '机构',
        'department': '部门',
        'already_have_account': '已经有账户？',

        // Researcher Dashboard
        'researcher_dashboard': '研究人员仪表板',
        'create_new_experiment': '创建新实验',
        'no_experiments': '还没有实验。创建您的第一个实验以开始！',

        // Subject Dashboard
        'available_experiments': '可用实验',
        'available_studies': '可用研究',
        'my_registrations': '我的注册',
        'no_available': '目前没有可用的实验。请稍后再查看！',
        'no_registered': '您还没有注册任何会话。',

        // Experiment Details
        'location': '地点',
        'duration': '时长',
        'compensation': '补偿',
        'max_participants': '最大参与者数',
        'requirements': '要求',
        'status': '状态',
        'minutes': '分钟',
        'researcher': '研究人员',
        'no_sessions_scheduled': '尚未安排会话。',
        'scheduled_sessions': '已安排的会话',
        'participants': '参与者',
        'spots_left': '个名额',

        // Modal titles and labels
        'create_experiment': '创建实验',
        'edit_experiment': '编辑实验',
        'title': '标题',
        'description': '描述',
        'duration_minutes': '时长（分钟）',
        'max_participants_per_session': '每个会话的最大参与者数',
        'requirements_one_per_line': '要求（每行一个）',
        'draft': '草稿',
        'open_for_recruitment': '开放招募',
        'in_progress': '进行中',
        'completed': '已完成',

        // Session Modal
        'add_session': '添加会话',
        'edit_session': '编辑会话',
        'start_time': '开始时间',
        'end_time': '结束时间',
        'notes_optional': '备注（可选）',
        'notes': '备注',
        'registered_participants': '已注册参与者',
        'available_sessions': '可用会话',

        // Participant statuses
        'confirmed': '已确认',
        'attended': '已出席',
        'no_show': '未出席',
        'cancelled': '已取消',

        // Actions
        'edit': '编辑',
        'delete': '删除',
        'sessions': '会话',
        'cancel': '取消',
        'save': '保存',
        'register': '注册',
        'registered': '已注册',
        'full': '已满',

        // Messages
        'language_changed': '语言已切换为中文',
        'loading': '加载中...',
        'error_loading': '加载实验出错'
    }
};

// Initialize language switcher
document.addEventListener('DOMContentLoaded', function() {
    const languageDropdown = document.getElementById('languageDropdown');
    const languageMenu = document.getElementById('languageMenu');

    if (languageDropdown && languageMenu) {
        // Toggle language menu
        languageDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            languageMenu.classList.toggle('show');
        });

        // Handle language option clicks
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const selectedLang = this.getAttribute('data-lang');
                switchLanguage(selectedLang);
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function() {
            languageMenu.classList.remove('show');
        });

        // Prevent menu from closing when clicking inside
        languageMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});

function switchLanguage(lang) {
    if (lang === currentLanguage) return;

    currentLanguage = lang;

    // Update current language display
    const currentLangSpan = document.getElementById('currentLang');
    if (currentLangSpan) {
        currentLangSpan.textContent = lang === 'zh' ? '中文' : 'EN';
    }

    // Update active state in menu
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        }
    });

    // Close menu
    const languageMenu = document.getElementById('languageMenu');
    if (languageMenu) {
        languageMenu.classList.remove('show');
    }

    // Apply translations to the entire site
    applyTranslations(lang);

    // Show notification
    showNotification(translations[lang]['language_changed']);
}

function applyTranslations(lang) {
    const t = translations[lang];

    // Translate navigation menu
    document.querySelectorAll('#nav-menu a').forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;

        if (link.onclick && link.onclick.toString().includes('showPage(\'home\')')) {
            link.innerHTML = `<i class="${icon.className} me-1"></i>${t['home']}`;
        } else if (link.id === 'nav-login') {
            link.innerHTML = `<i class="${icon.className} me-1"></i>${t['login']}`;
        } else if (link.id === 'nav-register') {
            link.innerHTML = `<i class="${icon.className} me-1"></i>${t['register']}`;
        } else if (link.id === 'nav-dashboard') {
            link.innerHTML = `<i class="${icon.className} me-1"></i>${t['dashboard']}`;
        } else if (link.id === 'nav-logout') {
            link.innerHTML = `<i class="${icon.className} me-1"></i>${t['logout']}`;
        }
    });

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            // Check if element has child elements that should be preserved
            const icon = el.querySelector('i');
            if (icon && el.tagName === 'BUTTON') {
                el.innerHTML = `<i class="${icon.className} me-2"></i>${t[key]}`;
            } else if (icon && el.tagName === 'H3') {
                el.innerHTML = `<i class="${icon.className} me-2"></i>${t[key]}`;
            } else if (icon && el.tagName === 'H2') {
                el.innerHTML = `<i class="${icon.className} me-2"></i>${t[key]}`;
            } else {
                el.textContent = t[key];
            }
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Reload dynamically generated content if on specific pages
    if (currentUser) {
        if (currentUser.role === 'researcher') {
            // Reload researcher experiments to apply translations
            const researcherPage = document.getElementById('page-researcher-dashboard');
            if (researcherPage && researcherPage.classList.contains('active')) {
                loadResearcherExperiments();
            }
        } else {
            // Reload subject experiments to apply translations
            const subjectPage = document.getElementById('page-subject-dashboard');
            if (subjectPage && subjectPage.classList.contains('active')) {
                const availableTab = document.getElementById('subject-available-container');
                const registeredTab = document.getElementById('subject-registered-container');
                if (availableTab && availableTab.classList.contains('active')) {
                    loadAvailableExperiments();
                } else if (registeredTab && registeredTab.classList.contains('active')) {
                    loadRegisteredSessions();
                }
            }
        }
    }
}

// Floating button visibility control
function updateFloatingButton() {
    const floatingButton = document.getElementById('floating-button');
    if (floatingButton && currentUser && currentUser.role === 'researcher') {
        floatingButton.style.display = 'block';
    } else if (floatingButton) {
        floatingButton.style.display = 'none';
    }
}


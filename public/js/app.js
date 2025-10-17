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
    updateLanguageSwitcher();
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
    updateLanguageSwitcher();
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
    const statusBadge = `<span class="status-badge status-${exp.status}">${exp.status.replace('_', ' ')}</span>`;

    return `
        <div class="experiment-card">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4><i class="fas fa-flask me-2"></i>${exp.title}</h4>
                    ${statusBadge}
                </div>
                <div class="d-flex gap-2">
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="editExperiment('${exp._id}')"><i class="fas fa-edit me-1"></i>Edit</button>
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="viewSessions('${exp._id}')"><i class="fas fa-calendar me-1"></i>Sessions</button>
                    <button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="deleteExperiment('${exp._id}')"><i class="fas fa-trash me-1"></i>Delete</button>
                </div>
            </div>
            <p style="margin-bottom: 1rem;">${exp.description}</p>
            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div><i class="fas fa-map-marker-alt me-2"></i><strong>Location:</strong></div>
                    <div>${exp.location}</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-clock me-2"></i><strong>Duration:</strong></div>
                    <div>${exp.duration} minutes</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-dollar-sign me-2"></i><strong>Compensation:</strong></div>
                    <div>${exp.compensation}</div>
                </div>
                <div class="col-md-3">
                    <div><i class="fas fa-users me-2"></i><strong>Max Participants:</strong></div>
                    <div>${exp.maxParticipants}</div>
                </div>
            </div>
            ${exp.requirements && exp.requirements.length > 0 ? `
                <div class="mb-3">
                    <strong><i class="fas fa-list-check me-2"></i>Requirements:</strong>
                    <ul class="requirements-list" style="margin-top: 0.5rem;">
                        ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${exp.sessions && exp.sessions.length > 0 ? renderSessionsPreview(exp.sessions) : '<p style="margin-top: 1rem; color: rgba(255, 255, 255, 0.7);"><i class="fas fa-info-circle me-2"></i>No sessions scheduled yet.</p>'}
        </div>
    `;
}

function renderSessionsPreview(sessions) {
    return `
        <div class="sessions-container">
            <strong>Scheduled Sessions (${sessions.length}):</strong>
            ${sessions.slice(0, 3).map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <span class="session-time">${formatDate(session.startTime)}</span>
                        <span class="session-info">${session.participants.filter(p => p.status !== 'cancelled').length}/${session.maxParticipants} participants</span>
                    </div>
                    <div class="session-info">📍 ${session.location}</div>
                </div>
            `).join('')}
            ${sessions.length > 3 ? `<p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">+${sessions.length - 3} more sessions</p>` : ''}
        </div>
    `;
}

// Experiment CRUD Functions
function showCreateExperiment() {
    currentMode = 'create';
    currentExperiment = null;
    document.getElementById('experiment-modal-title').textContent = 'Create Experiment';
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
            document.getElementById('experiment-modal-title').textContent = 'Edit Experiment';
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

    const content = `
        <div class="modal-content">
            <span class="close" onclick="closeSessionsModal()">&times;</span>
            <h2>Sessions for ${experiment.title}</h2>
            <button class="btn btn-primary" onclick="showAddSession()" style="margin-bottom: 1rem;">Add Session</button>
            <div id="sessions-list">
                ${experiment.sessions.length === 0 ? '<p>No sessions scheduled yet.</p>' : experiment.sessions.map(session => renderSessionDetails(session, experiment._id)).join('')}
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
    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <strong>${formatDate(session.startTime)} - ${formatTime(session.endTime)}</strong>
                    <p class="session-info">📍 ${session.location}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-small btn-primary" onclick="editSession('${experimentId}', '${session._id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteSession('${experimentId}', '${session._id}')">Delete</button>
                </div>
            </div>
            <p><strong>Participants:</strong> ${session.participants.filter(p => p.status !== 'cancelled').length}/${session.maxParticipants}</p>
            ${session.notes ? `<p><strong>Notes:</strong> ${session.notes}</p>` : ''}
            ${session.participants.length > 0 ? `
                <div class="participants-list">
                    <strong>Registered Participants:</strong>
                    ${session.participants.map(p => renderParticipant(p, experimentId, session._id)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function renderParticipant(participant, experimentId, sessionId) {
    const user = participant.user;
    const statusBadge = `<span class="badge badge-${participant.status}">${participant.status}</span>`;

    return `
        <div class="participant-item">
            <div>
                <strong>${user.firstName} ${user.lastName}</strong> (${user.email})
                ${statusBadge}
            </div>
            <div>
                <select onchange="updateParticipantStatus('${experimentId}', '${sessionId}', '${user._id}', this.value)">
                    <option value="registered" ${participant.status === 'registered' ? 'selected' : ''}>Registered</option>
                    <option value="confirmed" ${participant.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="attended" ${participant.status === 'attended' ? 'selected' : ''}>Attended</option>
                    <option value="no_show" ${participant.status === 'no_show' ? 'selected' : ''}>No Show</option>
                    <option value="cancelled" ${participant.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
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
    document.getElementById('session-modal-title').textContent = 'Add Session';
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
            document.getElementById('session-modal-title').textContent = 'Edit Session';

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
    return `
        <div class="card">
            <h3 class="card-title">${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Researcher</span>
                    <span class="info-value">${exp.researcher.firstName} ${exp.researcher.lastName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Location</span>
                    <span class="info-value">${exp.location}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration</span>
                    <span class="info-value">${exp.duration} minutes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Compensation</span>
                    <span class="info-value">${exp.compensation}</span>
                </div>
            </div>
            ${exp.requirements && exp.requirements.length > 0 ? `
                <div>
                    <strong>Requirements:</strong>
                    <ul class="requirements-list">
                        ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${exp.sessions && exp.sessions.length > 0 ? `
                <div class="sessions-container">
                    <strong>Available Sessions:</strong>
                    ${exp.sessions.map(session => renderSubjectSession(session, exp._id)).join('')}
                </div>
            ` : '<p style="margin-top: 1rem; color: var(--text-muted);">No sessions available yet.</p>'}
        </div>
    `;
}

function renderSubjectSession(session, experimentId) {
    const spotsLeft = session.maxParticipants - session.participants.filter(p => p.status !== 'cancelled').length;
    const isRegistered = session.participants.some(p => p.user === currentUser._id || p.user._id === currentUser._id);

    return `
        <div class="session-card">
            <div class="session-header">
                <div>
                    <span class="session-time">${formatDate(session.startTime)}</span>
                    <div class="session-info">📍 ${session.location}</div>
                    <div class="session-info">${spotsLeft} spots left</div>
                </div>
                ${isRegistered
                    ? '<span class="badge badge-open">Registered</span>'
                    : spotsLeft > 0
                        ? `<button class="btn btn-small btn-success" onclick="registerForSession('${experimentId}', '${session._id}')">Register</button>`
                        : '<span class="badge badge-cancelled">Full</span>'
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
    return `
        <div class="card">
            <h3 class="card-title">${exp.title}</h3>
            <p>${exp.description}</p>
            <div class="sessions-container">
                ${exp.sessions.map(session => {
                    const myParticipant = session.participants.find(p =>
                        (p.user._id || p.user) === currentUser._id
                    );
                    return `
                        <div class="session-card">
                            <div class="session-header">
                                <div>
                                    <span class="session-time">${formatDate(session.startTime)}</span>
                                    <div class="session-info">📍 ${session.location}</div>
                                    <span class="badge badge-${myParticipant.status}">${myParticipant.status}</span>
                                </div>
                                ${myParticipant.status === 'registered' || myParticipant.status === 'confirmed'
                                    ? `<button class="btn btn-small btn-danger" onclick="cancelRegistration('${exp._id}', '${session._id}')">Cancel</button>`
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
        'home': 'Home',
        'login': 'Login',
        'register': 'Register',
        'dashboard': 'Dashboard',
        'logout': 'Logout'
    },
    zh: {
        'home': '首页',
        'login': '登录',
        'register': '注册',
        'dashboard': '仪表板',
        'logout': '退出登录'
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

    // Apply translations to the navigation menu
    applyTranslations(lang);

    // Show notification
    showNotification(lang === 'zh' ? '语言已切换为中文' : 'Language changed to English');
}

function applyTranslations(lang) {
    // Translate navigation menu
    document.querySelectorAll('#nav-menu a').forEach(link => {
        const icon = link.querySelector('i');
        const textContent = link.textContent.trim();

        // Extract the key from the link
        if (link.onclick && link.onclick.toString().includes('showPage(\'home\')')) {
            link.innerHTML = `<i class="${icon.className}"></i>${translations[lang]['home']}`;
        } else if (link.id === 'nav-login') {
            link.innerHTML = `<i class="${icon.className}"></i>${translations[lang]['login']}`;
        } else if (link.id === 'nav-register') {
            link.innerHTML = `<i class="${icon.className}"></i>${translations[lang]['register']}`;
        } else if (link.id === 'nav-dashboard') {
            link.innerHTML = `<i class="${icon.className}"></i>${translations[lang]['dashboard']}`;
        } else if (link.id === 'nav-logout') {
            link.innerHTML = `<i class="${icon.className}"></i>${translations[lang]['logout']}`;
        }
    });
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

// Language switcher visibility control
function updateLanguageSwitcher() {
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.style.display = 'inline-block';
    }
}

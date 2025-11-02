// Global state
let currentUser = null;
let currentExperiment = null;
let currentMode = null; // 'create' or 'edit'
let currentSession = null; // Track current session for editing
let allExperiments = []; // Store all experiments for filtering
let currentStatusFilter = 'all'; // Current status filter

// Chinese name utility functions
const COMPOUND_SURNAMES = [
  '欧阳', '司马', '上官', '诸葛', '东方', '皇甫', '尉迟', '公孙',
  '慕容', '令狐', '轩辕', '长孙', '宇文', '鲜于', '闾丘', '司徒',
  '司空', '太史', '端木', '呼延', '南宫', '钟离', '夏侯', '东郭'
];

function hasCompoundSurname(fullName) {
  if (!fullName || fullName.length < 2) return false;
  const firstTwoChars = fullName.substring(0, 2);
  return COMPOUND_SURNAMES.includes(firstTwoChars);
}

function splitChineseName(fullName) {
  if (!fullName) {
    return { lastName: '', firstName: '' };
  }

  const trimmedName = fullName.trim();

  if (trimmedName.length === 0) {
    return { lastName: '', firstName: '' };
  }

  if (trimmedName.length === 1) {
    return { lastName: trimmedName, firstName: '' };
  }

  // Check for compound surname (2 characters)
  if (hasCompoundSurname(trimmedName)) {
    return {
      lastName: trimmedName.substring(0, 2),
      firstName: trimmedName.substring(2)
    };
  }

  // Default: single-character surname
  return {
    lastName: trimmedName.substring(0, 1),
    firstName: trimmedName.substring(1)
  };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Apply initial language translations
    applyTranslations(currentLanguage);

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

    // Cleanup QR polling when leaving registration page
    if (document.getElementById('page-register').classList.contains('active') && pageName !== 'register') {
        cleanupQRPolling();
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
        initializeResearcherDashboard();
    } else if (currentUser.role === 'admin') {
        showPage('admin-dashboard');
        loadPendingExperiments();
    } else {
        showPage('subject-dashboard');
        // Initialize the first tab
        showSubjectTab('available', null);
    }
}

// Role selector handler - wrapped in DOMContentLoaded to ensure element exists
document.addEventListener('DOMContentLoaded', () => {
    const registerRole = document.getElementById('register-role');
    if (registerRole) {
        // Initialize researcher fields on page load
        updateResearcherFields();

        // Note: The onChange handler is now set directly in the HTML
        // onchange="updateResearcherFields()"
    }

    // Initialize name fields based on current language
    updateNameFields();
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

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const institution = document.getElementById('register-institution').value;
    const department = document.getElementById('register-department').value;
    const errorEl = document.getElementById('register-error');

    // Clear previous errors
    errorEl.textContent = '';
    errorEl.classList.remove('show');

    // Get name based on language
    let firstName, lastName;
    if (currentLanguage === 'zh') {
        const fullName = document.getElementById('register-fullName').value.trim();
        if (!fullName) {
            errorEl.textContent = translations[currentLanguage].name_required || '请输入姓名';
            errorEl.classList.add('show');
            return;
        }
        // Split Chinese name into lastName (surname) and firstName (given name)
        const { lastName: ln, firstName: fn } = splitChineseName(fullName);
        lastName = ln;
        firstName = fn;
    } else {
        firstName = document.getElementById('register-firstName').value.trim();
        lastName = document.getElementById('register-lastName').value.trim();
        if (!firstName || !lastName) {
            errorEl.textContent = translations[currentLanguage].name_required || 'Please enter your name';
            errorEl.classList.add('show');
            return;
        }
    }

    // Validate researcher fields
    if (role === 'researcher') {
        if (!institution || !institution.trim()) {
            errorEl.textContent = translations[currentLanguage].institution_required || 'Institution is required for researchers';
            errorEl.classList.add('show');
            return;
        }
        if (!department || !department.trim()) {
            errorEl.textContent = translations[currentLanguage].department_required || 'Department is required for researchers';
            errorEl.classList.add('show');
            return;
        }
    }

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

// Update researcher fields visibility and requirements
function updateResearcherFields() {
    const role = document.getElementById('register-role').value;
    const researcherFields = document.getElementById('researcher-fields');
    const institutionInput = document.getElementById('register-institution');
    const departmentInput = document.getElementById('register-department');

    if (role === 'researcher') {
        researcherFields.style.display = 'block';
        institutionInput.required = true;
        departmentInput.required = true;
    } else {
        researcherFields.style.display = 'none';
        institutionInput.required = false;
        departmentInput.required = false;
    }
}

// Toggle name fields based on language
function updateNameFields() {
    const nameFieldZh = document.getElementById('name-field-zh');
    const nameFieldsEn = document.getElementById('name-fields-en');
    const fullNameInput = document.getElementById('register-fullName');
    const firstNameInput = document.getElementById('register-firstName');
    const lastNameInput = document.getElementById('register-lastName');

    if (currentLanguage === 'zh') {
        // Show Chinese combined name field
        nameFieldZh.style.display = 'block';
        nameFieldsEn.style.display = 'none';
        fullNameInput.required = true;
        firstNameInput.required = false;
        lastNameInput.required = false;
    } else {
        // Show English separate name fields
        nameFieldZh.style.display = 'none';
        nameFieldsEn.style.display = 'block';
        fullNameInput.required = false;
        firstNameInput.required = true;
        lastNameInput.required = true;
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
            allExperiments = data.data; // Store for filtering

            // Update statistics if on dashboard view
            updateDashboardStatistics(data.data);

            // Load upcoming sessions if on dashboard view
            loadUpcomingSessions(data.data);

            if (data.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>No experiments yet. Create your first experiment to get started!</p>
                    </div>
                `;
            } else {
                // Apply current filter
                displayFilteredExperiments();
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

    // Map status to translation key and display text
    const statusMap = {
        'draft': 'draft',
        'pending_review': 'pending_review',
        'approved': 'approved',
        'rejected': 'rejected',
        'open': 'open_for_recruitment',
        'in_progress': 'in_progress',
        'completed': 'completed'
    };
    const statusKey = statusMap[exp.status] || exp.status;
    const statusBadge = `<span class="status-badge status-${exp.status}">${t[statusKey]}</span>`;

    // Format creation date
    const createdDate = new Date(exp.createdAt);
    const formattedDate = createdDate.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determine which buttons to show based on status
    const canEdit = ['draft', 'rejected'].includes(exp.status);
    const canReactivate = exp.status === 'completed';
    const canDelete = ['draft', 'rejected', 'approved', 'completed'].includes(exp.status);
    const canClose = ['open', 'in_progress'].includes(exp.status);
    const canWithdraw = exp.status === 'pending_review';
    const canViewSessions = ['approved', 'open', 'in_progress'].includes(exp.status);
    const canPublish = exp.status === 'approved';
    const hasSession = exp.sessions && exp.sessions.length > 0;

    return `
        <div class="experiment-card" data-exp-id="${exp._id}">
            <div class="experiment-header" style="cursor: pointer;">
                <div class="d-flex justify-content-between align-items-start">
                    <div style="flex: 1;" onclick="toggleExperimentCard('${exp._id}')">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-chevron-right experiment-toggle-icon" id="toggle-icon-${exp._id}" style="transition: transform 0.3s; font-size: 0.875rem;"></i>
                            <h4 style="margin: 0;"><i class="fas fa-flask me-2"></i>${exp.title}</h4>
                            ${statusBadge}
                        </div>
                        <div style="margin-left: 1.5rem; margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255,255,255,0.7);">
                            <i class="fas fa-clock me-1"></i>${t['created'] || 'Created'}: ${formattedDate}
                        </div>
                    </div>
                    <div class="experiment-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-left: 1rem;">
                        ${canEdit ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="event.stopPropagation(); editExperiment('${exp._id}')"><i class="fas fa-edit me-1"></i>${t['edit']}</button>` : ''}
                        ${canReactivate ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem; background: linear-gradient(135deg, #667eea, #764ba2);" onclick="event.stopPropagation(); reactivateExperiment('${exp._id}')"><i class="fas fa-play-circle me-1"></i>${t['reactivate']}</button>` : ''}
                        ${canViewSessions ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="event.stopPropagation(); viewSessions('${exp._id}')"><i class="fas fa-calendar me-1"></i>${t['sessions']}</button>` : ''}
                        ${canPublish ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem; background: linear-gradient(135deg, ${hasSession ? '#48bb78, #2f855a' : '#9ca3af, #6b7280'});" onclick="event.stopPropagation(); ${hasSession ? `publishExperiment('${exp._id}')` : 'return false;'}" ${!hasSession ? 'disabled' : ''}><i class="fas fa-rocket me-1"></i>${t['publish']}</button>` : ''}
                        ${canWithdraw ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem; background: linear-gradient(135deg, #fbbf24, #f59e0b);" onclick="event.stopPropagation(); withdrawExperiment('${exp._id}')"><i class="fas fa-undo me-1"></i>${t['withdraw']}</button>` : ''}
                        ${canClose ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem; background: linear-gradient(135deg, #f87171, #dc2626);" onclick="event.stopPropagation(); closeExperiment('${exp._id}')"><i class="fas fa-times-circle me-1"></i>${t['close_experiment']}</button>` : ''}
                        ${canDelete ? `<button class="glass-button" style="padding: 8px 16px; font-size: 0.875rem;" onclick="event.stopPropagation(); deleteExperiment('${exp._id}')"><i class="fas fa-trash me-1"></i>${t['delete']}</button>` : ''}
                    </div>
                </div>
            </div>
            <div class="experiment-content" id="content-${exp._id}" style="display: none; margin-top: 1rem;">
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
                ${exp.sessions && exp.sessions.length > 0 ? renderSessionsPreview(exp.sessions, exp._id) : `<p style="margin-top: 1rem; color: rgba(255, 255, 255, 0.7);"><i class="fas fa-info-circle me-2"></i>${t['no_sessions_scheduled']}</p>`}
            </div>
        </div>
    `;
}

// Toggle experiment card expand/collapse
function toggleExperimentCard(expId) {
    const content = document.getElementById(`content-${expId}`);
    const icon = document.getElementById(`toggle-icon-${expId}`);

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

function renderSessionsPreview(sessions, experimentId) {
    const t = translations[currentLanguage];
    console.log('renderSessionsPreview:', { experimentId, sessionCount: sessions.length });
    return `
        <div class="sessions-container">
            <strong>${t['scheduled_sessions']} (${sessions.length}):</strong>
            ${sessions.slice(0, 3).map(session => {
                // Get session ID - could be _id or id, convert to string
                let sessionId = session._id || session.id;
                if (sessionId && typeof sessionId === 'object') {
                    sessionId = sessionId.toString();
                }

                console.log('Session:', {
                    hasId: !!session._id,
                    id: session._id,
                    sessionId: sessionId,
                    location: session.location
                });

                if (!sessionId) {
                    console.error('No session ID found for session:', session);
                    return '';
                }

                return `
                <div class="session-card session-card-clickable" onclick="event.stopPropagation(); viewParticipants('${experimentId}', '${sessionId}')">
                    <div class="session-header">
                        <span class="session-time">${formatDate(session.startTime)}</span>
                        <span class="session-info">${session.participants.filter(p => p.status !== 'cancelled').length}/${session.maxParticipants} ${t['participants']}</span>
                    </div>
                    <div class="session-info">📍 ${session.location}</div>
                    <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-top: 0.25rem;">
                        <i class="fas fa-hand-pointer"></i> ${t['click_to_view_participants'] || 'Click to view participants'}
                    </div>
                </div>
                `;
            }).join('')}
            ${sessions.length > 3 ? `<p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">+${sessions.length - 3} ${t['sessions']}</p>` : ''}
        </div>
    `;
}

// Researcher Dashboard View Management
function showResearcherView(viewName) {
    // Hide all views
    document.querySelectorAll('.researcher-view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const selectedView = document.getElementById(`researcher-view-${viewName}`);
    if (selectedView) {
        selectedView.classList.add('active');
    }

    // Update navigation buttons
    document.querySelectorAll('.researcher-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        }
    });

    // Load data for the view if needed
    if (viewName === 'experiments') {
        displayFilteredExperiments();
    } else if (viewName === 'schedule') {
        loadSchedule();
    } else if (viewName === 'account') {
        loadAccountPage();
    }
}

// Update Dashboard Statistics
function updateDashboardStatistics(experiments) {
    // Count active experiments (open or in_progress)
    const activeCount = experiments.filter(exp =>
        exp.status === 'open' || exp.status === 'in_progress'
    ).length;

    // Count total participants across all sessions
    let totalParticipants = 0;
    let totalAttended = 0;
    let totalScheduled = 0;

    experiments.forEach(exp => {
        if (exp.sessions) {
            exp.sessions.forEach(session => {
                if (session.participants) {
                    const activeParticipants = session.participants.filter(p => p.status !== 'cancelled');
                    totalParticipants += activeParticipants.length;
                    totalScheduled += activeParticipants.length;
                    totalAttended += session.participants.filter(p => p.status === 'attended').length;
                }
            });
        }
    });

    // Count pending approval
    const pendingCount = experiments.filter(exp =>
        exp.status === 'pending_review'
    ).length;

    // Calculate attendance rate
    const attendanceRate = totalScheduled > 0
        ? Math.round((totalAttended / totalScheduled) * 100)
        : 0;

    // Update the UI
    const activeEl = document.getElementById('stat-active-experiments');
    const participantsEl = document.getElementById('stat-total-participants');
    const pendingEl = document.getElementById('stat-pending-approval');
    const attendanceEl = document.getElementById('stat-attendance-rate');

    if (activeEl) activeEl.textContent = activeCount;
    if (participantsEl) participantsEl.textContent = totalParticipants;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (attendanceEl) attendanceEl.textContent = `${attendanceRate}%`;
}

// Load Upcoming Sessions
function loadUpcomingSessions(experiments) {
    const container = document.getElementById('upcoming-sessions-container');
    if (!container) return;

    const t = translations[currentLanguage];
    const now = new Date();
    const upcomingSessions = [];

    // Collect all upcoming sessions
    experiments.forEach(exp => {
        if (exp.sessions && (exp.status === 'open' || exp.status === 'in_progress')) {
            exp.sessions.forEach(session => {
                const sessionDate = new Date(session.startTime);
                if (sessionDate > now) {
                    upcomingSessions.push({
                        ...session,
                        experimentId: exp._id,
                        experimentTitle: exp.title,
                        experimentStatus: exp.status
                    });
                }
            });
        }
    });

    // Sort by start time
    upcomingSessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Display first 3 sessions
    if (upcomingSessions.length === 0) {
        container.innerHTML = '<p class="text-muted"><i class="fas fa-info-circle me-2"></i>No upcoming sessions</p>';
    } else {
        container.innerHTML = upcomingSessions.slice(0, 3).map(session => {
            const participantCount = session.participants ? session.participants.filter(p => p.status !== 'cancelled').length : 0;
            return `
                <div class="upcoming-session-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5>${session.experimentTitle}</h5>
                            <p class="mb-1"><i class="fas fa-calendar me-2"></i>${formatDate(session.startTime)}</p>
                            <p class="mb-1"><i class="fas fa-map-marker-alt me-2"></i>${session.location}</p>
                        </div>
                        <div class="text-center">
                            <div class="status-badge status-${session.experimentStatus}">${t[session.experimentStatus === 'open' ? 'open_for_recruitment' : 'in_progress']}</div>
                            <p class="mt-2 mb-0">${participantCount}/${session.maxParticipants} <span>${t['participants'] || 'participants'}</span></p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Filter and Display Experiments
function displayFilteredExperiments() {
    const container = document.getElementById('researcher-experiments-container');
    if (!container) return;

    let filtered = allExperiments;

    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filtered = filtered.filter(exp => exp.status === currentStatusFilter);
    }

    // Apply search filter
    const searchInput = document.getElementById('experiment-search');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(exp =>
            exp.title.toLowerCase().includes(searchTerm) ||
            exp.description.toLowerCase().includes(searchTerm) ||
            exp.location.toLowerCase().includes(searchTerm)
        );
    }

    // Display results
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No experiments found</p>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map(exp => renderExperimentCard(exp)).join('');
    }
}

// Filter by Status
function filterExperimentsByStatus(status, event) {
    currentStatusFilter = status;

    // Update active tab
    if (event) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-button').classList.add('active');
    }

    // Apply filter
    displayFilteredExperiments();
}

// Search/Filter Experiments
function filterExperiments() {
    displayFilteredExperiments();
}

// Load Schedule View
function loadSchedule() {
    const container = document.getElementById('schedule-sessions-container');
    if (!container) return;

    const t = translations[currentLanguage];
    const now = new Date();
    const allSessions = [];

    // Collect all sessions
    allExperiments.forEach(exp => {
        if (exp.sessions) {
            exp.sessions.forEach(session => {
                const sessionDate = new Date(session.startTime);
                if (sessionDate > now) {
                    allSessions.push({
                        ...session,
                        experimentId: exp._id,
                        experimentTitle: exp.title,
                        experimentStatus: exp.status
                    });
                }
            });
        }
    });

    // Sort by start time
    allSessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Display all sessions
    if (allSessions.length === 0) {
        container.innerHTML = '<p class="text-muted">No sessions scheduled</p>';
    } else {
        container.innerHTML = allSessions.map(session => {
            const participantCount = session.participants ? session.participants.filter(p => p.status !== 'cancelled').length : 0;
            return `
                <div class="glass-card">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h5>${session.experimentTitle}</h5>
                            <p class="mb-1"><i class="fas fa-calendar me-2"></i>${formatDate(session.startTime)}</p>
                            <p class="mb-0"><i class="fas fa-map-marker-alt me-2"></i>${session.location}</p>
                        </div>
                        <div class="text-center">
                            <p class="mb-2">${participantCount}/${session.maxParticipants} <span>${t['participants'] || 'participants'}</span></p>
                            <button class="glass-button" onclick="viewParticipants('${session.experimentId}', '${session._id || session.id}')" style="padding: 8px 16px; font-size: 0.875rem;">
                                <i class="fas fa-users me-1"></i>${t['view_participants'] || 'View Participants'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Export All Data
function exportAllData() {
    showNotification(translations[currentLanguage]['export_data_placeholder'] || 'Export functionality coming soon!', 'info');
}

// Update researcher name display
function updateResearcherName() {
    const nameEl = document.getElementById('researcher-name');
    if (nameEl && currentUser) {
        nameEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
}

// Call this when loading researcher dashboard
function initializeResearcherDashboard() {
    updateResearcherName();
    loadResearcherExperiments();
}

// Account Page Functions
function loadAccountPage() {
    if (!currentUser) return;

    const t = translations[currentLanguage];

    // Populate profile information
    document.getElementById('profile-firstName').value = currentUser.firstName || '';
    document.getElementById('profile-lastName').value = currentUser.lastName || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-institution').value = currentUser.institution || '';
    document.getElementById('profile-department').value = currentUser.department || '';
    document.getElementById('profile-role').value = t[`role.${currentUser.role}`] || currentUser.role || '';

    // Populate statistics
    const totalExperiments = allExperiments.length;
    const activeSessions = allExperiments.reduce((count, exp) => {
        if (exp.sessions) {
            return count + exp.sessions.filter(s => new Date(s.startTime) > new Date()).length;
        }
        return count;
    }, 0);

    const totalParticipants = allExperiments.reduce((count, exp) => {
        if (exp.sessions) {
            exp.sessions.forEach(session => {
                if (session.participants) {
                    count += session.participants.filter(p => p.status !== 'cancelled').length;
                }
            });
        }
        return count;
    }, 0);

    document.getElementById('account-total-experiments').textContent = totalExperiments;
    document.getElementById('account-active-sessions').textContent = activeSessions;
    document.getElementById('account-total-participants').textContent = totalParticipants;

    // Format and display creation date
    if (currentUser.createdAt) {
        const createdDate = new Date(currentUser.createdAt);
        const formattedDate = createdDate.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('account-created-date').textContent = formattedDate;
    }
}

function enableEditProfile() {
    // Make fields editable
    document.getElementById('profile-firstName').removeAttribute('readonly');
    document.getElementById('profile-lastName').removeAttribute('readonly');
    document.getElementById('profile-institution').removeAttribute('readonly');
    document.getElementById('profile-department').removeAttribute('readonly');

    // Show/hide buttons
    document.getElementById('profile-edit-section').style.display = 'block';
    document.getElementById('profile-view-section').style.display = 'none';
}

function cancelEditProfile() {
    // Make fields readonly again
    document.getElementById('profile-firstName').setAttribute('readonly', true);
    document.getElementById('profile-lastName').setAttribute('readonly', true);
    document.getElementById('profile-institution').setAttribute('readonly', true);
    document.getElementById('profile-department').setAttribute('readonly', true);

    // Reload original values
    loadAccountPage();

    // Show/hide buttons
    document.getElementById('profile-edit-section').style.display = 'none';
    document.getElementById('profile-view-section').style.display = 'block';
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    const updatedData = {
        firstName: document.getElementById('profile-firstName').value,
        lastName: document.getElementById('profile-lastName').value,
        institution: document.getElementById('profile-institution').value,
        department: document.getElementById('profile-department').value
    };

    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentUser = { ...currentUser, ...updatedData };
            updateResearcherName();
            cancelEditProfile();
            showNotification(translations[currentLanguage]['account.profileUpdated'] || 'Profile updated successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showNotification('An error occurred while updating profile', 'error');
    }
}

async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('password-error');

    // Clear previous errors
    errorEl.textContent = '';
    errorEl.classList.remove('show');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        errorEl.textContent = translations[currentLanguage]['account.passwordMismatch'] || 'New passwords do not match';
        errorEl.classList.add('show');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Clear form
            document.getElementById('password-form').reset();
            showNotification(translations[currentLanguage]['account.passwordChanged'] || 'Password changed successfully!', 'success');
        } else {
            errorEl.textContent = data.error || 'Failed to change password';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred while changing password';
        errorEl.classList.add('show');
    }
}

// Add event listener for profile form
document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
});

// Experiment CRUD Functions
function populateStatusOptions(currentStatus) {
    const statusSelect = document.getElementById('exp-status');
    const t = translations[currentLanguage];

    // Clear existing options
    statusSelect.innerHTML = '';

    // For new experiments or drafts, only show draft and pending_review
    if (!currentStatus || currentStatus === 'draft') {
        statusSelect.innerHTML = `
            <option value="draft" data-i18n="draft">${t['draft']}</option>
            <option value="pending_review" data-i18n="submit_for_review">${t['submit_for_review']}</option>
        `;
    }
    // For approved experiments, allow publishing (changing to 'open')
    else if (currentStatus === 'approved') {
        statusSelect.innerHTML = `
            <option value="approved" data-i18n="approved">${t['approved']}</option>
            <option value="open" data-i18n="open_for_recruitment">${t['open_for_recruitment']}</option>
        `;
    }
    // For rejected experiments, allow resubmission
    else if (currentStatus === 'rejected') {
        statusSelect.innerHTML = `
            <option value="rejected" data-i18n="rejected">${t['rejected']}</option>
            <option value="pending_review" data-i18n="submit_for_review">${t['submit_for_review']}</option>
        `;
    }
    // For pending_review, allow going back to draft
    else if (currentStatus === 'pending_review') {
        statusSelect.innerHTML = `
            <option value="pending_review" data-i18n="pending_review">${t['pending_review']}</option>
            <option value="draft" data-i18n="draft">${t['draft']}</option>
        `;
    }
    // For open/in_progress experiments, keep current status
    else if (currentStatus === 'open' || currentStatus === 'in_progress') {
        const statusKey = currentStatus === 'open' ? 'open_for_recruitment' : 'in_progress';
        statusSelect.innerHTML = `
            <option value="${currentStatus}" data-i18n="${statusKey}">${t[statusKey]}</option>
        `;
    }
    // For completed experiments, cannot change
    else if (currentStatus === 'completed') {
        statusSelect.innerHTML = `
            <option value="completed" data-i18n="completed">${t['completed']}</option>
        `;
        statusSelect.disabled = true;
    }
}

function showCreateExperiment() {
    currentMode = 'create';
    currentExperiment = null;
    const t = translations[currentLanguage];
    document.getElementById('experiment-modal-title').textContent = t['create_experiment'];
    document.getElementById('experiment-form').reset();

    // Clear selected requirements
    clearSelectedRequirements();

    // Populate status options for new experiment
    populateStatusOptions(null);
    document.getElementById('exp-status').value = 'draft';
    document.getElementById('exp-status').disabled = false;

    updateSubmitButtonText();
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

            // Populate status options based on current status
            populateStatusOptions(data.data.status);
            document.getElementById('exp-status').value = data.data.status;

            // Clear and populate selected requirements
            clearSelectedRequirements();

            data.data.requirements.forEach(req => {
                // Check if it matches a suggested requirement
                let matched = false;
                const requirementOptions = document.querySelectorAll('.requirement-option');

                requirementOptions.forEach(option => {
                    const reqKey = option.getAttribute('data-req-key');
                    const translatedText = t[reqKey];
                    const englishText = translations['en'][reqKey];

                    // Check both languages
                    if (req === translatedText || req === englishText) {
                        addRequirement(reqKey, req);
                        matched = true;
                    }
                });

                // If not matched, it's a custom requirement
                if (!matched) {
                    const customKey = 'custom_' + Date.now() + '_' + Math.random();
                    addRequirement(customKey, req);
                }
            });

            // Show current IRB document if exists
            if (data.data.irbDocument) {
                document.getElementById('irb-current-file').style.display = 'block';
                document.getElementById('irb-current-link').textContent = data.data.irbDocument.originalName;
                document.getElementById('irb-current-link').href = `/api/experiments/${data.data._id}/irb-download`;
            } else {
                document.getElementById('irb-current-file').style.display = 'none';
            }

            updateSubmitButtonText();
            document.getElementById('experiment-modal').classList.add('show');
        }
    } catch (error) {
        alert('Error loading experiment');
    }
}

async function handleExperimentSubmit(event) {
    event.preventDefault();

    // Collect selected requirements from chips
    const requirements = [];
    const chips = document.querySelectorAll('#selected-requirements .requirement-chip');
    chips.forEach(chip => {
        const text = chip.querySelector('span:first-child').textContent;
        requirements.push(text);
    });

    const experimentData = {
        title: document.getElementById('exp-title').value,
        description: document.getElementById('exp-description').value,
        location: document.getElementById('exp-location').value,
        duration: parseInt(document.getElementById('exp-duration').value),
        compensation: document.getElementById('exp-compensation').value,
        maxParticipants: parseInt(document.getElementById('exp-maxParticipants').value),
        requirements: requirements,
        status: document.getElementById('exp-status').value
    };

    const errorEl = document.getElementById('experiment-error');

    // Check if IRB document is required
    const needsIRB = experimentData.status === 'pending_review' && !currentExperiment?.irbDocument && !selectedIRBFile;
    if (needsIRB) {
        errorEl.textContent = translations[currentLanguage].irb_required || 'IRB document is required when submitting for review';
        errorEl.classList.add('show');
        return;
    }

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
            // Upload IRB file if one was selected
            if (selectedIRBFile) {
                const uploadSuccess = await uploadIRBDocument(data.data._id, selectedIRBFile);
                if (!uploadSuccess) {
                    errorEl.textContent = translations[currentLanguage].irb_upload_failed || 'Experiment saved, but IRB upload failed';
                    errorEl.classList.add('show');
                    setTimeout(() => {
                        closeExperimentModal();
                        loadResearcherExperiments();
                    }, 2000);
                    return;
                }
            }

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

// Upload IRB document for an experiment
async function uploadIRBDocument(experimentId, file) {
    try {
        const formData = new FormData();
        formData.append('irbDocument', file);

        const response = await fetch(`/api/experiments/${experimentId}/irb-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        console.error('IRB upload error:', error);
        return false;
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

async function closeExperiment(expId) {
    const t = translations[currentLanguage];
    if (!confirm(t['confirm_close_experiment'] || 'Are you sure you want to close this experiment? This will mark it as completed.')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(t['experiment_closed'] || 'Experiment closed successfully', 'success');
            loadResearcherExperiments();
        } else {
            alert(data.error || 'Error closing experiment');
        }
    } catch (error) {
        alert('Error closing experiment');
    }
}

async function withdrawExperiment(expId) {
    const t = translations[currentLanguage];
    if (!confirm(t['confirm_withdraw_experiment'] || 'Are you sure you want to withdraw this experiment from review? It will be returned to draft status.')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'draft' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(t['experiment_withdrawn'] || 'Experiment withdrawn successfully. You can now edit it.', 'success');
            loadResearcherExperiments();
        } else {
            alert(data.error || 'Error withdrawing experiment');
        }
    } catch (error) {
        alert('Error withdrawing experiment');
    }
}

async function publishExperiment(expId) {
    const t = translations[currentLanguage];
    if (!confirm(t['confirm_publish_experiment'] || 'Are you sure you want to publish this experiment? It will be open for participant recruitment.')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'open' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(t['experiment_published'] || 'Experiment published successfully! It is now open for recruitment.', 'success');
            loadResearcherExperiments();
        } else {
            alert(data.error || 'Error publishing experiment');
        }
    } catch (error) {
        alert('Error publishing experiment');
    }
}

async function reactivateExperiment(expId) {
    const t = translations[currentLanguage];
    if (!confirm(t['confirm_reactivate_experiment'] || 'Are you sure you want to reactivate this experiment? It will be returned to draft status for editing.')) {
        return;
    }

    try {
        const response = await fetch(`/api/experiments/${expId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'draft' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(t['experiment_reactivated'] || 'Experiment reactivated successfully. You can now edit and resubmit it.', 'success');
            loadResearcherExperiments();
        } else {
            alert(data.error || 'Error reactivating experiment');
        }
    } catch (error) {
        alert('Error reactivating experiment');
    }
}

function closeExperimentModal() {
    document.getElementById('experiment-modal').classList.remove('show');
    document.getElementById('experiment-error').classList.remove('show');

    // Clear IRB file selection
    selectedIRBFile = null;
    document.getElementById('exp-irb-document').value = '';
    document.getElementById('irb-file-info').style.display = 'none';
    document.getElementById('irb-current-file').style.display = 'none';
}

// Update submit button text based on status
function updateSubmitButtonText() {
    const status = document.getElementById('exp-status').value;
    const submitBtn = document.getElementById('experiment-submit-btn');
    const t = translations[currentLanguage];

    if (status === 'open') {
        submitBtn.innerHTML = `<i class="fas fa-rocket me-2"></i>${t['publish']}`;
        submitBtn.setAttribute('data-i18n', 'publish');
    } else if (status === 'pending_review') {
        submitBtn.innerHTML = `<i class="fas fa-paper-plane me-2"></i>${t['submit']}`;
        submitBtn.setAttribute('data-i18n', 'submit');
    } else {
        submitBtn.innerHTML = `<i class="fas fa-save me-2"></i>${t['save']}`;
        submitBtn.setAttribute('data-i18n', 'save');
    }
}

// Add event listener for status change
document.addEventListener('DOMContentLoaded', () => {
    const statusSelect = document.getElementById('exp-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', updateSubmitButtonText);
    }

    // Add click handlers for requirement options
    const requirementOptions = document.querySelectorAll('.requirement-option');
    requirementOptions.forEach(option => {
        option.addEventListener('click', function() {
            const reqKey = this.getAttribute('data-req-key');
            const reqText = this.textContent;
            addRequirement(reqKey, reqText);
        });
    });

    // Add enter key handler for custom requirement input
    const customReqInput = document.getElementById('exp-custom-requirement');
    if (customReqInput) {
        customReqInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomRequirement();
            }
        });
    }
});

// Requirements management
function addRequirement(key, text) {
    const container = document.getElementById('selected-requirements');

    // Check if requirement already exists
    if (container.querySelector(`[data-req-key="${key}"]`)) {
        return; // Already added
    }

    const chip = document.createElement('div');
    chip.className = 'requirement-chip';
    chip.setAttribute('data-req-key', key);
    chip.innerHTML = `
        <span>${text}</span>
        <span class="remove-btn" onclick="removeRequirement('${key}')">&times;</span>
    `;

    container.appendChild(chip);
}

function removeRequirement(key) {
    const container = document.getElementById('selected-requirements');
    const chip = container.querySelector(`[data-req-key="${key}"]`);
    if (chip) {
        chip.remove();
    }
}

function addCustomRequirement() {
    const input = document.getElementById('exp-custom-requirement');
    const text = input.value.trim();

    if (!text) return;

    // Generate a unique key for custom requirement
    const key = 'custom_' + Date.now();
    addRequirement(key, text);
    input.value = ''; // Clear input
}

function clearSelectedRequirements() {
    const container = document.getElementById('selected-requirements');
    container.innerHTML = '';
}

// Registration Tab Switching
function switchRegisterTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.auth-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`register-${tabName}-content`).classList.add('active');

    // Initialize QR code when switching to QR tabs
    if (tabName === 'wechat') {
        initWeChatQR();
    } else if (tabName === 'qq') {
        initQQQR();
    }
}

// WeChat QR Code Management
let wechatQRPolling = null;
let wechatQRCode = null;

async function initWeChatQR() {
    try {
        const qrContainer = document.getElementById('wechat-qr-code');
        const statusEl = document.getElementById('wechat-qr-status');

        // Show loading state
        qrContainer.innerHTML = `
            <div class="qr-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p data-i18n="loading_qr">Loading QR Code...</p>
            </div>
        `;
        statusEl.textContent = '';
        statusEl.className = 'qr-status';

        // Request QR code from backend
        const response = await fetch(`${API_URL}/api/auth/wechat/qr`, {
            method: 'GET'
        });

        const result = await response.json();

        if (result.success && result.data.qrCodeUrl) {
            wechatQRCode = result.data;

            // Display QR code
            qrContainer.innerHTML = `<img src="${result.data.qrCodeUrl}" alt="WeChat QR Code">`;

            // Start polling for scan status
            startWeChatQRPolling(result.data.ticket);
        } else {
            throw new Error(result.error || 'Failed to generate QR code');
        }
    } catch (error) {
        console.error('WeChat QR Error:', error);
        const qrContainer = document.getElementById('wechat-qr-code');
        const statusEl = document.getElementById('wechat-qr-status');

        qrContainer.innerHTML = `
            <div class="qr-loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load QR code</p>
            </div>
        `;
        statusEl.textContent = error.message || 'Error loading QR code';
        statusEl.className = 'qr-status error';
    }
}

function startWeChatQRPolling(ticket) {
    // Clear existing polling
    if (wechatQRPolling) {
        clearInterval(wechatQRPolling);
    }

    const statusEl = document.getElementById('wechat-qr-status');
    statusEl.textContent = translations[currentLanguage].waiting_for_scan || 'Waiting for scan...';
    statusEl.className = 'qr-status waiting';

    wechatQRPolling = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/wechat/check?ticket=${ticket}`);
            const result = await response.json();

            if (result.success && result.data.status === 'scanned') {
                clearInterval(wechatQRPolling);
                statusEl.textContent = translations[currentLanguage].qr_scanned || 'QR Code Scanned! Completing registration...';
                statusEl.className = 'qr-status success';

                // Handle successful authentication
                if (result.data.token && result.data.user) {
                    localStorage.setItem('token', result.data.token);
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                    showDashboard();
                }
            } else if (result.data.status === 'expired') {
                clearInterval(wechatQRPolling);
                statusEl.textContent = translations[currentLanguage].qr_expired || 'QR Code expired. Please refresh.';
                statusEl.className = 'qr-status error';
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000); // Poll every 2 seconds
}

function refreshWeChatQR() {
    if (wechatQRPolling) {
        clearInterval(wechatQRPolling);
    }
    initWeChatQR();
}

// QQ QR Code Management
let qqQRPolling = null;
let qqQRCode = null;

async function initQQQR() {
    try {
        const qrContainer = document.getElementById('qq-qr-code');
        const statusEl = document.getElementById('qq-qr-status');

        // Show loading state
        qrContainer.innerHTML = `
            <div class="qr-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p data-i18n="loading_qr">Loading QR Code...</p>
            </div>
        `;
        statusEl.textContent = '';
        statusEl.className = 'qr-status';

        // Request QR code from backend
        const response = await fetch(`${API_URL}/api/auth/qq/qr`, {
            method: 'GET'
        });

        const result = await response.json();

        if (result.success && result.data.qrCodeUrl) {
            qqQRCode = result.data;

            // Display QR code
            qrContainer.innerHTML = `<img src="${result.data.qrCodeUrl}" alt="QQ QR Code">`;

            // Start polling for scan status
            startQQQRPolling(result.data.ticket);
        } else {
            throw new Error(result.error || 'Failed to generate QR code');
        }
    } catch (error) {
        console.error('QQ QR Error:', error);
        const qrContainer = document.getElementById('qq-qr-code');
        const statusEl = document.getElementById('qq-qr-status');

        qrContainer.innerHTML = `
            <div class="qr-loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load QR code</p>
            </div>
        `;
        statusEl.textContent = error.message || 'Error loading QR code';
        statusEl.className = 'qr-status error';
    }
}

function startQQQRPolling(ticket) {
    // Clear existing polling
    if (qqQRPolling) {
        clearInterval(qqQRPolling);
    }

    const statusEl = document.getElementById('qq-qr-status');
    statusEl.textContent = translations[currentLanguage].waiting_for_scan || 'Waiting for scan...';
    statusEl.className = 'qr-status waiting';

    qqQRPolling = setInterval(async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/qq/check?ticket=${ticket}`);
            const result = await response.json();

            if (result.success && result.data.status === 'scanned') {
                clearInterval(qqQRPolling);
                statusEl.textContent = translations[currentLanguage].qr_scanned || 'QR Code Scanned! Completing registration...';
                statusEl.className = 'qr-status success';

                // Handle successful authentication
                if (result.data.token && result.data.user) {
                    localStorage.setItem('token', result.data.token);
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                    showDashboard();
                }
            } else if (result.data.status === 'expired') {
                clearInterval(qqQRPolling);
                statusEl.textContent = translations[currentLanguage].qr_expired || 'QR Code expired. Please refresh.';
                statusEl.className = 'qr-status error';
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000); // Poll every 2 seconds
}

function refreshQQQR() {
    if (qqQRPolling) {
        clearInterval(qqQRPolling);
    }
    initQQQR();
}

// Cleanup polling when leaving registration page
function cleanupQRPolling() {
    if (wechatQRPolling) {
        clearInterval(wechatQRPolling);
        wechatQRPolling = null;
    }
    if (qqQRPolling) {
        clearInterval(qqQRPolling);
        qqQRPolling = null;
    }
}

// IRB Document Handling
let selectedIRBFile = null;

function handleIRBFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedIRBFile = file;

    // Show file info
    document.getElementById('irb-file-name').textContent = file.name;
    document.getElementById('irb-file-info').style.display = 'block';
}

function removeIRBFile() {
    selectedIRBFile = null;
    document.getElementById('exp-irb-document').value = '';
    document.getElementById('irb-file-info').style.display = 'none';
}

// Admin Dashboard Functions
function showAdminTab(tab, event) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked tab
    event.target.classList.add('active');

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Show selected tab content
    if (tab === 'pending') {
        document.getElementById('admin-pending-container').classList.add('active');
        loadPendingExperiments();
    } else {
        document.getElementById('admin-all-container').classList.add('active');
        loadAllExperimentsForAdmin();
    }
}

async function loadPendingExperiments() {
    const container = document.getElementById('admin-pending-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('/api/experiments/admin/pending', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.data.length === 0) {
                container.innerHTML = `<p>${translations[currentLanguage].no_pending_experiments || 'No pending experiments'}</p>`;
                return;
            }

            container.innerHTML = data.data.map(exp => `
                <div class="experiment-card">
                    <h3>${exp.title}</h3>
                    <p>${exp.description}</p>
                    <div class="experiment-meta">
                        <span><i class="fas fa-user"></i> ${exp.researcher.firstName} ${exp.researcher.lastName}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${exp.location}</span>
                        <span><i class="fas fa-clock"></i> ${exp.duration} ${translations[currentLanguage].minutes || 'minutes'}</span>
                        <span><i class="fas fa-users"></i> ${exp.maxParticipants} ${translations[currentLanguage].max_participants || 'max'}</span>
                    </div>
                    ${exp.requirements && exp.requirements.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong><i class="fas fa-list-check me-2"></i>${translations[currentLanguage].requirements || 'Requirements'}:</strong>
                            <ul class="requirements-list" style="margin-top: 0.5rem;">
                                ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="experiment-actions">
                        ${exp.irbDocument ? `
                            <button class="glass-button" onclick="window.open('/api/experiments/${exp._id}/irb-download', '_blank')">
                                <i class="fas fa-file-download me-1"></i>${translations[currentLanguage].download_irb || 'Download IRB'}
                            </button>
                        ` : '<span style="color: #f87171;">No IRB Document</span>'}
                        <button class="glass-button" onclick="openAdminReviewModal('${exp._id}')">
                            <i class="fas fa-gavel me-1"></i>${translations[currentLanguage].review || 'Review'}
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p>Error loading experiments</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p>Error loading experiments</p>`;
    }
}

async function loadAllExperimentsForAdmin() {
    const container = document.getElementById('admin-all-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('/api/experiments/admin/all', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.data.length === 0) {
                container.innerHTML = `<p>${translations[currentLanguage].no_experiments || 'No experiments'}</p>`;
                return;
            }

            container.innerHTML = data.data.map(exp => {
                const statusColors = {
                    'draft': '#9ca3af',
                    'pending_review': '#fbbf24',
                    'approved': '#48bb78',
                    'rejected': '#f87171',
                    'open': '#667eea',
                    'in_progress': '#38b2ac',
                    'completed': '#4299e1',
                    'cancelled': '#cbd5e0'
                };
                const statusColor = statusColors[exp.status] || '#9ca3af';

                return `
                    <div class="experiment-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h3>${exp.title}</h3>
                            <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">
                                ${translations[currentLanguage][exp.status] || exp.status}
                            </span>
                        </div>
                        <p>${exp.description}</p>
                        <div class="experiment-meta">
                            <span><i class="fas fa-user"></i> ${exp.researcher.firstName} ${exp.researcher.lastName}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${exp.location}</span>
                            <span><i class="fas fa-clock"></i> ${exp.duration} ${translations[currentLanguage].minutes || 'minutes'}</span>
                        </div>
                        ${exp.requirements && exp.requirements.length > 0 ? `
                            <div style="margin-top: 1rem;">
                                <strong><i class="fas fa-list-check me-2"></i>${translations[currentLanguage].requirements || 'Requirements'}:</strong>
                                <ul class="requirements-list" style="margin-top: 0.5rem;">
                                    ${exp.requirements.map(req => `<li>${req}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${exp.adminReview ? `
                            <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 0.9rem;">
                                <strong>${translations[currentLanguage].admin_notes || 'Admin Notes'}:</strong> ${exp.adminReview.notes}
                            </div>
                        ` : ''}
                        <div class="experiment-actions">
                            ${exp.status === 'pending_review' ? `
                                <button class="glass-button" onclick="openAdminReviewModal('${exp._id}')">
                                    <i class="fas fa-gavel me-1"></i>${translations[currentLanguage].review || 'Review'}
                                </button>
                            ` : ''}
                            <button class="glass-button" onclick="viewSessions('${exp._id}')">
                                <i class="fas fa-calendar me-1"></i>${translations[currentLanguage].view_details || 'View Details'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<p>Error loading experiments</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p>Error loading experiments</p>`;
    }
}

let currentReviewExperiment = null;

async function openAdminReviewModal(experimentId) {
    try {
        const response = await fetch(`/api/experiments/${experimentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentReviewExperiment = data.data;

            // Display experiment details
            const detailsContainer = document.getElementById('review-experiment-details');
            detailsContainer.innerHTML = `
                <div class="experiment-review-details">
                    <h3>${currentReviewExperiment.title}</h3>
                    <p><strong>${translations[currentLanguage].description || 'Description'}:</strong> ${currentReviewExperiment.description}</p>
                    <div class="experiment-meta">
                        <span><i class="fas fa-user"></i> ${currentReviewExperiment.researcher.firstName} ${currentReviewExperiment.researcher.lastName}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${currentReviewExperiment.location}</span>
                        <span><i class="fas fa-clock"></i> ${currentReviewExperiment.duration} ${translations[currentLanguage].minutes || 'minutes'}</span>
                        <span><i class="fas fa-dollar-sign"></i> ${currentReviewExperiment.compensation}</span>
                    </div>
                    ${currentReviewExperiment.requirements && currentReviewExperiment.requirements.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <p><strong><i class="fas fa-list-check me-2"></i>${translations[currentLanguage].requirements || 'Requirements'}:</strong></p>
                            <ul class="requirements-list" style="margin-top: 0.5rem;">
                                ${currentReviewExperiment.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${currentReviewExperiment.irbDocument ? `
                        <div style="margin-top: 1rem;">
                            <a href="/api/experiments/${currentReviewExperiment._id}/irb-download" target="_blank" class="glass-button">
                                <i class="fas fa-file-download me-1"></i>${translations[currentLanguage].download_irb || 'Download IRB Document'}
                            </a>
                        </div>
                    ` : `<p style="color: #f87171;">${translations[currentLanguage].no_irb || 'No IRB document uploaded'}</p>`}
                </div>
            `;

            // Clear notes
            document.getElementById('admin-notes').value = '';
            document.getElementById('admin-review-error').classList.remove('show');

            // Show modal
            document.getElementById('admin-review-modal').classList.add('show');
        }
    } catch (error) {
        alert('Error loading experiment details');
    }
}

function closeAdminReviewModal() {
    document.getElementById('admin-review-modal').classList.remove('show');
    currentReviewExperiment = null;
}

async function handleAdminAction(action) {
    const notes = document.getElementById('admin-notes').value.trim();
    const errorEl = document.getElementById('admin-review-error');

    // Require notes for rejection
    if (action === 'rejected' && !notes) {
        errorEl.textContent = translations[currentLanguage].rejection_notes_required || 'Rejection notes are required';
        errorEl.classList.add('show');
        return;
    }

    try {
        const endpoint = action === 'approved' ? 'approve' : 'reject';
        const response = await fetch(`/api/experiments/${currentReviewExperiment._id}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ notes })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            closeAdminReviewModal();
            loadPendingExperiments();
            showNotification(
                action === 'approved'
                    ? (translations[currentLanguage].experiment_approved || 'Experiment approved')
                    : (translations[currentLanguage].experiment_rejected || 'Experiment rejected'),
                'success'
            );
        } else {
            errorEl.textContent = data.error || 'Failed to process review';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'An error occurred. Please try again.';
        errorEl.classList.add('show');
    }
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

async function viewParticipants(experimentId, sessionId) {
    const t = translations[currentLanguage];

    console.log('viewParticipants called with:', { experimentId, sessionId });

    try {
        const url = `/api/experiments/${experimentId}/sessions/${sessionId}/participants`;
        console.log('Fetching:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Response status:', response.status, response.statusText);

        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorMessage = t['error_loading_participants'] || 'Error loading participants';

            // Try to parse JSON error if available
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                errorMessage = data.error || data.message || errorMessage;
            } else {
                // Non-JSON response (likely HTML error page)
                errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
            }

            console.error('Error response:', { status: response.status, message: errorMessage });
            showNotification(errorMessage, 'error');
            return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            console.error('Error response:', data);
            showNotification(data.error || t['error_loading_participants'] || 'Error loading participants', 'error');
            return;
        }

        const sessionData = data.data;
        const participants = sessionData.participants;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>${t['registered_participants'] || 'Registered Participants'}</h2>
                    <button class="modal-close" onclick="closeParticipantsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-info-summary" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <p><strong>${t['session_time'] || 'Session Time'}:</strong> ${new Date(sessionData.startTime).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US')}</p>
                        <p><strong>${t['location'] || 'Location'}:</strong> ${sessionData.location}</p>
                        <p><strong>${t['total_participants'] || 'Total Participants'}:</strong> ${sessionData.activeParticipants}/${sessionData.maxParticipants}</p>
                    </div>

                    ${participants.length === 0 ? `
                        <p style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 2rem;">
                            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                            ${t['no_participants'] || 'No participants have registered yet'}
                        </p>
                    ` : `
                        <div class="participants-list">
                            ${participants.map(p => renderParticipantInModal(p, experimentId, sessionId)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        modal.id = 'participants-modal';
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading participants:', error);
        showNotification(t['error_loading_participants'] || 'Error loading participants', 'error');
    }
}

function renderParticipantInModal(participant, experimentId, sessionId) {
    const t = translations[currentLanguage];
    const user = participant.user;
    const statusKey = participant.status === 'registered' ? 'registered' :
                      participant.status === 'confirmed' ? 'confirmed' :
                      participant.status === 'attended' ? 'attended' :
                      participant.status === 'no_show' ? 'no_show' : 'cancelled';
    const statusBadge = `<span class="badge badge-${participant.status}">${t[statusKey]}</span>`;

    // Format signup time
    const signupTime = new Date(participant.signupTime).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US');

    return `
        <div class="participant-item" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="font-size: 1.1rem;">${user.firstName} ${user.lastName}</strong>
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                        <i class="fas fa-envelope"></i> ${user.email}
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">
                        <i class="fas fa-clock"></i> ${t['registered_at'] || 'Registered'}: ${signupTime}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                    ${statusBadge}
                    <select class="participant-status-select" onchange="updateParticipantStatus('${experimentId}', '${sessionId}', '${user._id}', this.value)" style="padding: 0.25rem 0.5rem; border-radius: 4px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 0.875rem;">
                        <option value="registered" ${participant.status === 'registered' ? 'selected' : ''}>${t['registered']}</option>
                        <option value="confirmed" ${participant.status === 'confirmed' ? 'selected' : ''}>${t['confirmed']}</option>
                        <option value="attended" ${participant.status === 'attended' ? 'selected' : ''}>${t['attended']}</option>
                        <option value="no_show" ${participant.status === 'no_show' ? 'selected' : ''}>${t['no_show']}</option>
                        <option value="cancelled" ${participant.status === 'cancelled' ? 'selected' : ''}>${t['cancelled']}</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

function closeParticipantsModal() {
    const modal = document.getElementById('participants-modal');
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
    const t = translations[currentLanguage];
    try {
        const response = await fetch(`/api/experiments/${experimentId}/sessions/${sessionId}/participants/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification(t['status_updated'] || 'Status updated successfully', 'success');

            // If participants modal is open, reload it
            const participantsModal = document.getElementById('participants-modal');
            if (participantsModal) {
                closeParticipantsModal();
                await viewParticipants(experimentId, sessionId);
            }

            // If sessions modal is open, reload the sessions view
            const sessionsModal = document.getElementById('sessions-view-modal');
            if (sessionsModal) {
                closeSessionsModal();
                await viewSessions(experimentId);
            }
        } else {
            showNotification(t['error_updating_status'] || 'Error updating participant status', 'error');
        }
    } catch (error) {
        console.error('Error updating participant status:', error);
        showNotification(t['error_updating_status'] || 'Error updating participant status', 'error');
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

    // Activate the clicked tab button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // If no event (programmatic call), find and activate the correct button
        const buttons = document.querySelectorAll('.tab-button');
        const index = tab === 'available' ? 0 : 1;
        if (buttons[index]) {
            buttons[index].classList.add('active');
        }
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
let currentLanguage = 'zh';

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
        'institution': 'College/School',
        'department': 'Department',
        'already_have_account': 'Already have an account?',
        'full_name': 'Full Name',
        'name_required': 'Please enter your name',
        'institution_required': 'Institution is required for researchers',
        'department_required': 'Department is required for researchers',
        'email_register': 'Email',
        'wechat_register': 'WeChat',
        'qq_register': 'QQ',
        'scan_wechat_qr': 'Scan with WeChat',
        'wechat_qr_desc': 'Open WeChat and scan the QR code to register',
        'scan_qq_qr': 'Scan with QQ',
        'qq_qr_desc': 'Open QQ and scan the QR code to register',
        'loading_qr': 'Loading QR Code...',
        'refresh_qr': 'Refresh QR Code',
        'waiting_for_scan': 'Waiting for scan...',
        'qr_scanned': 'QR Code Scanned! Completing registration...',
        'qr_expired': 'QR Code expired. Please refresh.',

        // Researcher Dashboard
        'researcher_dashboard': 'Researcher Dashboard',
        'create_new_experiment': 'Create New Experiment',
        'no_experiments': 'No experiments yet. Create your first experiment to get started!',

        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.experiments': 'Experiments',
        'nav.schedule': 'Schedule',
        'nav.account': 'Account',
        'account.profile': 'Profile',
        'account.settings': 'Settings',
        'account.logout': 'Logout',
        'account.changePassword': 'Change Password',
        'account.currentPassword': 'Current Password',
        'account.newPassword': 'New Password',
        'account.confirmPassword': 'Confirm Password',
        'account.updatePassword': 'Update Password',
        'account.statistics': 'Account Statistics',
        'account.totalExperiments': 'Total Experiments',
        'account.activeSessions': 'Active Sessions',
        'account.memberSince': 'Member Since',
        'account.accountStatus': 'Account Status',
        'account.active': 'Active',
        'account.profileUpdated': 'Profile updated successfully',
        'account.passwordMismatch': 'New passwords do not match',
        'account.passwordChanged': 'Password changed successfully',
        'account.passwordError': 'Failed to change password',
        'account.profileError': 'Failed to update profile',

        // Dashboard Overview
        'dashboard.overview': 'Dashboard Overview',
        'dashboard.activeExperiments': 'Active Experiments',
        'dashboard.totalParticipants': 'Total Participants',
        'dashboard.pendingApproval': 'Pending Approval',
        'dashboard.attendanceRate': 'Attendance Rate',
        'dashboard.upcomingSessions': 'Upcoming Sessions',
        'dashboard.quickActions': 'Quick Actions',
        'dashboard.recentActivity': 'Recent Activity',

        // Quick Actions
        'action.createExperiment': 'Create New Experiment',
        'action.myExperiments': 'My Experiments',
        'action.viewSchedule': 'View Schedule',
        'action.exportData': 'Export Data',
        'action.view': 'View',
        'action.signup': 'Sign Up',
        'action.attendance': 'Attendance',
        'action.approve': 'Approve',
        'action.reject': 'Reject',
        'action.saveChanges': 'Save Changes',
        'action.editProfile': 'Edit Profile',

        // Experiments View
        'experiments.title': 'Experiment Management',
        'search.placeholder': 'Search experiments by title, location, or description...',
        'tabs.allExperiments': 'All Experiments',
        'tabs.drafts': 'Drafts',
        'tabs.pendingApproval': 'Pending Approval',
        'tabs.active': 'Active',

        // Schedule View
        'schedule.title': 'My Schedule',
        'schedule.upcomingSessions': 'Upcoming Sessions',

        // Roles
        'role.researcher': 'Researcher',
        'role.admin': 'Admin',
        'role.participant': 'Participant',

        // Status
        'status.posted': 'Posted',
        'status.open': 'Open',
        'status.closed': 'Closed',
        'status.pending': 'Pending',

        // Common
        'common.slots': 'slots',
        'common.hoursAgo': 'hours ago',
        'common.minutes': 'minutes',
        'common.participants': 'participants',

        // Other
        'view_participants': 'View Participants',
        'export_data_placeholder': 'Export functionality coming soon!',
        'pending_review': 'Pending Review',

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
        'created': 'Created',
        'researcher': 'Researcher',
        'no_sessions_scheduled': 'No sessions scheduled yet.',
        'scheduled_sessions': 'Scheduled Sessions',
        'participants': 'Participants',
        'spots_left': 'spots left',
        'click_to_view_participants': 'Click to view participants',

        // Modal titles and labels
        'create_experiment': 'Create Experiment',
        'edit_experiment': 'Edit Experiment',
        'title': 'Title',
        'description': 'Description',
        'duration_minutes': 'Duration (minutes)',
        'max_participants_per_session': 'Max Participants per Session',
        'requirements_one_per_line': 'Requirements (one per line)',
        'draft': 'Draft',
        'submit_for_review': 'Submit for Review',
        'pending_review': 'Pending Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'open_for_recruitment': 'Open for Recruitment',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'irb_approval': 'IRB Approval Document',
        'upload_irb': 'Upload IRB Document',
        'current_irb': 'Current IRB',

        // Admin Dashboard
        'admin_dashboard': 'Admin Dashboard',
        'all_experiments': 'All Experiments',
        'review_experiment': 'Review Experiment',
        'admin_notes': 'Review Notes',
        'approve': 'Approve',
        'reject': 'Reject',
        'no_pending_experiments': 'No experiments pending review',
        'download_irb': 'Download IRB',
        'review': 'Review',
        'no_irb': 'No IRB document uploaded',
        'rejection_notes_required': 'Rejection notes are required',
        'experiment_approved': 'Experiment approved successfully',
        'experiment_rejected': 'Experiment rejected',
        'irb_required': 'IRB document is required when submitting for review',
        'irb_upload_failed': 'Experiment saved, but IRB upload failed',
        'view_details': 'View Details',
        'max_participants': 'max',
        'minutes': 'minutes',

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
        'registered_at': 'Registered at',
        'session_time': 'Session Time',
        'total_participants': 'Total Participants',
        'no_participants': 'No participants have registered yet',
        'error_loading_participants': 'Error loading participants',
        'status_updated': 'Status updated successfully',
        'error_updating_status': 'Error updating participant status',

        // Actions
        'edit': 'Edit',
        'delete': 'Delete',
        'sessions': 'Sessions',
        'cancel': 'Cancel',
        'save': 'Save',
        'submit': 'Submit',
        'publish': 'Publish',
        'register': 'Register',
        'registered': 'Registered',
        'full': 'Full',
        'withdraw': 'Withdraw',
        'reactivate': 'Re-activate',
        'close_experiment': 'Close Experiment',
        'confirm_close_experiment': 'Are you sure you want to close this experiment? This will mark it as completed.',
        'experiment_closed': 'Experiment closed successfully',
        'confirm_withdraw_experiment': 'Are you sure you want to withdraw this experiment from review? It will be returned to draft status.',
        'experiment_withdrawn': 'Experiment withdrawn successfully. You can now edit it.',
        'confirm_publish_experiment': 'Are you sure you want to publish this experiment? It will be open for participant recruitment.',
        'experiment_published': 'Experiment published successfully! It is now open for recruitment.',
        'need_session_to_publish': 'Please add at least one session before publishing',
        'confirm_reactivate_experiment': 'Are you sure you want to reactivate this experiment? It will be returned to draft status for editing.',
        'experiment_reactivated': 'Experiment reactivated successfully. You can now edit and resubmit it.',

        // Suggested Requirements
        'suggested_requirements': 'Suggested Requirements',
        'custom_requirements': 'Custom Requirements',
        'selected_requirements': 'Selected Requirements',
        'req_age_18_plus': 'Age 18 or older',
        'req_normal_vision': 'Normal or corrected-to-normal vision',
        'req_native_speaker': 'Native language speaker',
        'req_no_neurological': 'No neurological disorders',
        'req_no_psychiatric': 'No psychiatric conditions',
        'req_right_handed': 'Right-handed',
        'req_no_medication': 'Not taking psychoactive medication',

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
        'institution': '学院',
        'department': '系',
        'already_have_account': '已经有账户？',
        'full_name': '姓名',
        'name_required': '请输入姓名',
        'institution_required': '研究人员必须填写学院',
        'department_required': '研究人员必须填写系',
        'email_register': '邮箱',
        'wechat_register': '微信',
        'qq_register': 'QQ',
        'scan_wechat_qr': '使用微信扫描',
        'wechat_qr_desc': '打开微信扫描二维码进行注册',
        'scan_qq_qr': '使用QQ扫描',
        'qq_qr_desc': '打开QQ扫描二维码进行注册',
        'loading_qr': '加载二维码中...',
        'refresh_qr': '刷新二维码',
        'waiting_for_scan': '等待扫描...',
        'qr_scanned': '二维码已扫描！正在完成注册...',
        'qr_expired': '二维码已过期。请刷新。',

        // Researcher Dashboard
        'researcher_dashboard': '研究人员仪表板',
        'create_new_experiment': '创建新实验',
        'no_experiments': '还没有实验。创建您的第一个实验以开始！',

        // Navigation
        'nav.dashboard': '仪表板',
        'nav.experiments': '实验',
        'nav.schedule': '我的日程',
        'nav.account': '账户',
        'account.profile': '个人资料',
        'account.settings': '设置',
        'account.logout': '退出登录',
        'account.changePassword': '修改密码',
        'account.currentPassword': '当前密码',
        'account.newPassword': '新密码',
        'account.confirmPassword': '确认密码',
        'account.updatePassword': '更新密码',
        'account.statistics': '账户统计',
        'account.totalExperiments': '实验总数',
        'account.activeSessions': '活跃会话',
        'account.memberSince': '注册时间',
        'account.accountStatus': '账户状态',
        'account.active': '活跃',
        'account.profileUpdated': '资料更新成功',
        'account.passwordMismatch': '新密码不匹配',
        'account.passwordChanged': '密码修改成功',
        'account.passwordError': '密码修改失败',
        'account.profileError': '资料更新失败',

        // Dashboard Overview
        'dashboard.overview': '仪表板概览',
        'dashboard.activeExperiments': '活跃实验',
        'dashboard.totalParticipants': '总参与者',
        'dashboard.pendingApproval': '待审批',
        'dashboard.attendanceRate': '出勤率',
        'dashboard.upcomingSessions': '即将进行的会话',
        'dashboard.quickActions': '快速操作',
        'dashboard.recentActivity': '最近活动',

        // Quick Actions
        'action.createExperiment': '创建新实验',
        'action.myExperiments': '我的实验',
        'action.viewSchedule': '查看日程',
        'action.exportData': '导出数据',
        'action.view': '查看',
        'action.signup': '报名',
        'action.attendance': '出勤',
        'action.approve': '批准',
        'action.reject': '拒绝',
        'action.saveChanges': '保存更改',
        'action.editProfile': '编辑资料',

        // Experiments View
        'experiments.title': '实验管理',
        'search.placeholder': '按标题、位置或描述搜索实验...',
        'tabs.allExperiments': '所有实验',
        'tabs.drafts': '草稿',
        'tabs.pendingApproval': '待审批',
        'tabs.active': '活跃',

        // Schedule View
        'schedule.title': '我的日程',
        'schedule.upcomingSessions': '即将进行的会话',

        // Roles
        'role.researcher': '研究人员',
        'role.admin': '管理员',
        'role.participant': '参与者',

        // Status
        'status.posted': '已发布',
        'status.open': '开放',
        'status.closed': '已关闭',
        'status.pending': '待审核',

        // Common
        'common.slots': '名额',
        'common.hoursAgo': '小时前',
        'common.minutes': '分钟',
        'common.participants': '参与者',

        // Other
        'view_participants': '查看参与者',
        'export_data_placeholder': '导出功能即将推出！',
        'pending_review': '待审核',

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
        'created': '创建于',
        'researcher': '研究人员',
        'no_sessions_scheduled': '尚未安排会话。',
        'scheduled_sessions': '已安排的会话',
        'participants': '参与者',
        'spots_left': '个名额',
        'click_to_view_participants': '点击查看参与者',

        // Modal titles and labels
        'create_experiment': '创建实验',
        'edit_experiment': '编辑实验',
        'title': '标题',
        'description': '描述',
        'duration_minutes': '时长（分钟）',
        'max_participants_per_session': '每个会话的最大参与者数',
        'requirements_one_per_line': '要求（每行一个）',
        'draft': '草稿',
        'submit_for_review': '提交审核',
        'pending_review': '待审核',
        'approved': '已批准',
        'rejected': '已拒绝',
        'open_for_recruitment': '开放招募',
        'in_progress': '进行中',
        'completed': '已完成',
        'irb_approval': 'IRB批准文件',
        'upload_irb': '上传IRB文件',
        'current_irb': '当前IRB',

        // Admin Dashboard
        'admin_dashboard': '管理员仪表板',
        'all_experiments': '所有实验',
        'review_experiment': '审核实验',
        'admin_notes': '审核备注',
        'approve': '批准',
        'reject': '拒绝',
        'no_pending_experiments': '没有待审核的实验',
        'download_irb': '下载IRB',
        'review': '审核',
        'no_irb': '未上传IRB文件',
        'rejection_notes_required': '拒绝时必须填写备注',
        'experiment_approved': '实验已批准',
        'experiment_rejected': '实验已拒绝',
        'irb_required': '提交审核时必须上传IRB文件',
        'irb_upload_failed': '实验已保存，但IRB上传失败',
        'view_details': '查看详情',
        'max_participants': '最多',
        'minutes': '分钟',

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
        'registered_at': '注册时间',
        'session_time': '会话时间',
        'total_participants': '参与者总数',
        'no_participants': '暂无参与者注册',
        'error_loading_participants': '加载参与者失败',
        'status_updated': '状态更新成功',
        'error_updating_status': '更新参与者状态失败',

        // Actions
        'edit': '编辑',
        'delete': '删除',
        'sessions': '会话',
        'cancel': '取消',
        'save': '保存',
        'submit': '提交',
        'publish': '发布',
        'register': '注册',
        'registered': '已注册',
        'full': '已满',
        'withdraw': '撤回',
        'reactivate': '重新激活',
        'close_experiment': '关闭实验',
        'confirm_close_experiment': '您确定要关闭此实验吗？这将标记为已完成。',
        'experiment_closed': '实验已成功关闭',
        'confirm_withdraw_experiment': '您确定要撤回此实验的审核请求吗？它将返回到草稿状态。',
        'experiment_withdrawn': '实验已成功撤回。您现在可以编辑它。',
        'confirm_publish_experiment': '您确定要发布此实验吗？它将开放给参与者注册。',
        'experiment_published': '实验已成功发布！现在开放招募参与者。',
        'need_session_to_publish': '发布前请至少添加一个会话',
        'confirm_reactivate_experiment': '您确定要重新激活此实验吗？它将返回到草稿状态以便编辑。',
        'experiment_reactivated': '实验已成功重新激活。您现在可以编辑并重新提交。',

        // Suggested Requirements
        'suggested_requirements': '建议的要求',
        'custom_requirements': '自定义要求',
        'selected_requirements': '已选要求',
        'req_age_18_plus': '年龄18岁或以上',
        'req_normal_vision': '正常或矫正后正常的视力',
        'req_native_speaker': '母语者',
        'req_no_neurological': '无神经系统疾病',
        'req_no_psychiatric': '无精神疾病',
        'req_right_handed': '右撇子',
        'req_no_medication': '未服用精神活性药物',

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

    // Update requirement chips to show translated text
    const chips = document.querySelectorAll('#selected-requirements .requirement-chip');
    chips.forEach(chip => {
        const key = chip.getAttribute('data-req-key');
        if (key && !key.startsWith('custom_') && t[key]) {
            const textSpan = chip.querySelector('span:first-child');
            if (textSpan) {
                textSpan.textContent = t[key];
            }
        }
    });

    // Update submit button text based on current status
    const experimentModal = document.getElementById('experiment-modal');
    if (experimentModal && experimentModal.classList.contains('show')) {
        updateSubmitButtonText();
    }

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

    // Update name fields based on language
    updateNameFields();
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


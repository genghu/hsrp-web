# HSRP Researchers' Module Structure - Complete Overview

## Executive Summary
The researcher functionality is currently implemented as a single-page application (SPA) using vanilla JavaScript with Bootstrap 5 for styling. The system is built with Express.js backend and MongoDB for data persistence.

---

## 1. RESEARCHER VIEWS/PAGES LOCATION

### HTML Page
- **Location**: `/workspaces/hsrp-web/public/index.html`
- **Type**: Single-page application (SPA)
- **Researcher Dashboard Container**: `<div id="page-researcher-dashboard" class="page">` (lines 213-222)

### Current HTML Structure
```html
<!-- Researcher Dashboard -->
<div id="page-researcher-dashboard" class="page">
    <div class="glass-container">
        <div class="dashboard-header">
            <h2 data-i18n="researcher_dashboard"><i class="fas fa-tachometer-alt me-2"></i>Researcher Dashboard</h2>
            <button class="glass-button" onclick="showCreateExperiment()" data-i18n="create_new_experiment">
                <i class="fas fa-plus me-2"></i>Create New Experiment
            </button>
        </div>
        <div id="researcher-experiments-container"></div>
    </div>
</div>
```

### Key Container Elements
- `id="researcher-experiments-container"` - dynamically populated with experiment cards
- Uses Bootstrap 5 grid system and custom glass-morphism styling

---

## 2. CURRENT STRUCTURE AND ORGANIZATION

### Frontend Architecture

#### Main JavaScript Files
1. **`/workspaces/hsrp-web/public/js/app.js`** (2,742 lines)
   - Main application logic
   - Page navigation and rendering
   - User authentication handling
   - Experiment management (create, edit, delete, publish)
   - Session management
   - Internationalization (i18n) support for EN/ZH

2. **`/workspaces/hsrp-web/public/js/api.js`** (261 lines)
   - API handler class
   - HTTP request wrapper with authentication
   - Methods for login, registration, experiments, sessions

#### CSS Files
- **`/workspaces/hsrp-web/public/css/styles.css`**
  - Glass-morphism design system
  - Responsive layout
  - Custom animations and transitions
  - Status badges for experiments
  - Modal styling

### Page Navigation System
- **SPA Route**: Single `index.html` with multiple `.page` divs
- **Navigation Method**: `showPage()` function switches between pages
- **Researcher Dashboard Entry**: Called via `showDashboard()` when user role is 'researcher'

---

## 3. RESEARCHER FUNCTIONALITY FILES

### Backend Files

#### Routes
- **`/workspaces/hsrp-web/src/routes/experiments.ts`** (primary researcher endpoint)
  - GET `/api/experiments` - List researcher's experiments
  - POST `/api/experiments` - Create new experiment
  - PATCH `/api/experiments/:id` - Update experiment
  - DELETE `/api/experiments/:id` - Delete experiment
  - POST/PATCH `/api/experiments/:id/sessions` - Manage sessions
  - POST `/api/experiments/:id/irb-upload` - Upload IRB documents
  - GET `/api/experiments/:id/irb-download` - Download IRB documents

- **`/workspaces/hsrp-web/src/routes/auth.ts`**
  - User registration with role selection
  - Researcher-specific fields: institution, department

#### Models
- **`/workspaces/hsrp-web/src/models/User.ts`**
  - User schema with roles: 'researcher', 'subject', 'admin'
  - Researcher fields: institution, department

- **`/workspaces/hsrp-web/src/models/Experiment.ts`**
  - Experiment schema
  - Researcher reference field
  - Status states: draft, pending_review, approved, rejected, open, in_progress, completed, cancelled
  - IRB document storage
  - Sessions management

#### Types
- **`/workspaces/hsrp-web/src/types/index.ts`**
  - IUser interface with UserRole enum
  - IExperiment interface
  - ExperimentStatus enum
  - ParticipantStatus enum

#### Middleware
- **`/workspaces/hsrp-web/src/middleware/auth.ts`** - JWT authentication
- **`/workspaces/hsrp-web/src/middleware/validation.ts`** - Input validation
- **`/workspaces/hsrp-web/src/middleware/upload.ts`** - File upload handling for IRB documents

### Frontend JavaScript Functions

#### Core Navigation & Initialization
```javascript
showDashboard()                 // Redirect to researcher dashboard
loadResearcherExperiments()     // Fetch and display researcher's experiments
updateResearcherFields()        // Show/hide researcher fields in registration
```

#### Experiment Management
```javascript
showCreateExperiment()          // Open modal for creating new experiment
editExperiment(expId)           // Open modal for editing experiment
handleExperimentSubmit(event)   // Submit experiment (create/edit)
deleteExperiment(expId)         // Delete experiment
publishExperiment(expId)        // Publish experiment for recruitment
closeExperiment(expId)          // Mark experiment as completed
withdrawExperiment(expId)       // Withdraw from review
reactivateExperiment(expId)     // Reactivate completed experiment
```

#### Session Management
```javascript
viewSessions(expId)             // View experiment sessions
showSessionModal()              // Open session creation modal
handleSessionSubmit(event)      // Create/edit session
deleteSession(sessionId)        // Delete session
updateParticipantStatus()       // Update session participant status
```

#### UI Helpers
```javascript
renderExperimentCard(exp)       // Generate HTML for experiment card
toggleExperimentCard(expId)     // Expand/collapse experiment details
```

#### Modals
```javascript
closeExperimentModal()          // Close experiment form modal
closeSessionModal()             // Close session form modal
closeAdminReviewModal()         // Close admin review modal
```

#### File Upload
```javascript
uploadIRBDocument(experimentId, file)  // Upload IRB approval document
handleIRBFileSelect(event)              // Handle IRB file selection
removeIRBFile()                         // Remove selected IRB file
```

---

## 4. ROUTING STRUCTURE FOR RESEARCHERS

### Frontend Routes (SPA)
The system uses URL hash-based routing through page IDs:

| Route Pattern | Implementation | Purpose |
|---|---|---|
| `/` (home) | `page-home` | Landing page |
| `/login` | `page-login` | Login page |
| `/register` | `page-register` | Registration page |
| `/researcher-dashboard` | `page-researcher-dashboard` | Main researcher view |
| `/subject-dashboard` | `page-subject-dashboard` | Participant view |
| `/admin-dashboard` | `page-admin-dashboard` | Admin review view |

**Navigation Flow**:
```
showPage('home')
  → showPage('register')
    → handleRegister(role='researcher')
      → showDashboard()
        → showPage('researcher-dashboard')
          → loadResearcherExperiments()
```

### Backend API Routes

#### Authentication Endpoints
```
POST   /api/auth/register         - Register new researcher
POST   /api/auth/login            - Login researcher
GET    /api/auth/me               - Get current user
```

#### Experiment Endpoints (Researcher)
```
GET    /api/experiments                      - Get researcher's experiments
POST   /api/experiments                      - Create new experiment
GET    /api/experiments/:id                  - Get specific experiment
PATCH  /api/experiments/:id                  - Update experiment
DELETE /api/experiments/:id                  - Delete experiment
POST   /api/experiments/:id/irb-upload       - Upload IRB document
GET    /api/experiments/:id/irb-download    - Download IRB document
```

#### Session Endpoints
```
POST   /api/experiments/:id/sessions                 - Create session
PATCH  /api/experiments/:id/sessions/:sessionId      - Update session
DELETE /api/experiments/:id/sessions/:sessionId      - Delete session
PATCH  /api/experiments/:id/sessions/:sessionId/participants/:userId - Update participant status
```

#### Query Filters
```
GET /api/experiments?status=pending_review  - Filter by status
GET /api/experiments?search=keyword         - Search experiments
```

---

## 5. MODAL STRUCTURES

### Experiment Modal (`#experiment-modal`)
- **ID**: `experiment-modal`
- **Form ID**: `experiment-form`
- **Fields**:
  - Title
  - Description
  - Location
  - Duration (minutes)
  - Compensation
  - Max Participants per Session
  - Requirements (suggested & custom)
  - IRB Approval Document (file upload)
  - Status dropdown
- **Buttons**: Cancel, Save
- **States**: Create mode or Edit mode

### Session Modal (`#session-modal`)
- **ID**: `session-modal`
- **Form ID**: `session-form`
- **Fields**:
  - Start Time (datetime-local)
  - End Time (datetime-local)
  - Location
  - Max Participants
  - Notes (optional)
- **Buttons**: Cancel, Save

### Admin Review Modal (`#admin-review-modal`)
- **Used by**: Admin users reviewing pending experiments
- **Fields**:
  - Review Notes
- **Buttons**: Cancel, Reject, Approve

---

## 6. DATA MODEL STRUCTURE

### Researcher User
```typescript
{
  email: string,
  firstName: string,
  lastName: string,
  role: "researcher",
  institution: string,           // Researcher-specific
  department: string,            // Researcher-specific
  createdAt: Date,
  updatedAt: Date
}
```

### Experiment
```typescript
{
  title: string,
  description: string,
  researcher: ObjectId,          // Reference to User
  status: ExperimentStatus,      // draft, pending_review, approved, rejected, open, in_progress, completed, cancelled
  location: string,
  duration: number,              // minutes
  compensation: string,
  requirements: string[],
  maxParticipants: number,
  sessions: ISession[],
  irbDocument: {
    filename: string,
    originalName: string,
    mimetype: string,
    size: number,
    uploadDate: Date
  },
  adminReview: {
    reviewedBy: ObjectId,
    reviewDate: Date,
    notes: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Session
```typescript
{
  experiment: ObjectId,
  startTime: Date,
  endTime: Date,
  participants: [{
    user: ObjectId,
    status: ParticipantStatus,  // registered, confirmed, attended, no_show, cancelled
    signupTime: Date
  }],
  maxParticipants: number,
  location: string,
  notes?: string
}
```

---

## 7. EXPERIMENT LIFECYCLE & STATUS FLOW

### Status Transitions (Researcher View)
```
DRAFT
  ↓ (Submit for Review)
PENDING_REVIEW
  ↓ (Admin approves)
APPROVED
  ↓ (Publish for Recruitment)
OPEN
  ↓ (Sessions starting)
IN_PROGRESS
  ↓ (All sessions complete)
COMPLETED

Alternative paths:
PENDING_REVIEW → DRAFT (Withdraw)
REJECTED → DRAFT (Edit and resubmit)
COMPLETED → DRAFT (Reactivate)
```

### Available Actions by Status
| Status | Edit | Publish | Sessions | Withdraw | Close | Delete | Reactivate |
|--------|------|---------|----------|----------|-------|--------|-----------|
| draft | ✓ | - | - | - | - | ✓ | - |
| pending_review | - | - | - | ✓ | - | - | - |
| approved | - | ✓ | ✓ | - | - | ✓ | - |
| rejected | ✓ | - | - | - | - | ✓ | - |
| open | - | - | ✓ | - | ✓ | - | - |
| in_progress | - | - | ✓ | - | ✓ | - | - |
| completed | - | - | ✓ | - | - | ✓ | ✓ |

---

## 8. KEY FEATURES

### Experiment Management
- Create experiments with rich metadata
- Auto-draft saving
- Edit only in draft/rejected states
- Multi-language support (English/Chinese)
- IRB document upload/download

### Session Management
- Create multiple sessions per experiment
- Set max participants per session
- Track participant registration status
- Manage participant attendance (attended, no-show, cancelled)

### Internationalization
- UI translations in English and Chinese
- Dynamic form field changes based on language
- Special handling for Chinese names (combined/split name fields)

### Requirements System
- Pre-defined requirements (age, vision, neurological, etc.)
- Custom requirements support
- Requirements displayed as searchable chips

### Security
- JWT-based authentication
- Role-based access control
- IRB document upload validation
- Password hashing with bcryptjs

---

## 9. FILE STRUCTURE SUMMARY

```
/workspaces/hsrp-web/
├── public/
│   ├── index.html                    # Main SPA template
│   ├── js/
│   │   ├── app.js                    # Frontend logic (2,742 lines)
│   │   └── api.js                    # API wrapper (261 lines)
│   └── css/
│       └── styles.css                # Glass-morphism styles
│
├── src/
│   ├── routes/
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── experiments.ts            # Experiment/session endpoints
│   │   └── users.ts                  # User endpoints
│   ├── models/
│   │   ├── User.ts                   # User schema
│   │   └── Experiment.ts             # Experiment schema
│   ├── middleware/
│   │   ├── auth.ts                   # JWT middleware
│   │   ├── validation.ts             # Input validation
│   │   └── upload.ts                 # File upload
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   ├── utils/
│   │   ├── cache.ts                  # Redis/cache
│   │   └── initDatabase.ts           # DB initialization
│   └── index.ts                      # Express server setup
│
└── dist/                             # Compiled JavaScript
```

---

## 10. KEY TECHNICAL DETAILS

### Technology Stack
- **Frontend**: Vanilla JavaScript (no framework), HTML5, CSS3
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet (CSP), bcryptjs (password hashing)
- **Performance**: Compression, Redis caching
- **Styling**: Bootstrap 5, Custom CSS (glass-morphism)
- **Build**: TypeScript compiler, Webpack

### API Authentication
- Token stored in `localStorage`
- Sent via `Authorization: Bearer <token>` header or `x-auth-token` header
- 7-day expiration

### Current State Management
- Global variables: `currentUser`, `currentExperiment`, `currentMode`, `currentSession`
- No state management library (vanilla JS approach)
- Direct DOM manipulation for UI updates

### Performance Optimizations
- `.lean()` queries for read-heavy operations
- Redis caching for QR codes and session data
- Gzip compression middleware
- Lazy loading of experiments

---

## 11. INTERNATIONALIZATION (i18n) STRUCTURE

**Supported Languages**: English (en), Chinese (zh)

**Translation System**:
- Stored in `app.js` as `translations` object
- Applied via `applyTranslations(language)` function
- DOM elements use `data-i18n="key"` attributes
- Dynamic content uses key lookup: `translations[currentLanguage][key]`

**Language Switching**:
- Dropdown in top navigation
- Stored in `localStorage`
- Triggers re-rendering of active page

---

## 12. FORM VALIDATION

### Registration Form
- Email format validation
- Password minimum 6 characters
- Required: email, password, firstName, lastName, role
- Conditional: institution & department (required for researchers)
- Name handling differs by language (combined for Chinese, split for English)

### Experiment Form
- Title: required, string
- Description: required, string
- Location: required, string
- Duration: required, positive integer
- Compensation: required, string
- Max Participants: required, positive integer
- Status: required dropdown
- IRB Document: required for "pending_review" status

### Session Form
- Start Time: required, datetime
- End Time: required, datetime
- Location: required, string
- Max Participants: required, positive integer
- Notes: optional

---

## RECOMMENDATIONS FOR RESTRUCTURING

### For New HTML Template Integration:
1. **Template Layout**: Keep the main `index.html` structure but update CSS classes to match new template
2. **Modal Integration**: Port the modals into new template containers
3. **Container IDs**: Maintain ID references for JavaScript compatibility
4. **Component Mapping**:
   - `#page-researcher-dashboard` → research page container
   - `#researcher-experiments-container` → experiment list area
   - `#experiment-modal` → experiment form modal
   - `#session-modal` → session form modal
5. **CSS Migration**: Adapt glass-morphism or replace with new template's styling
6. **JavaScript Hooks**: Keep all function names and DOM IDs unchanged for minimal refactoring

---

## END OF OVERVIEW

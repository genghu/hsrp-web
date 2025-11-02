# Researcher Module Documentation Index

## Quick Navigation

This folder contains comprehensive documentation about the researcher module in the HSRP codebase. Choose the document that best matches your needs:

### For Project Overview
**Start here:** `README_RESEARCHERS.md`
- Quick facts and architecture overview
- Key components and features
- API endpoints summary
- Testing checklist
- Best for: Getting oriented quickly, understanding capabilities

### For Technical Deep Dive
**Read this:** `RESEARCHER_STRUCTURE.md`
- Complete technical architecture
- All file locations and purposes
- Data model specifications
- Routing structure (frontend and backend)
- Detailed function reference
- Best for: Developers adding features or debugging

### For Visual Understanding
**Review this:** `RESEARCHER_FLOW_DIAGRAM.txt`
- Navigation flows and diagrams
- Experiment lifecycle diagram
- API endpoint hierarchy
- Data model relationships
- Function call flows
- Best for: Visual learners, understanding system interactions

### For UI/Template Changes
**Follow this:** `RESEARCHER_RESTRUCTURING_GUIDE.md`
- Step-by-step restructuring process
- Required HTML IDs to preserve
- CSS classes to maintain
- Phase-by-phase checklist
- Common issues and solutions
- Best for: Updating UI, migrating to new template

---

## Documentation Summary

| Document | Size | Focus | Audience |
|----------|------|-------|----------|
| README_RESEARCHERS.md | 9.6 KB | Overview & Quick Reference | Everyone |
| RESEARCHER_STRUCTURE.md | 16 KB | Technical Details | Developers |
| RESEARCHER_FLOW_DIAGRAM.txt | 14 KB | Visual Architecture | Visual Learners |
| RESEARCHER_RESTRUCTURING_GUIDE.md | 9.7 KB | Template Migration | UI Developers |

---

## Key File Locations

### Frontend (User Interface)
- Main page: `/workspaces/hsrp-web/public/index.html`
- Application logic: `/workspaces/hsrp-web/public/js/app.js` (2,742 lines)
- API wrapper: `/workspaces/hsrp-web/public/js/api.js` (261 lines)
- Styling: `/workspaces/hsrp-web/public/css/styles.css`

### Backend (Server)
- Experiment routes: `/workspaces/hsrp-web/src/routes/experiments.ts`
- Authentication: `/workspaces/hsrp-web/src/routes/auth.ts`
- Experiment model: `/workspaces/hsrp-web/src/models/Experiment.ts`
- User model: `/workspaces/hsrp-web/src/models/User.ts`

---

## Quick Facts

```
Architecture Type:     Single Page Application (SPA)
Frontend Framework:    Vanilla JavaScript (no framework)
Backend Framework:     Express.js + Node.js
Database:              MongoDB with Mongoose ODM
Authentication:        JWT (JSON Web Tokens)
Languages Supported:   English, Chinese (Mandarin)
Primary Styling:       Bootstrap 5 + Glass-morphism CSS
Build Tool:            TypeScript Compiler
Current Version:       1.0
Last Updated:          November 2, 2025
```

---

## Core Features

### Researcher Can:
- Create and manage experiments
- Define participant requirements
- Create multiple sessions per experiment
- Upload IRB approval documents
- Submit experiments for admin review
- Publish experiments for recruitment
- Track participant registrations
- Manage attendance and cancellations
- Switch between English and Chinese

### System Automatically:
- Validates form inputs
- Routes based on user role
- Filters experiments by researcher
- Manages experiment lifecycle states
- Compresses API responses
- Caches session data
- Enforces JWT authentication

---

## Researcher Workflow

```
1. Register as Researcher
   ├─ Enter email & password
   ├─ Enter institution & department
   └─ Create account

2. Login to Dashboard
   └─ View researcher dashboard

3. Create Experiment
   ├─ Fill experiment form
   ├─ Add requirements
   ├─ Upload IRB document
   └─ Save as draft

4. Add Sessions
   ├─ Create session(s)
   ├─ Set date/time/location
   └─ Save session

5. Submit for Review
   ├─ Status: draft → pending_review
   └─ Wait for admin approval

6. Admin Reviews
   ├─ Status: pending_review → approved or rejected
   └─ If rejected, return to step 3

7. Publish Experiment
   ├─ Status: approved → open
   └─ Accept participant registrations

8. Manage Sessions
   ├─ Track registrations
   ├─ Mark attendance
   └─ Handle cancellations

9. Complete Experiment
   ├─ Status: open/in_progress → completed
   └─ Can reactivate or delete
```

---

## API Endpoints Quick Reference

### Create/Update Experiment
```
POST   /api/experiments              Create new experiment
PATCH  /api/experiments/:id          Update experiment
```

### View Experiments
```
GET    /api/experiments              List researcher's experiments
GET    /api/experiments/:id          Get experiment details
```

### Delete Experiment
```
DELETE /api/experiments/:id          Delete experiment
```

### Manage Sessions
```
POST   /api/experiments/:id/sessions/:sid           Create session
PATCH  /api/experiments/:id/sessions/:sid          Update session
DELETE /api/experiments/:id/sessions/:sid          Delete session
```

### Handle Participants
```
PATCH  /api/experiments/:id/sessions/:sid/participants/:uid
       Update participant status
```

### Document Management
```
POST   /api/experiments/:id/irb-upload              Upload IRB document
GET    /api/experiments/:id/irb-download            Download IRB document
```

### Authentication
```
POST   /api/auth/register           Register new account
POST   /api/auth/login              Login and get token
GET    /api/auth/me                 Get current user info
```

---

## Important HTML Element IDs

These IDs are hardcoded in JavaScript and MUST be preserved:

```html
<!-- Main Dashboard -->
id="page-researcher-dashboard"
id="researcher-experiments-container"

<!-- Modals -->
id="experiment-modal"
id="session-modal"
id="admin-review-modal"

<!-- Form Fields (Experiment) -->
id="exp-title"
id="exp-description"
id="exp-location"
id="exp-duration"
id="exp-compensation"
id="exp-maxParticipants"
id="exp-irb-document"
id="exp-status"

<!-- Form Fields (Session) -->
id="session-startTime"
id="session-endTime"
id="session-location"
id="session-maxParticipants"
id="session-notes"
```

---

## Critical JavaScript Functions

These functions must exist and not change their signatures:

```javascript
// Navigation
showPage(pageName)
showDashboard()

// Experiment Management
showCreateExperiment()
editExperiment(expId)
deleteExperiment(expId)
publishExperiment(expId)
closeExperiment(expId)
withdrawExperiment(expId)
reactivateExperiment(expId)
handleExperimentSubmit(event)

// Session Management
viewSessions(expId)
handleSessionSubmit(event)
deleteSession(sessionId)

// Modal Control
closeExperimentModal()
closeSessionModal()

// File Upload
uploadIRBDocument(experimentId, file)
handleIRBFileSelect(event)
removeIRBFile()
```

---

## Experiment Status States

```
DRAFT              Can edit, add sessions, delete
PENDING_REVIEW     Admin reviewing, can withdraw
APPROVED           Ready to publish
REJECTED           Can edit and resubmit
OPEN               Accepting registrations
IN_PROGRESS        Sessions running
COMPLETED          All done, can reactivate
CANCELLED          (Available state)
```

---

## Data Models

### User (Researcher)
```
id, email, firstName, lastName, role, institution, department
createdAt, updatedAt, password (hashed)
```

### Experiment
```
id, title, description, researcher (ref), status, location, duration,
compensation, requirements[], maxParticipants, sessions[], irbDocument,
adminReview, createdAt, updatedAt
```

### Session
```
id, experiment (ref), startTime, endTime, location, maxParticipants,
notes, participants[]
```

### Participant (in Session)
```
user (ref), status, signupTime
```

---

## Common Tasks

### I want to...

**Add a new feature to researcher dashboard**
1. Read: RESEARCHER_STRUCTURE.md (Architecture section)
2. Check: RESEARCHER_FLOW_DIAGRAM.txt (for data flow)
3. Edit: /public/js/app.js and/or /src/routes/experiments.ts

**Update the UI/template**
1. Read: RESEARCHER_RESTRUCTURING_GUIDE.md
2. Follow: Phase-by-phase process
3. Test: Using testing checklist

**Understand how experiments work**
1. Read: RESEARCHER_STRUCTURE.md (Lifecycle section)
2. View: RESEARCHER_FLOW_DIAGRAM.txt (Status flow diagram)

**Debug a bug**
1. Read: RESEARCHER_STRUCTURE.md (for file locations)
2. Check: RESEARCHER_FLOW_DIAGRAM.txt (for call flow)
3. Look: Browser console and Network tab

**Migrate to new template**
1. Follow: RESEARCHER_RESTRUCTURING_GUIDE.md
2. Reference: RESEARCHER_STRUCTURE.md (component details)
3. Test: Using provided checklist

**Learn the API**
1. Read: RESEARCHER_STRUCTURE.md (API section)
2. Check: src/routes/experiments.ts (implementation)
3. Test: Using Postman or curl

---

## Testing the System

### Basic Test Flow
1. Register as researcher (institution: Test Uni, department: Test Dept)
2. Create experiment in draft (with title, description, location, etc.)
3. Add session with future date/time
4. Edit experiment
5. Submit for review (status → pending_review)
6. Check admin sees it in pending list
7. Admin approves (status → approved)
8. Publish experiment (status → open)
9. Verify participants can see it
10. Mark attendance in session

### Checklist
- [ ] Registration with researcher fields
- [ ] Experiment CRUD operations
- [ ] Session management
- [ ] Status transitions
- [ ] IRB document upload
- [ ] Language switching
- [ ] Error handling
- [ ] Form validation

---

## Performance Characteristics

### Optimizations in Place
- Redis caching for QR codes
- MongoDB lean() queries
- Gzip compression
- Lazy loading experiments
- Direct DOM manipulation

### Current Response Times
- List experiments: < 100ms (cached)
- Create experiment: < 200ms
- Submit for review: < 300ms (with validation)

### Database Queries
- Indexed fields: email, researcher, status
- Aggregations: Session count, participant count
- Lean queries: Read-heavy operations

---

## Security Implemented

- JWT authentication (7-day tokens)
- Password hashing (bcryptjs)
- Role-based access control
- Content Security Policy headers
- Input validation
- File upload validation
- CSRF protection via CORS

---

## Known Limitations

1. SPA loads entire app (can be large)
2. No offline support
3. No real-time collaboration
4. Session data cached (eventual consistency)
5. File uploads to disk (not cloud)

---

## Next Steps for Learning

### Beginner
1. Read: README_RESEARCHERS.md
2. Explore: /workspaces/hsrp-web/public/index.html
3. Follow: RESEARCHER_FLOW_DIAGRAM.txt

### Intermediate
1. Read: RESEARCHER_STRUCTURE.md
2. Study: /workspaces/hsrp-web/public/js/app.js (sections)
3. Review: /workspaces/hsrp-web/src/routes/experiments.ts

### Advanced
1. Study: Full RESEARCHER_STRUCTURE.md
2. Deep dive: app.js + experiments.ts
3. Trace: API calls in browser dev tools
4. Modify: Try adding a simple feature

---

## Questions?

1. Check the relevant documentation file above
2. Review git commit history for context: `git log --oneline`
3. Search code: `grep -r "function_name" src/`
4. Check tests: `src/__tests__/routes/experiments.test.ts`

---

**Last Updated**: November 2, 2025
**Document Version**: 1.0
**Status**: Complete and Ready for Use

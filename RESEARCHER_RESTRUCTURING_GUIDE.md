# Researcher Module - Restructuring Guide for New HTML Template

## Quick Start: Mapping Components to New Template

### 1. Required HTML Container IDs (DO NOT CHANGE)

These IDs are hardcoded in JavaScript and MUST be maintained or you'll break functionality:

```html
<!-- Main Dashboard -->
<div id="page-researcher-dashboard" class="page">
    <div id="researcher-experiments-container"></div>
</div>

<!-- Experiment Form Modal -->
<div id="experiment-modal" class="modal">
    <form id="experiment-form">
        <input id="exp-title" type="text">
        <textarea id="exp-description"></textarea>
        <input id="exp-location" type="text">
        <input id="exp-duration" type="number">
        <input id="exp-compensation" type="text">
        <input id="exp-maxParticipants" type="number">
        <div id="suggested-requirements"></div>
        <input id="exp-custom-requirement" type="text">
        <div id="selected-requirements"></div>
        <input id="exp-irb-document" type="file">
        <div id="irb-file-info"></div>
        <div id="irb-current-file"></div>
        <select id="exp-status"></select>
        <div id="experiment-error"></div>
    </form>
</div>

<!-- Session Form Modal -->
<div id="session-modal" class="modal">
    <form id="session-form">
        <input id="session-startTime" type="datetime-local">
        <input id="session-endTime" type="datetime-local">
        <input id="session-location" type="text">
        <input id="session-maxParticipants" type="number">
        <textarea id="session-notes"></textarea>
        <div id="session-error"></div>
    </form>
</div>
```

### 2. Required JavaScript Elements

These functions are called by the HTML and must exist:

```javascript
// Navigation
function showPage(pageName)
function showDashboard()
function showCreateExperiment()
function showPage(name)

// Experiment Actions
function editExperiment(expId)
function deleteExperiment(expId)
function publishExperiment(expId)
function closeExperiment(expId)
function withdrawExperiment(expId)
function reactivateExperiment(expId)
function viewSessions(expId)
function handleExperimentSubmit(event)

// Session Actions
function showSessionModal()
function viewSessions(expId)
function deleteSession(sessionId)
function handleSessionSubmit(event)

// Modal Management
function closeExperimentModal()
function closeSessionModal()

// Utilities
function toggleExperimentCard(expId)
function renderExperimentCard(exp)
function uploadIRBDocument(experimentId, file)
function handleIRBFileSelect(event)
function removeIRBFile()
function updateResearcherFields()
```

### 3. Required CSS Classes

Keep these CSS classes or update all references:

```css
/* Page container */
.page
.page.active

/* Modals */
.modal
.modal.show
.modal-content

/* Buttons */
.glass-button
.glass-button:hover

/* Cards & Containers */
.glass-container
.experiment-card
.experiment-header
.experiment-content
.status-badge
.status-{status} /* dynamic status classes */

/* Forms */
.form-group
.form-row
.form-control
.glass-input

/* UI Elements */
.error-message
.error-message.show
.notification
.notification.show
```

### 4. Data Attributes (Important)

Keep these data attributes for i18n and functionality:

```html
<!-- Internationalization -->
<h2 data-i18n="researcher_dashboard">Researcher Dashboard</h2>
<button data-i18n="create_new_experiment">Create New Experiment</button>

<!-- Dynamic status badges -->
<span class="status-badge status-draft">Draft</span>
<span class="status-badge status-pending_review">Pending Review</span>
<span class="status-badge status-approved">Approved</span>
<span class="status-badge status-open">Open</span>
<span class="status-badge status-in_progress">In Progress</span>
<span class="status-badge status-completed">Completed</span>

<!-- Experiment identification -->
<div class="experiment-card" data-exp-id="{experimentId}">
```

---

## Step-by-Step Restructuring Process

### Phase 1: Template Layout

1. Replace current `index.html` with new template structure
2. Preserve the following `<div>` containers in new template:
   - `id="page-researcher-dashboard"` - Main researcher view
   - `id="researcher-experiments-container"` - Experiments list
   - `id="experiment-modal"` - Create/edit experiment modal
   - `id="session-modal"` - Session management modal

3. Update CSS classes to match new template:
   - Rename `.glass-container` references if needed
   - Update button classes
   - Adjust spacing and layout

### Phase 2: Modal Integration

1. Copy modal HTML from current `index.html` (lines 253-408)
2. Insert modals into new template structure
3. Keep all form field IDs exactly as they are
4. Update CSS for modal styling to match new design

### Phase 3: Form Fields

Ensure these form fields exist and have exact IDs:

**Experiment Form Fields:**
```
#exp-title
#exp-description
#exp-location
#exp-duration
#exp-compensation
#exp-maxParticipants
#exp-custom-requirement
#exp-irb-document
#exp-status
```

**Session Form Fields:**
```
#session-startTime
#session-endTime
#session-location
#session-maxParticipants
#session-notes
```

### Phase 4: JavaScript Integration

1. No changes needed to `/workspaces/hsrp-web/public/js/app.js`
2. No changes needed to `/workspaces/hsrp-web/public/js/api.js`
3. Update references in HTML if CSS class names changed:
   ```javascript
   // Search for all class references in app.js
   // Example: .glass-button → .btn or .new-button
   ```

### Phase 5: CSS Updates

Two options:

**Option A: Keep existing CSS**
- Import current `styles.css` into new template
- May have conflicting styles - resolve manually

**Option B: Migrate to new template's CSS**
- Copy critical styles from `styles.css` to new CSS
- Update `.glass-container` styles
- Update modal styles
- Update button styles
- Update status badge colors

### Phase 6: Testing & Validation

After restructuring:

1. Test experiment creation flow
2. Test experiment editing
3. Test session management
4. Test modal open/close
5. Test form validation
6. Test IRB file upload
7. Test language switching (if applicable)
8. Test experiment status transitions

---

## Common Issues & Solutions

### Issue: Form fields not populating when editing
**Solution:** Verify all form field IDs match exactly in HTML and JS

### Issue: Modals not opening
**Solution:** Ensure modal `id` attributes are correct and CSS `.modal.show` class is applied

### Issue: Buttons not responding to clicks
**Solution:** Verify `onclick` attributes are set correctly in HTML

### Issue: Experiments not loading
**Solution:** Check `#researcher-experiments-container` exists in DOM

### Issue: Language switching broken
**Solution:** Verify all `data-i18n` attributes are present on dynamic elements

### Issue: File upload not working
**Solution:** Check `#exp-irb-document` input type is `file` and upload endpoint is correct

---

## CSS Class Reference

### Status Badge Colors (Update if needed)
```css
.status-draft { background: #6366f1; }
.status-pending_review { background: #f59e0b; }
.status-approved { background: #10b981; }
.status-rejected { background: #ef4444; }
.status-open { background: #3b82f6; }
.status-in_progress { background: #8b5cf6; }
.status-completed { background: #6b7280; }
```

### Button Action Colors (Used in renderExperimentCard)
```javascript
// Edit button: default glass-button style
// Delete button: default glass-button style
// Publish button: #48bb78, #2f855a (green gradient)
// Close button: #f87171, #dc2626 (red gradient)
// Withdraw button: #fbbf24, #f59e0b (yellow gradient)
// Reactivate button: #667eea, #764ba2 (purple gradient)
```

---

## Frontend Files to Keep Unchanged

The following files should NOT be modified during restructuring:

1. `/workspaces/hsrp-web/public/js/app.js` - Main logic
2. `/workspaces/hsrp-web/public/js/api.js` - API wrapper
3. `/workspaces/hsrp-web/src/**/*` - All backend files

**Only file to modify:**
- `/workspaces/hsrp-web/public/index.html` - HTML structure & layout
- `/workspaces/hsrp-web/public/css/styles.css` - CSS (optional, if updating design)

---

## Minimal Change Option

If you want minimal changes:

1. Keep current `index.html` structure
2. Only change CSS classes and styling
3. Update colors and fonts to match new template
4. No JavaScript changes needed

This approach requires least testing and risk.

---

## API Integration (No Changes Needed)

All backend API endpoints remain unchanged:

```
POST   /api/experiments               Create experiment
PATCH  /api/experiments/:id           Update experiment
DELETE /api/experiments/:id           Delete experiment
GET    /api/experiments/:id           Get experiment details
POST   /api/experiments/:id/irb-upload        Upload IRB
GET    /api/experiments/:id/irb-download     Download IRB
```

The frontend will automatically use these endpoints - no backend changes required.

---

## Performance Considerations

Current optimizations in place:
- Lazy loading of experiments
- Redis caching for QR codes
- Gzip compression
- Lean MongoDB queries

These are backend optimizations and will continue working after restructuring.

---

## Rollback Plan

If restructuring goes wrong:

1. Keep backup of original `index.html`:
   ```bash
   cp public/index.html public/index.html.backup
   ```

2. Restore if needed:
   ```bash
   cp public/index.html.backup public/index.html
   ```

3. Both documentation files preserve original structure:
   - `/workspaces/hsrp-web/RESEARCHER_STRUCTURE.md`
   - `/workspaces/hsrp-web/RESEARCHER_FLOW_DIAGRAM.txt`

---

## Next Steps

1. Review `RESEARCHER_STRUCTURE.md` for detailed component info
2. Review `RESEARCHER_FLOW_DIAGRAM.txt` for visual reference
3. Prepare new HTML template
4. Map new template components to required container IDs
5. Test thoroughly with test researcher account
6. Deploy to staging environment first

---


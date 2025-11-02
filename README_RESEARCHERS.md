# HSRP Researcher Module - Complete Documentation

## Overview

This document provides a comprehensive guide to the researcher functionality in the HSRP (Human Subject Recruitment Platform) codebase. The system allows researchers to create, manage, and publish experiments, manage sessions, and track participant registrations.

## Documentation Files Included

Three detailed documentation files have been created:

1. **RESEARCHER_STRUCTURE.md** - Complete technical overview of the current implementation
   - File locations
   - API endpoints
   - Data models
   - Frontend functions
   - Current architecture

2. **RESEARCHER_FLOW_DIAGRAM.txt** - Visual diagrams and flows
   - Frontend navigation flows
   - Experiment lifecycle diagram
   - API endpoint structure
   - Data relationships
   - Function call hierarchies

3. **RESEARCHER_RESTRUCTURING_GUIDE.md** - Step-by-step guide for template changes
   - Required HTML IDs to preserve
   - CSS classes to maintain
   - Phase-by-phase restructuring process
   - Common issues and solutions
   - Testing checklist

## Quick Facts

- **Architecture**: Single Page Application (SPA)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3, Bootstrap 5
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: MongoDB
- **Authentication**: JWT-based
- **Languages Supported**: English, Chinese (Mandarin)
- **Current Frontend Code**: 2,742 lines (app.js) + 261 lines (api.js)
- **Styling**: Glass-morphism design system

## Key Components

### Frontend Files
- `/workspaces/hsrp-web/public/index.html` - Single SPA page
- `/workspaces/hsrp-web/public/js/app.js` - Main application logic
- `/workspaces/hsrp-web/public/js/api.js` - API wrapper
- `/workspaces/hsrp-web/public/css/styles.css` - Styling

### Backend Files
- `/workspaces/hsrp-web/src/routes/experiments.ts` - Experiment endpoints
- `/workspaces/hsrp-web/src/routes/auth.ts` - Authentication
- `/workspaces/hsrp-web/src/models/Experiment.ts` - Data model
- `/workspaces/hsrp-web/src/models/User.ts` - User model

## Researcher Dashboard Features

### Experiment Management
- Create new experiments
- Edit draft/rejected experiments
- View experiment details
- Publish experiments for recruitment
- Close/complete experiments
- Reactivate completed experiments
- Withdraw from review
- Delete experiments (specific statuses only)

### Session Management
- Create multiple sessions per experiment
- Set session parameters (date/time, location, capacity)
- Manage participant registration
- Track attendance
- Handle cancellations

### Requirements System
- Pre-defined participant requirements (age, vision, language, etc.)
- Custom requirement support
- Requirement management interface

### IRB Integration
- Upload IRB approval documents
- Download documents
- Document management

### Internationalization
- Full English/Chinese support
- Dynamic language switching
- Localized form fields (e.g., combined vs. split name fields)

## Main Researcher Views

### Registration (Pre-Login)
- Email/password registration
- Institution/department fields (researcher-specific)
- Role selection dropdown

### Dashboard (Post-Login)
- List of researcher's experiments
- Quick action buttons
- Status indicators
- Create new experiment button

### Experiment List
- Expandable experiment cards
- Status badges
- Action buttons based on status
- Timestamps

### Modals
- Experiment creation/editing modal
- Session management modal
- Form validation
- Error handling

## API Endpoints

### Authentication
```
POST   /api/auth/register      Register researcher
POST   /api/auth/login         Login
GET    /api/auth/me            Current user info
```

### Experiments
```
GET    /api/experiments               Get all researcher experiments
POST   /api/experiments               Create experiment
GET    /api/experiments/:id           Get single experiment
PATCH  /api/experiments/:id           Update experiment
DELETE /api/experiments/:id           Delete experiment
```

### Sessions
```
POST   /api/experiments/:id/sessions              Create session
PATCH  /api/experiments/:id/sessions/:sid        Update session
DELETE /api/experiments/:id/sessions/:sid        Delete session
```

### Participants
```
PATCH  /api/experiments/:id/sessions/:sid/participants/:uid
       Update participant status
```

### IRB Documents
```
POST   /api/experiments/:id/irb-upload           Upload IRB
GET    /api/experiments/:id/irb-download         Download IRB
```

## Experiment Lifecycle

1. **DRAFT** - Initial state, researcher can edit and add sessions
2. **PENDING_REVIEW** - Submitted for admin review
3. **APPROVED** - Admin approved, ready to publish
4. **REJECTED** - Admin rejected, researcher can edit and resubmit
5. **OPEN** - Published, accepting registrations
6. **IN_PROGRESS** - Sessions have started
7. **COMPLETED** - All sessions finished
8. (CANCELLED - Available for cancellation scenarios)

## For Developers

### If You're Updating the UI
1. Read **RESEARCHER_RESTRUCTURING_GUIDE.md**
2. Keep these HTML IDs: `page-researcher-dashboard`, `researcher-experiments-container`, `experiment-modal`, `session-modal`
3. Keep JavaScript function names unchanged
4. Test all experiment status transitions

### If You're Adding Features
1. Review **RESEARCHER_STRUCTURE.md** section 12 for existing patterns
2. Keep API endpoints consistent with current design
3. Update translations in `app.js` translations object for new strings
4. Add error handling and validation

### If You're Debugging
1. Check **RESEARCHER_FLOW_DIAGRAM.txt** for call flow
2. Verify form field IDs in HTML match JavaScript selectors
3. Check browser console for JavaScript errors
4. Verify authentication token in localStorage
5. Check MongoDB for data consistency

## Testing Checklist

- [ ] Register as researcher
- [ ] Create experiment in draft
- [ ] Edit experiment
- [ ] Add session to experiment
- [ ] Submit experiment for review
- [ ] Verify admin can see in pending list
- [ ] Test publish flow
- [ ] Test participant registration
- [ ] Test session management
- [ ] Test IRB document upload
- [ ] Test language switching
- [ ] Test error handling
- [ ] Test form validation

## Current State Management

The application uses vanilla JavaScript with global variables:
- `currentUser` - Logged-in user object
- `currentExperiment` - Currently editing experiment
- `currentMode` - 'create' or 'edit'
- `currentSession` - Session being edited

No state management library is used. All state is stored in the DOM or these global variables.

## Performance Notes

Current optimizations:
- Lazy loading of experiments
- Redis caching for QR codes and sessions
- Gzip compression on responses
- MongoDB lean() queries for read-only operations
- Direct DOM manipulation (no virtual DOM)

## Security Features

- JWT authentication (7-day expiration)
- Password hashing with bcryptjs
- Role-based access control
- Content Security Policy headers
- Input validation on all forms
- File upload validation for IRB documents

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (responsive design)

## File Upload

- IRB documents: PDF, DOC, DOCX, JPG, JPEG, PNG
- Max file size: Configured in multer middleware
- Storage: File system or cloud storage (depends on deployment)

## Internationalization Keys

Supported keys for researcher module:
- `researcher_dashboard` - Page title
- `create_new_experiment` - Button text
- `researcher` - Role selection
- `institution_required` - Form validation
- `department_required` - Form validation
- Multiple experiment status and action keys

See `app.js` lines 2212-2462 for complete translation object.

## Known Limitations

1. No offline support
2. No real-time collaboration
3. Single experiment per researcher at a time (modal-based)
4. No export functionality
5. No advanced search/filter
6. No API rate limiting

## Future Enhancement Opportunities

1. Experiment templates
2. Bulk participant import
3. Automated confirmation emails
4. Advanced scheduling
5. Analytics dashboard
6. Real-time notifications
7. Participant prescreening
8. Payment integration

## Support & Troubleshooting

For issues, check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. MongoDB for data consistency
4. JWT token expiration (localStorage)
5. Form validation requirements

## Architecture Decisions

1. **SPA Approach** - Chosen for responsive UX and reduced server load
2. **Vanilla JavaScript** - No framework overhead, direct DOM control
3. **Bootstrap 5** - For responsive grid and components
4. **Glass-morphism** - For modern UI aesthetics
5. **MongoDB/Mongoose** - Flexible schema for experiment data
6. **JWT Auth** - Stateless authentication for scalability
7. **Multer** - Lightweight file upload handling

## Migration Path

To migrate to a new template:

1. Use `RESEARCHER_RESTRUCTURING_GUIDE.md` as reference
2. Create new HTML template maintaining required IDs
3. Update CSS to new design
4. Keep all JavaScript files unchanged
5. Test thoroughly with test account
6. Deploy to staging first

## Version History

- **Current**: Glass-morphism SPA with vanilla JS
- **Previous**: (Not documented, but preserved in git history)

## Related Documentation

See also:
- Main README.md for project overview
- TESTING_PLAN.md for testing strategies
- OPTIMIZATION_ROADMAP.md for performance improvements

## Contact & Questions

For questions about the researcher module:
1. Review the three documentation files included
2. Check the git commit history for recent changes
3. Review test files in `/src/__tests__` for usage examples

---

**Last Updated**: November 2, 2025
**Documentation Version**: 1.0
**Applicable to Codebase**: Current main branch

# HSRP Web Application Testing Plan

## Overview
This document outlines the comprehensive testing strategy for the Human Subject Recruitment Platform (HSRP) web application.

## Testing Framework
- **Unit Tests**: Jest with ts-jest
- **Integration Tests**: Supertest for API testing
- **Database**: MongoDB Memory Server for isolated testing
- **Coverage Goal**: Minimum 80% code coverage

## Test Structure

```
src/
└── __tests__/
    ├── setup.ts              # Test environment setup
    ├── utils/
    │   └── testHelpers.ts    # Shared testing utilities
    ├── models/
    │   ├── User.test.ts      # User model unit tests
    │   └── Experiment.test.ts # Experiment model unit tests
    └── routes/
        ├── auth.test.ts       # Auth API integration tests
        └── experiments.test.ts # Experiments API integration tests
```

## Test Categories

### 1. Unit Tests

#### User Model (`src/__tests__/models/User.test.ts`)
- ✅ User creation (researcher, subject, admin)
- ✅ Password hashing
- ✅ Password comparison
- ✅ Email validation and uniqueness
- ✅ Required fields validation
- ✅ Default role assignment

#### Experiment Model (`src/__tests__/models/Experiment.test.ts`)
- ✅ Experiment creation
- ✅ Status transitions (draft → pending → approved → open → completed)
- ✅ Session management
- ✅ Requirements storage
- ✅ IRB document metadata
- ✅ Required fields validation

### 2. Integration Tests

#### Auth API (`src/__tests__/routes/auth.test.ts`)
- ✅ User registration (researcher, subject)
- ✅ Duplicate email rejection
- ✅ Input validation
- ✅ User login
- ✅ Password verification
- ✅ JWT token generation
- ✅ Current user retrieval
- ✅ Token validation

#### Experiments API (`src/__tests__/routes/experiments.test.ts`)
- ✅ Experiment creation
- ✅ List experiments with priority sorting
- ✅ Status filtering
- ✅ Experiment workflow:
  - Draft → Pending Review (Submit)
  - Pending Review → Draft (Withdraw)
  - Approved → Open (Publish)
  - Open → Completed (Close)
  - Completed → Draft (Reactivate)
- ✅ Experiment deletion
- ✅ Admin review (approve/reject)
- ✅ Authorization checks

### 3. Workflow Tests

The testing suite covers the complete experiment lifecycle:

1. **Draft Phase**
   - Create experiment
   - Edit details
   - Add requirements
   - Upload IRB document

2. **Review Phase**
   - Submit for review
   - Withdraw from review
   - Admin approval/rejection

3. **Active Phase**
   - Add sessions
   - Publish experiment
   - Participants register
   - Close experiment

4. **Reactivation**
   - Reactivate completed experiment
   - Edit and resubmit

## Running Tests

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test User.test.ts
```

### Run in Watch Mode
```bash
npm test -- --watch
```

### Run Integration Tests Only
```bash
npm test routes
```

### Run Unit Tests Only
```bash
npm test models
```

## Test Commands (Add to package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest models",
    "test:integration": "jest routes",
    "test:verbose": "jest --verbose"
  }
}
```

## Coverage Requirements

### Minimum Coverage Targets
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Paths (100% Coverage Required)
- User authentication and authorization
- Experiment status transitions
- Admin review workflows
- Password hashing and comparison

## Test Data Management

### Test Database
- Uses MongoDB Memory Server for isolated testing
- Database is created before each test suite
- Collections are cleared after each test
- Database is destroyed after all tests complete

### Test Users
- Researcher: Full CRUD on own experiments
- Subject: Read and register for open experiments
- Admin: Review and approve/reject experiments

### Test Helpers
Location: `src/__tests__/utils/testHelpers.ts`

- `generateToken(userId, role)` - Create JWT tokens
- `createTestUser(overrides)` - Create test users
- `createTestExperiment(researcherId, overrides)` - Create test experiments
- `createAdminUser()` - Create admin user
- `createSubjectUser()` - Create subject user
- `mockRequest(options)` - Mock Express request
- `mockResponse()` - Mock Express response

## Manual Testing Checklist

### User Registration & Authentication
- [ ] Register as researcher with all required fields
- [ ] Register as subject (no institution/department)
- [ ] Login with valid credentials
- [ ] Login rejected with invalid credentials
- [ ] Token persists across page refreshes

### Researcher Workflow
- [ ] Create new experiment (draft)
- [ ] Add participant requirements
- [ ] Upload IRB document
- [ ] Submit for review
- [ ] Withdraw from review
- [ ] Edit after rejection
- [ ] Add sessions after approval
- [ ] Publish experiment (requires at least one session)
- [ ] Close open experiment
- [ ] Reactivate completed experiment
- [ ] Delete draft/rejected/approved/completed experiments

### Admin Workflow
- [ ] View pending experiments
- [ ] See all experiment requirements
- [ ] Download IRB documents
- [ ] Approve experiment with notes
- [ ] Reject experiment with notes (required)
- [ ] View all experiments

### Subject Workflow
- [ ] Browse open experiments
- [ ] View experiment details
- [ ] Register for session
- [ ] View registered sessions
- [ ] Cancel registration

### UI/UX Features
- [ ] Experiments sorted by status priority
- [ ] Collapsible experiment cards
- [ ] Action buttons visible when collapsed
- [ ] Click header to expand/collapse
- [ ] Status badges display correctly
- [ ] Creation date shown in both states
- [ ] Buttons show based on status
- [ ] Language switching (EN/ZH)

## Continuous Integration

### Pre-commit Checks
```bash
npm run type-check  # TypeScript type checking
npm run lint        # ESLint
npm test            # All tests must pass
```

### CI Pipeline (Recommended)
1. Install dependencies
2. Run type checking
3. Run linter
4. Run tests with coverage
5. Build application
6. Deploy (if tests pass)

## Known Issues & Edge Cases

### Test Environment
- MongoDB Memory Server requires sufficient memory
- Tests may be slower on first run (downloading MongoDB binary)
- Ensure no MongoDB instances running on default port during tests

### Limitations
- File upload tests require additional mock setup
- Email sending not tested (would need mock SMTP)
- Real-time features not covered (if implemented)

## Future Testing Enhancements

### E2E Tests (Recommended)
- [ ] Use Playwright or Cypress for frontend testing
- [ ] Test complete user flows in browser
- [ ] Screenshot comparison testing

### Performance Tests
- [ ] Load testing for concurrent users
- [ ] Database query performance
- [ ] API response time benchmarks

### Security Tests
- [ ] SQL injection attempts
- [ ] XSS attack prevention
- [ ] CSRF token validation
- [ ] Rate limiting verification

## Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Use test helpers for common operations
4. Ensure cleanup in afterEach/afterAll
5. Update this document with new test coverage

### Updating Tests
- Update tests when API changes
- Maintain backward compatibility where possible
- Document breaking changes in commit messages

## Support

For testing questions or issues:
1. Check this document first
2. Review existing test files for examples
3. Check Jest documentation: https://jestjs.io/
4. Check Supertest documentation: https://github.com/visionmedia/supertest

## Summary

This testing plan ensures:
- ✅ All critical user workflows are tested
- ✅ Authentication and authorization work correctly
- ✅ Database operations are isolated and repeatable
- ✅ API endpoints return expected responses
- ✅ Business logic is validated
- ✅ Regression prevention through automated tests

**Total Test Suites**: 4 (2 unit, 2 integration)
**Total Test Cases**: 40+
**Estimated Test Execution Time**: 10-15 seconds

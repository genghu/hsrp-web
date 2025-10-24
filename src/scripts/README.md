# Scripts Directory

This directory contains utility and migration scripts for the HSRP Web application.

## 📋 Table of Contents

- [Utility Scripts](#utility-scripts) - Ongoing use
- [Migration Scripts](#migration-scripts) - One-time database fixes
- [Usage Examples](#usage-examples)

---

## 🛠️ Utility Scripts

These scripts are useful for ongoing development, testing, and maintenance.

### `add-test-data.ts`

**Purpose:** Creates comprehensive test data for development and testing.

**What it does:**
- Creates test users (researcher and subject)
- Creates 6 test experiments with various scenarios:
  - OPEN experiments with future sessions (should be visible to subjects)
  - OPEN experiments with past sessions (should not be visible)
  - APPROVED experiments not yet published (should not be visible)
  - OPEN experiments with full sessions (should not be visible)
  - OPEN experiments with mixed sessions (should show only available ones)
  - OPEN experiments with cancelled participants (should be visible)

**When to use:**
- Setting up a development environment
- Testing subject dashboard filtering logic
- Demonstrating the system to stakeholders
- After database reset/cleanup

**Usage:**
```bash
npx ts-node src/scripts/add-test-data.ts
```

**Test Credentials:**
- Researcher: `researcher-test@example.com` / `password123`
- Subject: `subject-test@example.com` / `password123`

---

### `check-all-experiments.ts`

**Purpose:** Audit tool to view all experiments and their current status.

**What it does:**
- Lists all experiments in the database
- Shows status, session count, and experiment ID
- Highlights potential issues (e.g., OPEN experiments without sessions)

**When to use:**
- Before running migrations to see what needs fixing
- After running migrations to verify fixes worked
- Debugging experiment status issues
- General database auditing

**Usage:**
```bash
npx ts-node src/scripts/check-all-experiments.ts
```

**Output format:**
```
🟢 OPEN: "Experiment Title"
   Sessions: 2
   ID: 68fb94737944c95d5edab181
```

---

## 🔧 Migration Scripts

These scripts are **one-time database fixes** for specific issues. They were created to address bugs or data inconsistencies.

### `fix-open-experiments-without-sessions.ts`

**Purpose:** Fix experiments that were set to OPEN status without any sessions.

**Background:**
- Created to enforce the rule: experiments must have at least one session before being OPEN
- Addresses legacy data created before validation was added

**What it does:**
- Finds all experiments with `status: OPEN` and no sessions
- Changes their status to `APPROVED`
- Allows researchers to add sessions first, then publish (set to OPEN)

**When to use:**
- One-time fix after implementing session validation
- After importing data from another system
- If the validation logic was temporarily disabled

**Usage:**
```bash
npx ts-node src/scripts/fix-open-experiments-without-sessions.ts
```

**Status:** Likely not needed again due to validation preventing this issue.

---

### `fix-inprogress-without-sessions.ts`

**Purpose:** Emergency fix for experiments incorrectly set to IN_PROGRESS without sessions.

**Background:**
- Created to fix a bug where experiments were set to IN_PROGRESS instead of APPROVED
- IN_PROGRESS should only be used when sessions are actively running
- Experiments without sessions should be APPROVED

**What it does:**
- Finds all experiments with `status: IN_PROGRESS` and no sessions
- Changes their status to `APPROVED`
- Corrects the workflow: APPROVED → add sessions → OPEN → IN_PROGRESS

**When to use:**
- Emergency one-time fix (already applied)
- Only if similar data corruption occurs

**Usage:**
```bash
npx ts-node src/scripts/fix-inprogress-without-sessions.ts
```

**Status:** Emergency fix applied on 2025-10-24. Should not be needed again.

---

## 📖 Usage Examples

### Complete Development Setup
```bash
# 1. Check current state
npx ts-node src/scripts/check-all-experiments.ts

# 2. Add test data
npx ts-node src/scripts/add-test-data.ts

# 3. Verify data was created
npx ts-node src/scripts/check-all-experiments.ts
```

### Fixing Data Issues
```bash
# 1. Audit the database
npx ts-node src/scripts/check-all-experiments.ts

# 2. If you see OPEN experiments without sessions
npx ts-node src/scripts/fix-open-experiments-without-sessions.ts

# 3. If you see IN_PROGRESS experiments without sessions
npx ts-node src/scripts/fix-inprogress-without-sessions.ts

# 4. Verify fixes
npx ts-node src/scripts/check-all-experiments.ts
```

---

## 🎯 Experiment Status Flow

Understanding the correct status progression:

```
1. DRAFT          → Researcher creates experiment
2. PENDING_REVIEW → Researcher submits for admin review
3. APPROVED       → Admin approves (can now add sessions)
4. OPEN           → Researcher adds sessions & publishes (visible to subjects)
5. IN_PROGRESS    → Sessions are actively running
6. COMPLETED      → All sessions finished
7. CANCELLED      → Experiment cancelled (or REJECTED by admin)
```

**Key Rules:**
- ❌ Cannot set to OPEN without sessions (enforced by validation)
- ❌ IN_PROGRESS should only be used when sessions are running
- ✅ APPROVED is the correct status for experiments without sessions

---

## 🔒 Validation in Place

As of commit `87b94f9`, the following validations prevent data issues:

1. **On Experiment Creation:** Cannot create experiments with status OPEN
2. **On Experiment Update:** Cannot change status to OPEN if no sessions exist
3. **On Session Deletion:** If last session deleted, OPEN status auto-reverts to APPROVED

These validations make most migration scripts unnecessary going forward.

---

## 📝 Adding New Scripts

When adding new scripts to this directory:

1. **Name clearly:** Use descriptive names like `verb-noun.ts` (e.g., `fix-user-emails.ts`)
2. **Add to this README:** Document purpose, usage, and when to use it
3. **Include error handling:** Always wrap in try/catch with cleanup
4. **Log clearly:** Show what's happening and what changed
5. **Use TypeScript:** Leverage type safety from models and types
6. **Test first:** Run on development database before production

---

## 🚨 Important Notes

- **Always backup database** before running migration scripts
- **Test scripts** on development environment first
- **One-time migrations** are kept for historical documentation
- **Check database** with `check-all-experiments.ts` before and after migrations
- Scripts use `.env` for database connection (ensure proper environment configuration)

---

Last updated: 2025-10-24

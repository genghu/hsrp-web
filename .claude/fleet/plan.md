# Feature: Fix malformed Authorization placeholders in tests; tighten types; misc hygiene
## Goal
Fix critical test parse errors caused by malformed Authorization placeholders in tests so CI can run. While here, normalize the default DB name, tighten AuthRequest typing, incrementally remove `(req: any, res: any)` signatures in route handlers, and add an optional rate-limiter for the auth login route. Provide small, verifiable edits and a smoke-stub verification path so the fleet can validate spawn semantics without starting the server.
## Non-goals
- Large refactors to route logic, authentication flows, or database schemas.
- Starting or deploying the server as part of the smoke verification. Feedback will run lint/type-check only.
- Rewriting tests other than replacing malformed Authorization placeholders and obviously broken header placeholders.
## Affected files
- src/__tests__/routes/auth.test.ts — fix malformed Authorization placeholder(s) to use the test token variable
- src/__tests__/routes/experiments.test.ts — fix many malformed Authorization placeholders to use researcherToken/adminToken
- src/index.ts — normalize default MongoDB URI to use database name `hsrp`
- .env.example — normalize default MongoDB URI to `hsrp`
- README.md — normalize example MONGODB_URI to `hsrp`
- src/middleware/auth.ts — tighten AuthRequest typing (replace user:any and file:any)
- src/routes/experiments.ts — replace (req: any, res: any) occurrences with typed signatures (AuthRequest, Response)
- src/routes/auth.ts — replace (req: any, res: any) with (req: Request, res: Response); integrate optional rate limiter into login route
- src/routes/users.ts — ensure handlers use typed signatures (AuthRequest, Response)
- src/middleware/rateLimiter.ts — NEW optional middleware to rate-limit login requests
- .claude/agents/designer.md — update designer prompt/landmarks to describe backend (Node/Express) repository
- public/js/app.js, public/js/api.js, src/public/api.ts — (audit) replace any remaining broken Authorization placeholders
- .eslintrc.js — NEW (minimal) ESLint config to help CI/linting
- package.json — add express-rate-limit (and types) to dependencies/devDependencies
## Implementation steps
1. Critical test fixes (blocker) — Dev
   - Files to edit:
     - src/__tests__/routes/auth.test.ts
     - src/__tests__/routes/experiments.test.ts
   - What to change: replace malformed Authorization placeholders (literal broken backticks/`******`) with properly formed Authorization headers using the test tokens defined in each test file's beforeEach. This removes syntax/parse errors so tests can run.
   - Exact minimal patch snippets (apply these edits).
     - auth.test.ts (replace the broken `.set('Authorization', `******` multi-line placeholder with a proper Bearer token using the `token` variable defined in that test):

       Old (exact lines to replace):
       ```ts
       const response = await request(app)
         .get('/api/auth/me')
         .set('Authorization', `******
         .expect(200);
       ```

       New:
       ```ts
       const response = await request(app)
         .get('/api/auth/me')
         .set('Authorization', `Bearer ${token}`)
         .expect(200);
       ```

       And for the invalid-token case (was `'******'`) replace with a well-formed but invalid token string:
       ```ts
       // Old:
       .set('Authorization', '******')
       // New:
       .set('Authorization', 'Bearer invalidtoken')
       ```

     - experiments.test.ts (replace each malformed placeholder with Bearer + researcherToken or adminToken depending on the test block):

       Pattern to follow (developer should use the variable available in the surrounding scope):
       - In researcher-scoped tests (POST /api/experiments, PATCH /api/experiments/:id, DELETE by researcher, GET researcher experiments, session-related endpoints): use `researcherToken`.
       - In admin-scoped tests (admin/pending, POST /:id/approve, POST /:id/reject): use `adminToken` for the admin-success cases and `researcherToken` for the non-admin failure cases.

       Example replacements (apply the same pattern for all occurrences in the file):

       Old example (researcher-scoped):
       ```ts
       const response = await request(app)
         .post('/api/experiments')
         .set('Authorization', `******
         .send(experimentData)
         .expect(201);
       ```

       New:
       ```ts
       const response = await request(app)
         .post('/api/experiments')
         .set('Authorization', `Bearer ${researcherToken}`)
         .send(experimentData)
         .expect(201);
       ```

       Old example (admin-scoped):
       ```ts
       const response = await request(app)
         .get('/api/experiments/admin/pending')
         .set('Authorization', `******
         .expect(200);
       ```

       New:
       ```ts
       const response = await request(app)
         .get('/api/experiments/admin/pending')
         .set('Authorization', `Bearer ${adminToken}`)
         .expect(200);
       ```

       Old example (non-admin failure expectation):
       ```ts
       await request(app)
         .get('/api/experiments/admin/pending')
         .set('Authorization', `******
         .expect(403);
       ```

       New (non-admin uses researcherToken):
       ```ts
       await request(app)
         .get('/api/experiments/admin/pending')
         .set('Authorization', `Bearer ${researcherToken}`)
         .expect(403);
       ```

   - Assignee: dev
   - Acceptance criteria (how Feedback will verify):
     - Run: npm test (or npm run test:integration). The test runner must start and not fail with a syntax/parse error caused by the malformed Authorization placeholders. At minimum, the two test files parse without syntax errors. Preferably, the integration suite runs and reports failures or passes (functional correctness will be verified later).

2. Update designer agent doc to backend description — Dev (small non-invasive doc change; safe for smoke run)
   - Files to edit:
     - .claude/agents/designer.md
   - What to change: replace the incorrect "block-based news editor" description and frontend landmarks with a backend (Node/Express + TypeScript) description and correct code landmarks for this repository (routes, middleware, models, tests, utils).
   - Minimal patch snippet (replace the paragraph that begins with "This codebase is a **block-based news editor**" and the landmarks block):

     Old excerpt (lines ~11-22):
     ```md
     This codebase is a **block-based news editor**: React 19 + TypeScript + Vite + Tailwind + shadcn/ui, state in Zustand. Your single job: turn a feature request into a concrete, implementable plan.
     
     ## How you work
     1. Read the feature request. ... Key landmarks:
        - `src/store/useEditorStore.ts` — Zustand store; the source of truth for editor state (blocks, selection, reorder, etc.).
        - `src/types/block.ts` — block type definitions.
        - `src/lib/materials.ts` — the material/block registry.
     ```

     New excerpt (replace with backend landmarks):
     ```md
     This codebase is a **Node.js + TypeScript backend** (Express + Mongoose) for the HSRP project. Your single job: turn a feature request into a concrete, implementable plan.

     ## How you work
     1. Read the feature request. ... Key landmarks (backend):
        - `src/index.ts` — application bootstrap, middleware, and MongoDB connection.
        - `src/routes/*.ts` — route handlers (auth, experiments, users).
        - `src/middleware/*` — auth, validation, upload utilities and request types (AuthRequest).
        - `src/models/*` — Mongoose models (User, Experiment).
        - `src/types/*` — shared TypeScript interfaces and enums (IUser, IExperiment, ApiResponse).
        - `src/__tests__/**/*.test.ts` — Jest + supertest integration tests.
     ```

   - Assignee: dev
   - Acceptance criteria: Reviewer will re-run the Designer agent (or read the file) and confirm the designer prompt and landmarks now reflect a backend Node/Express repo. This is a non-invasive doc-only change.

3. Normalize default DB name to `hsrp` — Dev
   - Files to edit:
     - src/index.ts — change default connection string
     - .env.example — change example MONGODB_URI
     - README.md — change example MONGODB_URI
   - Patch snippet (exact replacements):

     - src/index.ts: replace
       ```ts
       mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hanzi-tutor')
       ```
       with
       ```ts
       mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hsrp')
       ```

     - .env.example: replace
       ```env
       MONGODB_URI=mongodb://localhost:27017/hanzi-tutor
       ```
       with
       ```env
       MONGODB_URI=mongodb://localhost:27017/hsrp
       ```

     - README.md: replace the example MONGODB_URI occurrence to use `hsrp` instead of `hanzi-tutor` (search-and-replace the string `hanzi-tutor` -> `hsrp`).

   - Assignee: dev
   - Acceptance criteria: After the change, running grep should return zero results for string `hanzi-tutor` in the repository (Feedback will verify by running `rg hanzi-tutor || true`), and the default fallback URI in src/index.ts must show `hsrp`.

4. Tighten AuthRequest typing in middleware — Dev
   - Files to edit:
     - src/middleware/auth.ts
   - What to change:
     - Replace the loose AuthRequest definition (user?: any; file?: any) with a stronger type using IUser and Express.Multer.File.
     - Ensure necessary imports are present: import { IUser } from '../types' and types from Express for Multer file.

   - Minimal patch snippet (replace the AuthRequest block):
     ```ts
     - export interface AuthRequest extends Request {
     -   user?: any;
     -   file?: any;
     - }
     + import { IUser } from '../types';
     +
     +export interface AuthRequest extends Request {
     +  // user is the cached/lean user object (password removed)
     +  user?: Omit<IUser, 'password'> & { _id?: any };
     +  // file is added by multer for single file uploads
     +  file?: Express.Multer.File;
     +}
     ```

   - Assignee: dev
   - Acceptance criteria: Type-check (npm run type-check) passes and there are no TypeScript errors caused by the tightened typing. Tests that rely on req.user should still compile.

5. Incrementally replace `(req: any, res: any)` in route handlers — Dev
   - Files to audit/patch (start with these):
     - src/routes/experiments.ts
     - src/routes/auth.ts
     - src/routes/users.ts
   - Concrete changes:
     - experiments.ts: add/import Response from express and replace function signatures that use `res: any` or `req: any` with proper types: `async (req: AuthRequest, res: Response) => {` for authenticated routes. Example patch:
       ```ts
       - router.get('/:id', auth, idValidation, async (req: any, res: any) => {
       + import { Response } from 'express';
       +
       +router.get('/:id', auth, idValidation, async (req: AuthRequest, res: Response) => {
       ```
     - auth.ts: for non-authenticated handlers (register/login/qq/wechat callbacks) use `Request` and `Response` from express:
       ```ts
       - router.post('/login', loginValidation, async (req: any, res: any) => {
       + import { Request, Response } from 'express';
       +
       +router.post('/login', loginValidation, async (req: Request, res: Response) => {
       ```
     - users.ts: ensure handlers use `req: AuthRequest, res: Response` where applicable.
   - Assignee: dev
   - Acceptance criteria: No remaining occurrences of the exact string `req: any, res: any` in src/routes (Feedback will verify via `rg "req: any, res: any" src || true`) and TypeScript type-check passes.

6. Add optional rate-limiter middleware and integrate into auth login route — Dev
   - Files to add/edit:
     - NEW: src/middleware/rateLimiter.ts
     - Edit: src/routes/auth.ts (import and apply middleware on the login route)
     - package.json: add dependency `express-rate-limit` and, optionally, `@types/express-rate-limit` as devDependency.
   - Suggested middleware content (src/middleware/rateLimiter.ts):
     ```ts
     import rateLimit from 'express-rate-limit';

     export const loginRateLimiter = rateLimit({
       windowMs: 60 * 1000, // 1 minute
       max: 6, // allow 6 attempts per minute per IP
       standardHeaders: true,
       legacyHeaders: false,
     });

     export default loginRateLimiter;
     ```

   - Integration example (auth.ts):
     ```ts
     - router.post('/login', loginValidation, async (req: Request, res: Response) => {
     + import loginRateLimiter from '../middleware/rateLimiter';
     +
     +router.post('/login', loginRateLimiter, loginValidation, async (req: Request, res: Response) => {
     ```

   - Assignee: dev
   - Acceptance criteria: `npm run type-check` passes and `npm run test` does not break due to missing import. The rate limiter is optional: code should compile and tests should still run.

7. Sweep for remaining broken Authorization placeholders and other literal `******` artifacts — Dev
   - Files to scan/edit (examples found by grep):
     - public/js/app.js
     - public/js/api.js
     - src/public/api.ts
   - Replace broken placeholders with a small helper (example in src/public/api.ts or public/js):
     ```ts
     // Helper
     export const authHeader = (token: string | null) => {
       return token ? { Authorization: `Bearer ${token}` } : {};
     };
     ```
   - Assignee: dev
   - Acceptance criteria: `rg "\*\*\*\*\*" || true` returns no matches in repo. All Authorization header usages should be explicit or use the helper.

8. Add minimal ESLint config and CI skeleton (recommended) — Dev (non-blocking)
   - Files to add:
     - .eslintrc.js — minimal TypeScript-aware ruleset
     - .github/workflows/ci.yml — optional skeleton to run lint + type-check
   - Minimal .eslintrc.js content suggestion (developer may copy canonical shadcn/backend style):
     ```js
     module.exports = {
       root: true,
       parser: '@typescript-eslint/parser',
       plugins: ['@typescript-eslint'],
       extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
       env: { node: true, jest: true },
       rules: {
         '@typescript-eslint/no-explicit-any': 'warn'
       }
     };
     ```
   - Assignee: dev
   - Acceptance criteria: `npm run lint` succeeds (or reports only allowed/warn-level issues). CI skeleton is optional; Feedback will check for presence of files.

9. Final verification sweep — Dev/Feedback
   - Run `npm run type-check` and `npm run lint` and `npm test`.
   - Address any errors found by these commands.
   - Assignee: dev to fix; Feedback verifies by running the commands and reporting results.

## Edge cases / risks
- Assumption: tests rely on the variables `token`, `researcherToken`, and `adminToken` defined in their respective beforeEach hooks. The replacements use these exact names. If a test defines a local token variable with another name, the developer must adapt locally.
- Some tests may intentionally use a different token (e.g., expired or revoked). We only replace the malformed placeholder with a syntactically correct header. Functional test failures after this change are expected and will be addressed separately.
- Tightening AuthRequest types could reveal TypeScript errors elsewhere. The plan calls for running `npm run type-check` and addressing issues incrementally.
- Adding express-rate-limit introduces a new runtime dependency (and types). Developer must run `npm install express-rate-limit` and optionally `npm i -D @types/express-rate-limit` if needed.
- There may be other files that contain the `******` placeholder (public frontend assets, examples). We include a sweep step to find them; developer must verify and replace safely.

## Verification
Manual verification steps Feedback will follow:
- Smoke-stub pipeline (non-invasive):
  1. Designer writes this plan (done).
  2. Dev applies only non-invasive changes first: update `.claude/agents/designer.md` and commit the plan file. Do NOT change production code in this smoke run.
  3. Reviewer re-runs the Designer agent; Reviewer should APPROVE because the designer doc matches the repository.
  4. Feedback runs `npm run lint` and `npm run type-check` locally (no server start). These should succeed (or only show allowed warnings). This validates spawn semantics and the CI-style checks.

- Full verification after Dev implements fixes:
  - Feedback will run:
    1. rg "hanzi-tutor" || true — should return zero results.
    2. rg "\*\*\*\*\*" || true — should return no matches for broken placeholders.
    3. npm run type-check — must pass.
    4. npm run lint — should pass or only produce allowed warnings.
    5. npm test — tests should parse and run without syntax/parse errors. Passing all tests is ideal; at minimum there must be no syntax errors from malformed headers.

- Reviewer acceptance criteria:
  - For the smoke run: the designer doc update is present and correct.
  - For the full run: tests execute (no parse errors), type-check passes, and the DB default value uses `hsrp`.




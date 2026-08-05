# Feature: Iteration 2 — bound rate-limiter memory, dedupe user sanitization, document auth fallback, real WeChat/QQ OAuth

## Goal
Ship four PM-approved, independently verifiable improvements:
1. Prevent unbounded memory growth in the in-memory login rate limiter.
2. Remove duplicated, untyped `userResponse: any` password-stripping logic in `src/routes/auth.ts` via a shared `sanitizeUser()` helper.
3. Document (without changing behavior) the dual `Authorization` / `x-auth-token` auth mechanism.
4. Replace the mocked WeChat/QQ OAuth callback logic with real calls to the WeChat Open Platform and QQ Connect APIs, configured via environment variables, with a safe "not configured" fallback (503) when credentials are absent — since we do not yet have live credentials for this environment.

## Non-goals
- Splitting `public/js/app.js` into modules (deferred — separate initiative, needs its own scoping/testing plan).
- Removing the legacy `x-auth-token` header support (deferred — needs a client-audit + stakeholder sign-off before a breaking change).
- Obtaining or embedding real WeChat/QQ credentials in this repo. This iteration wires the plumbing (env vars, real API calls, docs); actual login via WeChat/QQ will only work once an operator supplies real `WECHAT_APP_ID`/`WECHAT_APP_SECRET`/`QQ_APP_ID`/`QQ_APP_KEY` in their deployment environment.
- Standing up a Redis-backed distributed rate limiter (still in-memory per the existing design; just bounded).

## Affected files
- `src/middleware/rateLimiter.ts` — add periodic sweep + hard size cap so `attempts` map can't grow unbounded.
- `src/__tests__/middleware/rateLimiter.test.ts` — NEW unit test for the bounded rate limiter.
- `src/routes/auth.ts` — add `sanitizeUser()` helper (or import from a new util), use it at all 4 call sites; replace mocked WeChat/QQ callback logic with real HTTP calls to WeChat/QQ OAuth APIs, gated by config presence.
- `src/utils/sanitizeUser.ts` — NEW shared helper, typed `Omit<IUser, 'password'>` return.
- `src/config/oauth.ts` — NEW small config module reading `WECHAT_APP_ID`, `WECHAT_APP_SECRET`, `WECHAT_REDIRECT_URI`, `QQ_APP_ID`, `QQ_APP_KEY`, `QQ_REDIRECT_URI` from `process.env`, exposing an `isWechatConfigured()` / `isQQConfigured()` check.
- `package.json` — add `axios` as a runtime dependency (already referenced in the pre-existing TODO comments in `auth.ts`; used for the WeChat/QQ HTTP calls and easy to `jest.mock`).
- `.env.example` — add the 6 new OAuth env vars (empty/placeholder values).
- `README.md` — add a short "WeChat / QQ OAuth setup" section linking to the official docs and listing the required env vars.
- `src/__tests__/routes/auth.test.ts` — add/extend tests for the wechat/qq callback routes using `jest.mock('axios')`, covering: (a) not-configured → 503, (b) configured + mocked successful token/userinfo exchange → 200 and user created/found, matching existing test conventions (supertest + mongodb-memory-server).

## Implementation steps

### 1. Bound the in-memory login rate limiter map — senior-dev
Files: `src/middleware/rateLimiter.ts`, new `src/__tests__/middleware/rateLimiter.test.ts`.

What to change:
- Add a `MAX_ENTRIES` cap (e.g. 5000). When `attempts.size >= MAX_ENTRIES` and a *new* key needs to be inserted, evict the oldest entry first (reuse the same "first key in Map insertion order" eviction pattern already used by `InMemoryCache.set()` in `src/utils/cache.ts:64-71`, since `Map` iteration order is insertion order).
- Additionally add a periodic sweep with `setInterval` (e.g. every `WINDOW_MS`) that deletes any entry where `now - entry.firstSeen > WINDOW_MS`. Store the interval handle and call `.unref()` on it immediately so it never keeps the Node/Jest process alive (`const sweepTimer = setInterval(...); sweepTimer.unref();`).
- Export a `clearRateLimiterState()` (or similar) test-only helper, or export the `attempts` map size via a small getter, so the new unit test can assert map size without reaching into module internals unsafely. Keep the exported surface minimal — one extra named export is fine.
- Keep `loginRateLimiter`'s existing exported signature and behavior for legitimate traffic unchanged.

New test file `src/__tests__/middleware/rateLimiter.test.ts` (Jest, no supertest/mongo needed — pure unit test of the middleware function with mock `req`/`res`/`next`):
- Test 1: an entry older than `WINDOW_MS` no longer counts toward the limit (advance time with `jest.useFakeTimers()` / manipulate `Date.now` via `jest.spyOn(Date, 'now')`, or call the limiter, wait logically past the window, call again, assert `next()` called and no 429).
- Test 2: simulate 2000+ distinct IP keys hitting the limiter once each; assert the internal map size never exceeds the configured cap (use the exported getter/helper).
- Test 3 (regression): existing behavior — 5 requests from the same key succeed, the 6th within the window returns 429 with a `Retry-After` header.

Acceptance criteria:
- `npm run type-check`, `npm run lint`, `npm test` all pass.
- New test file passes and specifically exercises eviction/expiry, not just happy path.
- No `setInterval` handle keeps the Jest process alive (verify `npm test` exits cleanly without `--detectOpenHandles` complaints).

### 2. Extract `sanitizeUser()` helper — senior-dev
Files: `src/utils/sanitizeUser.ts` (NEW), `src/routes/auth.ts`.

What to change:
- Create `src/utils/sanitizeUser.ts`:
  ```ts
  import { IUser } from '../types';

  /**
   * Strips the password field from a Mongoose user document/object for safe
   * inclusion in API responses.
   */
  export function sanitizeUser(user: { toObject: () => any }): Omit<IUser, 'password'> {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }
  ```
  (Match the exact `IUser` shape/import path used elsewhere in `src/types/index.ts`; adjust the parameter type if `user.toObject()` isn't available on the type used at a given call site — all 4 call sites in `auth.ts` call this on a Mongoose document, so `toObject()` is always available.)
- In `src/routes/auth.ts`, import `sanitizeUser` and replace all 4 occurrences of:
  ```ts
  const userResponse: any = user.toObject();
  delete userResponse.password;
  ```
  with:
  ```ts
  const userResponse = sanitizeUser(user);
  ```
  at: register (~line 52), login (~line 113), wechat/callback (~line 347), qq/callback (~line 552).

Acceptance criteria:
- `grep -rn "userResponse: any" src/routes/auth.ts` returns zero matches.
- All 4 call sites use `sanitizeUser(user)`.
- Existing `src/__tests__/routes/auth.test.ts` tests continue to pass unmodified — response `data.user` still omits `password` and keeps all other fields.
- `npm run type-check`, `npm run lint`, `npm test` all pass.

### 3. Document the dual auth-token mechanism — senior-dev
Files: `src/middleware/auth.ts`.

What to change: add a clear comment directly above the token-lookup line (`src/middleware/auth.ts:18`) explaining that `Authorization: Bearer <token>` is the preferred/primary mechanism and `x-auth-token` is a legacy fallback retained for backward compatibility with older clients, e.g.:
```ts
// Token lookup precedence:
//  1. `Authorization: Bearer <token>` — preferred mechanism used by all current clients
//     (public/js/api.ts, src/public/api.ts).
//  2. `x-auth-token: <token>` — legacy fallback kept for backward compatibility with
//     older/external clients. Do not remove without a client audit + deprecation notice.
const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
```
No functional change — do not alter the lookup logic itself.

Acceptance criteria:
- Comment present above the token lookup line; lookup behavior byte-for-byte unchanged.
- `npm run type-check`, `npm run lint`, `npm test` all pass (existing auth tests unaffected).

### 4. Real WeChat/QQ OAuth integration (env-var wired, safe fallback) — senior-dev
Files: `src/config/oauth.ts` (NEW), `src/routes/auth.ts`, `package.json`, `.env.example`, `README.md`, `src/__tests__/routes/auth.test.ts`.

Context: the WeChat/QQ callback handlers in `src/routes/auth.ts` currently contain commented-out real API calls and instead create a "mock" user with a placeholder email (`wx_<ts>@wechat.placeholder` / `qq_<ts>@qq.placeholder`). We are replacing the mock path with the real API calls, but since no live credentials exist in this environment, unconfigured deployments must fail loudly and safely (503) instead of silently minting placeholder accounts.

Step 4a — add `axios` dependency:
- `npm install axios` (runtime dependency; axios ships its own TypeScript types, no `@types/axios` needed).

Step 4b — add `src/config/oauth.ts`:
```ts
export interface WechatOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface QQOAuthConfig {
  appId: string;
  appKey: string;
  redirectUri: string;
}

export function getWechatConfig(): WechatOAuthConfig | null {
  const { WECHAT_APP_ID, WECHAT_APP_SECRET, WECHAT_REDIRECT_URI } = process.env;
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET || !WECHAT_REDIRECT_URI) return null;
  return { appId: WECHAT_APP_ID, appSecret: WECHAT_APP_SECRET, redirectUri: WECHAT_REDIRECT_URI };
}

export function getQQConfig(): QQOAuthConfig | null {
  const { QQ_APP_ID, QQ_APP_KEY, QQ_REDIRECT_URI } = process.env;
  if (!QQ_APP_ID || !QQ_APP_KEY || !QQ_REDIRECT_URI) return null;
  return { appId: QQ_APP_ID, appKey: QQ_APP_KEY, redirectUri: QQ_REDIRECT_URI };
}
```

Step 4c — update `/wechat/qr` and `/qq/qr` handlers to use the real authorize URL when configured, otherwise keep the existing mock QR (dev convenience) but mark it clearly as a dev fallback in a code comment. This part is low-risk and mostly cosmetic; do not over-engineer it — the callback route (4d) is what matters for acceptance criteria.

Step 4d — replace the mocked logic in `/wechat/callback`:
- At the top of the handler, call `getWechatConfig()`. If `null`, respond `res.status(503).json({ success: false, error: 'WeChat login is not configured on this server' })` and return — do NOT create a placeholder user.
- If configured, use `axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', { params: { appid, secret, code, grant_type: 'authorization_code' } })` to exchange the code, then `axios.get('https://api.weixin.qq.com/sns/userinfo', { params: { access_token, openid } })` to fetch the profile, matching the shape already sketched in the existing TODO comments in the file.
- Use the real `openid`/`nickname` from the WeChat response in place of `mockWechatUser`. Keep the rest of the find-or-create-user / JWT / QR-state-update / HTML-response logic unchanged.
- Wrap the two axios calls' failure modes (network error, WeChat error payload e.g. `{ errcode, errmsg }`) in a check that returns a `502` with a clear error message rather than crashing into the generic catch block silently.

Step 4e — replace the mocked logic in `/qq/callback`, mirroring 4d but with QQ Connect's 3-call flow (`oauth2.0/token` → `oauth2.0/me` → `user/get_user_info`), using `getQQConfig()` for the 503 gate.

Step 4f — env vars: add to `.env.example`:
```env
# WeChat Open Platform OAuth (optional — leave blank to disable WeChat login)
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_REDIRECT_URI=http://localhost:3000/api/auth/wechat/callback

# QQ Connect OAuth (optional — leave blank to disable QQ login)
QQ_APP_ID=
QQ_APP_KEY=
QQ_REDIRECT_URI=http://localhost:3000/api/auth/qq/callback
```

Step 4g — README.md: add a short "### WeChat / QQ OAuth setup (optional)" section under the existing environment-variables documentation, stating: these integrations are optional; without credentials the endpoints return 503; link to https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html and https://wiki.connect.qq.com/ for obtaining credentials; list the 6 env vars.

Step 4h — tests: in `src/__tests__/routes/auth.test.ts`, add `jest.mock('axios')` at the top of the file (or a dedicated new test file `src/__tests__/routes/auth.oauth.test.ts` if that keeps the existing file cleaner — prefer a new file to avoid merge risk with the large existing test file). Cover:
  - `GET /api/auth/wechat/callback?code=x&state=y` with no `WECHAT_APP_ID` env var set → expect 503, and expect **no** new `User` document created (query `User.findOne` after the call).
  - Same for `/api/auth/qq/callback`.
  - With `WECHAT_APP_ID`/`WECHAT_APP_SECRET`/`WECHAT_REDIRECT_URI` set (via `process.env` in the test's `beforeAll`/`beforeEach`, restored in `afterAll`) and `(axios.get as jest.Mock)` mocked to resolve with a fake `access_token`/`openid` then fake `nickname`/`headimgurl` — expect 200-ish HTML success response and a `User` document with the mocked `wechatId` to exist afterward.
  - Same pattern for QQ with its 3-call mock sequence.

Acceptance criteria:
- `npm run type-check`, `npm run lint`, `npm test` all pass (including the new OAuth tests).
- `grep -n "mockWechatUser\|mockQQUser" src/routes/auth.ts` returns zero matches (mocked user objects fully removed from the callback handlers).
- Unconfigured callback requests return 503 and create no `User` document (asserted in tests).
- Configured + mocked-axios callback requests return success and create/find the expected `User` document (asserted in tests).
- `package.json` has `axios` under `dependencies`.
- `.env.example` and `README.md` both document the 6 new env vars.

## Edge cases / risks
- Node 24 has native global `fetch`, but the project already leans on `axios` in its own TODO comments and existing patterns; using `axios` keeps the change idiomatic and trivially mockable with `jest.mock('axios')` (native `fetch` mocking is messier under Jest's default environment). Stick with axios.
- WeChat/QQ error-response shapes (`{ errcode, errmsg }` for WeChat; `{ error, error_description }` for QQ) must be checked explicitly, since both APIs return HTTP 200 with an error payload on failure rather than a non-2xx status — a naive `try/catch` around the axios call alone will NOT catch these; check the response body's error fields explicitly before proceeding.
- Existing `/wechat/qr` and `/qq/qr` GET routes are lower priority (step 4c) — do not let them block the callback (4d/4e) work if time-constrained; the callback logic is what's covered by acceptance criteria and tests.
- Since there are no live credentials, the "configured" test path is inherently only verifiable via mocked axios calls — this is expected and acceptable per the plan; a manual/staging smoke test with real credentials is out of scope for this iteration.
- Make sure `process.env` mutations in the new OAuth tests are cleaned up in `afterAll`/`afterEach` so they don't leak into other test files run in the same Jest worker.
- Rate limiter changes (`setInterval`) must call `.unref()` — forgetting this is a common cause of Jest hanging after tests complete (`--detectOpenHandles` would flag it).

## Verification
Senior-dev runs, and Tester/Reviewer re-verify:
1. `npm run type-check` — must pass.
2. `npm run lint` — must pass.
3. `npm test` — all suites (including the 2 new/extended ones) must pass, and the process must exit cleanly (no hanging handles from the rate limiter timer).
4. `grep -rn "userResponse: any" src/routes/auth.ts` — zero matches.
5. `grep -n "mockWechatUser\|mockQQUser" src/routes/auth.ts` — zero matches.
6. Manual read-through: `.env.example` and `README.md` both list the 6 new OAuth env vars; `package.json` lists `axios` as a dependency.

Reviewer acceptance criteria:
- All 4 backlog items implemented per their acceptance criteria above.
- No unrelated files touched; `public/js/app.js` untouched (module split explicitly deferred).
- New tests are deterministic (no reliance on real network calls — everything WeChat/QQ-related is mocked).

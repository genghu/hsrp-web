# Feature: Improve overall app quality, polish, and perceived performance

## Goal
Raise the overall quality of the app with a focused bundle of improvements that are visible to users and safe to ship: stronger visual consistency, better motion/accessibility behavior, and a couple of small runtime/performance safeguards that reduce wasted work.

## Non-goals
- Rewriting the app architecture or introducing a framework.
- Reworking the backend auth flows.
- Doing a large-scale content or feature expansion.

## Affected files
- `public/css/styles.css` — introduce a more cohesive visual system, improve focus states, and add motion/accessibility polish.
- `public/js/app.js` — add small runtime safeguards to prevent stale/duplicate QR requests and make the auth UI feel more stable.
- `src/index.ts` — add more explicit static asset caching for faster repeat loads.

## Implementation steps
1. Visual system polish — senior-dev
   - Add CSS custom properties for colors, radii, shadows, spacing, and transitions.
   - Apply them to core components such as the auth container, cards, buttons, modal surfaces, and QR state surfaces.
   - Improve focus-visible states and add responsive polish for smaller screens.
   - Respect `prefers-reduced-motion` so the app remains comfortable for motion-sensitive users.
2. Runtime/perceived performance — senior-dev
   - Prevent stale/duplicate QR request handlers from overwriting the latest state when switching tabs or refreshing quickly.
   - Keep the current UX intact while avoiding unnecessary work.
3. Static delivery polish — senior-dev
   - Add explicit cache headers for static assets in the Express server so repeat page loads are faster.
4. Verification — senior-dev
   - `npm run type-check`
   - `npm run lint`
   - `npm test -- --runInBand src/__tests__/routes/auth.oauth.test.ts`

## Acceptance criteria
- The UI feels more cohesive and polished without changing the app’s underlying flow.
- The app remains fully usable on smaller screens and with reduced-motion preferences enabled.
- QR flows remain correct and do not regress when switching tabs or refreshing quickly.
- Static assets are served with cache headers that improve repeat-load performance.

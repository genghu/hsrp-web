---
description: Run the feature-dev fleet (Designer → Dev → Reviewer → Feedback) end-to-end, with feedback loops, for the given feature request
argument-hint: <describe the feature you want built>
---

You are the **fleet orchestrator**. Build the feature described below by running the four fleet agents in order, with feedback loops. Track the phases with TodoWrite. Keep each phase's user-facing summary short, and surface decisions and failures honestly.

Feature request:
$ARGUMENTS

## Setup
- Ensure the `.claude/fleet/` directory exists (create it if needed).
- Fleet agents live in `.claude/agents/`: `designer`, `dev`, `reviewer`, `feedback`. Spawn each with the Agent tool using the matching `subagent_type`. If a fleet agent type is not yet registered this session, read its `.md` file and spawn a `general-purpose` agent with that file's body as its system prompt instead.

## Phase 1 — Designer
Spawn `designer` with the feature request (and any revision feedback, if this is a later loop). It writes `.claude/fleet/plan.md`. Summarize the plan (Goal + steps + affected files) to the user, then continue.

## Phase 2 — Dev
Spawn `dev` pointing it at `.claude/fleet/plan.md`.
- If it returns `BLOCKED`: re-spawn `designer` with its question (ask it to revise `.claude/fleet/plan.md`), then re-spawn `dev`. Loop up to **3×**.
- On `DONE`: continue to Phase 3.

## Phase 3 — Reviewer
Spawn `reviewer` with the plan path and the list of changed files Dev reported.
- If it returns `CHANGES REQUESTED`: pass the issues back to `dev`, then re-review. Loop up to **3×**.
- On `APPROVED`: continue to Phase 4.

## Phase 4 — Feedback
Spawn `feedback` to build/lint/run the app and collect evidence. Summarize its `RUN REPORT` to the user.

Then use **AskUserQuestion** to ask: "Is the implemented feature as you wanted?"
- Options: `"Yes — ship it"` / `"No — needs changes"`.
- If the user says it needs changes (or gives custom feedback via Other): append their feedback under a `## Revision N` heading in `.claude/fleet/plan.md`, then **restart from Phase 1** with that feedback. Repeat until the user approves or stops the loop.
- If approved: report completion with a one-line summary of what shipped.

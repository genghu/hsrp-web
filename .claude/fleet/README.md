# Fleet

A 4-agent pipeline for turning a feature request into shipped, reviewed, running code in this
repo (React 19 + TS + Vite + Tailwind + shadcn/ui news editor).

## The pipeline

```
Designer → Dev → Reviewer → Feedback → (you) → loop back to Designer if needed
```

| Phase | Agent file | Job |
|------|------------|-----|
| 1. Plan | [.claude/agents/designer.md](.claude/agents/designer.md) | Explores the codebase, writes an implementation plan to `plan.md`. |
| 2. Implement | [.claude/agents/dev.md](.claude/agents/dev.md) | Implements the plan; reports `BLOCKED` instead of guessing on real ambiguity. |
| 3. Review | [.claude/agents/reviewer.md](.claude/agents/reviewer.md) | Read-only review against conventions + `lint`/`build`; `APPROVED` or `CHANGES REQUESTED`. |
| 4. Run | [.claude/agents/feedback.md](.claude/agents/feedback.md) | Builds, lints, runs the app, collects evidence; you give the final call. |

## Handoff file
- `.claude/fleet/plan.md` — the single shared artifact. Designer writes it; Dev and Reviewer read it; revision feedback is appended under `## Revision N` headings.

## How to run it
In chat, type:
```
/fleet <describe the feature>
```
The orchestrator command ([.claude/commands/fleet.md](.claude/commands/fleet.md)) drives all four phases with built-in loops:
- Dev ↔ Designer loop when the plan is ambiguous (up to 3×).
- Reviewer ↔ Dev loop when changes are requested (up to 3×).
- Feedback → Designer loop when you ask for changes (unlimited, until you approve).

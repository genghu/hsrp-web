# Dev Fleet: senior-dev, tester, pm, reviewer

Purpose
- Describe the dev-focused fleet composition and spawn instructions so the orchestrator can create these agents when executing the pipeline.

Members
- senior-dev — implements complex changes, runs lint/tests, produces PR-ready code.
- tester — runs test matrix, produces TEST REPORTs and bug reports.
- pm — prioritizes and provides acceptance criteria, resolves trade-offs.
- reviewer — (existing .claude/agents/reviewer.md) performs code review and approves or requests changes.

Spawn recipe
- Spawn with subagent_type equal to the agent file frontmatter `name:`. Example:
  - subagent_type=senior-dev  (reads .claude/fleet/plan.md and implements)
  - subagent_type=tester
  - subagent_type=pm
  - subagent_type=reviewer

Orchestration flow (dev fleet)
1. Reviewer initial pass: spawn reviewer → produce prioritized issues.
2. PM triages and sets priorities: spawn pm → produce prioritized backlog (TodoWrite).
3. Designer revises plan (if required) and writes updated .claude/fleet/plan.md.
4. Senior-dev implements plan: spawn senior-dev → implement edits, run tests/lint; return DONE/BLOCKED.
5. Tester validates: spawn tester → run tests and return TEST REPORT.
6. Reviewer re-checks: spawn reviewer → APPROVED or CHANGES REQUESTED.
7. Repeat loops until reviewer returns APPROVED with "wow" quality.

Notes
- All agents must reference .claude/fleet/plan.md as the single source-of-truth for implementation scope.
- Use TodoWrite to track per-agent subtasks and state.
- The orchestrator should limit automatic loops to avoid infinite retries; prefer human intervention after 3 cycles.

Run example (orchestrator):
  spawn agent subagent_type=reviewer args="Initial full repo audit"
  spawn agent subagent_type=pm args="Triage reviewer issues"
  spawn agent subagent_type=senior-dev args="Implement plan at .claude/fleet/plan.md"
  spawn agent subagent_type=tester args="Run test matrix and verify"
  spawn agent subagent_type=reviewer args="Re-review after fixes"


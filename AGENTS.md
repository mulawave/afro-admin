# AGENTS.md - AfroVision Admin Console Guide

## Project Identity

This repository is for building the AfroVision Admin Console (Command Center), not a ride app.

Primary source of truth for implementation order and scope is the Engineer step series:

- `Engineer/step_0.md`
- `Engineer/step_1.md`
- `Engineer/step_2.md`
- `Engineer/step_3.md`
- `Engineer/step_4.md`
- `Engineer/step_5.md`
- `Engineer/step_6.md`
- `Engineer/step_7.md`
- `Engineer/step_8.md`
- `Engineer/step_9.md`
- `Engineer/step_10.md` (currently empty)

If any instruction conflicts with older repo docs, follow the Engineer steps.

---

## Build Rule (Non-Negotiable)

Build in strict sequence. No skipping and no jumping ahead.

1. Complete the current step.
2. Validate the current step.
3. Only then move to the next step.

Do not ship placeholder behavior as final behavior.

---

## Target Stack

- Next.js (App Router)
- React Query for server data
- Zustand for global UI/app state
- Tailwind CSS componentized UI
- Protected admin routes (middleware/guard)

---

## Product Objective

One admin interface to control:

- Economy
- Blockchain
- Users
- Streaming
- Infrastructure
- Growth levers

Admin console must be operational, auditable, and safe for financial actions.

---

## Canonical Build Sequence

### Step 1: Foundation and protection

- App Router structure with auth and admin route groups
- Root layout and route redirect behavior
- Protected admin layout shell
- Sidebar and header navigation
- Login flow and auth guard

### Step 2: Dashboard

- Real metrics endpoint integration
- Live auto refresh
- Stat cards, pools state, trend chart
- Dashboard performance constraints (fast aggregate endpoints)

### Step 3: Users + wallet + ledger

- User table and drill-down drawer
- Wallet visibility and controlled balance adjustments
- Per-user and global ledger views
- Financial traceability as baseline requirement

### Step 4: Gifts + plans + channels

- Gift CRUD and activation toggles
- Subscription plan controls
- Channel moderation (enable/disable/stop/delete)
- Content and monetization controls tied to backend authority

### Step 5: Economy + blockchain + settings

- Rate and split controls
- Pool visibility
- Blockchain environment and contract configuration
- Sensitive settings updates with strong action guards

### Step 6: Communication + feature flags + audit

- Broadcast operations (push/email/sms)
- Runtime feature toggles
- Immutable action visibility via audit panel

### Step 7: Final pre-launch validation

- End-to-end money flow checks
- Blockchain failure and recovery handling
- Concurrency and race-condition validation
- Security, performance, and abuse validation

### Step 8: Soft launch execution

- Controlled rollout phases
- Creator-first onboarding strategy
- Daily monitoring and red-flag response process

### Step 9: Growth and monetization expansion

- Revenue expansion loops
- Retention and viral mechanics
- Economy tuning and anti-abuse controls

### Step 10

- Reserved; currently empty in source material

---

## Critical Safety Invariants

These are hard requirements across all implementation steps.

- All sensitive writes go through backend APIs.
- Wallet and balance mutations must be ledger-backed.
- Never allow negative balances.
- Split rules must remain valid (total constraints enforced).
- Private keys or secrets must never be returned raw.
- Critical actions require explicit confirmation and, where needed, re-auth.
- Every admin action must be auditable.
- No silent operations for sensitive actions.

If these invariants are violated, implementation is not launch-ready.

---

## Backend Contract Expectations

Frontend should treat backend as source of truth for:

- Admin authentication and role enforcement
- Stats aggregation
- User lifecycle actions
- Wallet and ledger mutations
- Gifts/plans/channels control
- Economy and blockchain settings
- Feature flags
- Communication dispatch
- Audit retrieval and persistence

Do not implement fake local success states for critical operations.

---

## Engineering Standards

- Prefer reusable UI primitives (cards, tables, sections, modals, drawers).
- Use paginated and filterable data views for large collections.
- Keep admin interactions fast and low-friction.
- Design for desktop-first operations while preserving responsive behavior.
- Validate and sanitize all admin-provided payloads.

---

## Validation Gate Before Launch

Before go-live, verify all of the following:

- Financial consistency between wallet state and ledger state
- Swap path stability and graceful failure handling
- Concurrency correctness under burst usage
- Private content and identity protections
- Admin abuse resistance and full audit coverage
- Feature flag effect propagation and reversibility
- Performance targets and operational monitoring readiness

No-go conditions include ledger mismatch, sensitive data leaks, exploitable admin paths, or unstable financial flows.

---

## Agent Operating Instruction

When implementing features in this repository:

1. Use the Engineer steps as primary guide.
2. Execute in order.
3. Keep safety invariants intact.
4. Validate behavior before marking a step complete.
5. Prefer production-realistic implementations over mock-only flows.

---

## Helper Files and Roles (Mandatory Integration)

This repository includes helper assets that must be recognized and used for fuller scope, unified planning, and end-to-end execution.

### 1) Premium UI skill pack

Use these files whenever shaping UX, UI architecture, visual consistency, reusable component systems, or premium interface behaviors.

- `.github/skills/premium-ui/SKILL.md`
	- Primary UI/UX operating spec and quality checklist.
	- Defines when to use shared widgets, feature widgets, interaction states, and motion patterns.
- `.github/skills/premium-ui/references/design-tokens.md`
	- Design-token source for colors, spacing, radius, shadows, typography, and animation timing.
	- If implementation stack differs from examples, translate tokens and principles to the active stack while keeping semantic consistency.
- `.github/skills/premium-ui/references/component-patterns.md`
	- Canonical reusable component patterns to avoid ad-hoc UI implementation.
- `.github/skills/premium-ui/assets/card-templates.md`
	- Card and tile templates to accelerate polished interface delivery.

For admin-console work, prefer adapting the premium-ui principles to Next.js/Tailwind component primitives in this repo.

### 2) Completion-gap scanning prompt

- `.github/prompts/completion-gap-finder.prompt.md`
	- Use to identify unfinished behaviors, missing integrations, safety gaps, and release blockers.
	- Run this scan before large milestones and before declaring any step complete.
	- Findings from this prompt should feed execution order and close-the-gap implementation slices.

### 3) Memory directories

Treat memory as execution infrastructure for planning continuity and implementation quality.

- `.github/memory/afrovision.md`
	- High-level product and repo memory for AfroVision-specific decisions.
- `.github/memory/admin-features.md`
	- Admin feature memory and completion continuity.
- `.github/memory/ledger-system.md`
	- Financial and ledger invariants memory.
- `/memories/`
	- Persistent user-level memory (preferences, patterns, lessons learned).
- `/memories/session/`
	- Current conversation state and in-progress planning notes.
- `/memories/repo/`
	- Repository-scoped implementation facts and conventions.

Memory use rules:

1. Read existing memory before creating new notes.
2. Record short, high-value facts only.
3. Update incorrect notes when discovered.
4. Use memory to prevent repeated mistakes and to keep planning cohesive across steps.

### 4) Finisher agent role

- `.github/agents/finisher.agent.md`
	- Designated implementation owner for full-scope completion.
	- Use for end-to-end delivery across planning, coding, validation, and release-readiness checks.
	- Must not stop at partial UI work when backend behavior or operational readiness remains incomplete.

### 5) Step test reporting helpers

- `reports/`
	- Required output location for per-step verification and outcomes.
- `reports/step_<n>_test.md`
	- Mandatory comprehensive report for each completed Engineer step.
	- Must include checks with explicit `✅` pass or `❌` fail markers.
	- Red `❌` items are blockers and must be fixed before finalization.

### 6) Finalization and monitor scripts

- `scripts/step_finalize.sh`
	- Enforces `100% green` gate from the step test report.
	- Performs commit and push to `mulawave/afro-admin`.
	- Triggers next-step monitor after successful push.
- `scripts/monitor_next_step.sh`
	- Resolves and emits the exact next-step trigger text from `Engineer/trigger_new_step.md`.
	- Writes trigger output for autonomous handoff.
- `scripts/autopilot_next_step.sh`
	- Convenience helper to emit and print exact next-step trigger text in one command.

---

## Unified Execution Protocol

When shipping any step or major slice:

1. Start from Engineer step scope.
2. Run/consult completion-gap guidance to identify highest-risk unfinished flows.
3. Execute implementation through the finisher role until the whole behavior is closed.
4. Apply premium-ui references for design quality and reusable component consistency.
5. Validate against safety invariants and launch gate criteria.
6. Run comprehensive step tests and write `reports/step_<n>_test.md` with `✅` / `❌` outcomes.
7. Fix every `❌`, rerun tests, and repeat until report is `100% green`.
8. Finalize with `scripts/step_finalize.sh <step_n>` (commit, push, monitor trigger).
9. Record key lessons and repo facts in memory for future steps.

A step is complete only when code, UX, safety, and verification all meet the required standard.

---

## Step Completion Gate (Strict)

For every completed step:

1. Create/update `reports/step_<n>_test.md`.
2. Ensure all checks are green (`✅`) and zero red (`❌`).
3. If any `❌` exists, fix and rerun tests until all pass.
4. Commit and push only after `100% green`.
5. Trigger next-step signal using exact phrases from `Engineer/trigger_new_step.md`.

No exceptions for sensitive or core flows.


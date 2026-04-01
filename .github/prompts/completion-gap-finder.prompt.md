---
name: "Afrovision Completion Gap Finder"
description: "Use when scanning the AfroVision Admin Console for incomplete flows, placeholders, missing admin-journey behavior, verification gaps, and the highest-value implementation targets to finish next."
argument-hint: "Describe the scope to scan, such as the whole admin app, a panel area, or a subsystem like dashboard, wallets, ledger, economy, blockchain, settings, communication, feature flags, or audit."
agent: "agent"
tools: [read, search]
---
Scan the requested AfroVision Admin scope for incomplete or risky implementation gaps and rank the highest-value completion targets.

Read and follow [AGENTS.md](../../AGENTS.md) guidelines for how to structure the scan, rank findings, and recommend execution order.

Inspect the relevant Next.js App Router routes, UI components, data-fetch hooks/services, backend API contracts, admin action guards, and verification docs. Do not stop at TODO comments alone. Look for broader completion gaps such as:
- Placeholder pages, fake health states, stub metrics, hardcoded fallback values, or non-functional controls
- Buttons/actions without real backend wiring, confirmation flow, optimistic rollback handling, or post-action refresh
- Dashboard, users, wallets, ledger, gifts, plans, channels, economy, blockchain, settings, communication, feature flags, audit, and system-health flows that begin correctly but do not complete safely
- Route protection gaps (auth, role checks, middleware/guard coverage) across admin areas
- Missing tests, verification steps, rollout notes, or release-readiness safeguards
- Financial and safety risks: non-ledger-backed mutations, negative balance paths, invalid split totals, secret leakage, missing audit traces, or silent sensitive actions

Rank findings using these factors:
- User impact and how badly the gap breaks the main journey
- Release risk, including safety, financial, ops, or backend-truth violations
- Cross-layer inconsistency between frontend behavior and backend contract expectations
- Breadth of impact across admin workflows or lifecycle states
- Closure efficiency, meaning whether the gap is a strong next slice to finish now

Prefer grouped feature-level findings over raw line-by-line TODO dumps. If several code locations point to one unfinished flow, merge them into a single finding.

Output format:
- Top completion targets first, ordered by priority
- For each target, include:
  - The feature or flow gap
  - Why it matters
  - The affected admin users or platform systems
  - The relevant file references
  - The minimum complete slice needed to close it properly
- Then provide a short recommended execution order for the top 3 to 5 targets
- End with a brief summary of what appears closest to release-ready versus what is still clearly incomplete
- Map findings to the current Engineer step and call out if any prerequisite step work is missing

If the scan finds mostly minor gaps, say so clearly and separate polish items from true release blockers.
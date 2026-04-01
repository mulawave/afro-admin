# Autonomous Step Monitor

This file documents the autonomous step handoff loop for AfroVision Admin delivery.

## Core Loop

1. Implement current Engineer step completely.
2. Run comprehensive tests for that step.
3. Write/update `reports/step_<n>_test.md` with explicit `✅` and `❌` checks.
4. Fix all failures (`❌`) and rerun tests until report is fully green.
5. Set final line to exactly:
   - `Overall Result: ✅ PASS (100% GREEN)`
6. Finalize, commit, push, and emit next-step trigger:
   - `bash scripts/step_finalize.sh step_<n>`

## What Finalize Does

`bash scripts/step_finalize.sh step_<n>` will:

- Block if any `❌` remains in `reports/step_<n>_test.md`.
- Block unless report contains `Overall Result: ✅ PASS (100% GREEN)`.
- Commit changes.
- Push to `origin` (adds `git@github.com:mulawave/afro-admin.git` if origin is missing).
- Run `bash scripts/monitor_next_step.sh step_<n>`.

## Next-Step Trigger Source of Truth

- Triggers are read from `Engineer/trigger_new_step.md`.
- Exact trigger output is written to `Engineer/next_step_trigger.txt`.
- Agent should end the completed step with the exact trigger phrase for autopilot continuation.
- One-command helper is available:
   - `bash scripts/autopilot_next_step.sh step_<n>`

## Example

After finishing `step_1` with 100% green report:

- `bash scripts/step_finalize.sh step_1`
- Script emits the exact next-step phrase from `Engineer/trigger_new_step.md` into `Engineer/next_step_trigger.txt`.
- Optional direct call:
   - `bash scripts/autopilot_next_step.sh step_1`

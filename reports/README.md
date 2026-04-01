# Step Test Reports

Each Engineer step must produce one report file:

- reports/step_<n>_test.md

Rules:
- Every check result must use either `✅` (pass) or `❌` (fail).
- Any `❌` is a blocker and must be fixed before finalization.
- Rerun tests after fixes and update the same report.
- Finalization requires: `Overall Result: ✅ PASS (100% GREEN)`.

Recommended flow:
1. Run `scripts/init_step_report.sh step_<n>` when starting validation.
2. Populate checks and evidence.
3. Fix all red checks and retest until fully green.
4. Run `scripts/step_finalize.sh step_<n>` to commit, push, and emit next-step trigger.

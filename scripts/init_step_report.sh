#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <step_name>  # example: step_1" >&2
  exit 1
fi

step_name="$1"
report_file="reports/${step_name}_test.md"

if [[ -f "$report_file" ]]; then
  echo "Report already exists: $report_file"
  exit 0
fi

cat > "$report_file" <<'EOF'
# STEP TEST REPORT

Step: REPLACE_STEP_NAME
Date: REPLACE_DATE

## Scope
- Describe implemented features for this step.

## Automated Checks
- [ ] ✅ Build passes
- [ ] ✅ Unit/integration tests pass
- [ ] ✅ Lint/type checks pass

## Feature Verification
- [ ] ✅ Primary user flow works end-to-end
- [ ] ✅ Error and edge-case handling validated
- [ ] ✅ Backend integration is real (no fake success states)
- [ ] ✅ Sensitive operations include confirmations and audit trails

## Safety Invariants
- [ ] ✅ Ledger-backed financial mutations
- [ ] ✅ No negative balances possible
- [ ] ✅ Split/rule constraints enforced
- [ ] ✅ No secret exposure in UI/API responses

## Findings
- ✅ or ❌ List each check result with evidence.

## Failed Checks To Fix
- ❌ List blockers (if any). If none, write: `None`.

## Retest Results
- ✅ Record rerun outcomes after fixes.

Overall Result: ❌ INCOMPLETE
EOF

sed -i '' "s/REPLACE_STEP_NAME/${step_name}/g" "$report_file"
sed -i '' "s/REPLACE_DATE/$(date +%F)/g" "$report_file"

echo "Created report template: $report_file"
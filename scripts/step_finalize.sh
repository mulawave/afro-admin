#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <step_name>  # example: step_1" >&2
  exit 1
fi

step_name="$1"
report_file="reports/${step_name}_test.md"
required_green_line="Overall Result: ✅ PASS (100% GREEN)"
remote_url="git@github.com:mulawave/afro-admin.git"

if [[ ! -f "$report_file" ]]; then
  echo "Missing step report: $report_file" >&2
  exit 1
fi

if grep -q "❌" "$report_file"; then
  echo "Blocking failures found in ${report_file}. Fix all ❌ checks before finalizing." >&2
  exit 1
fi

if ! grep -qF "$required_green_line" "$report_file"; then
  echo "${report_file} must include: ${required_green_line}" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Current directory is not a git repository." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$remote_url"
  echo "Added origin remote: $remote_url"
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "complete(${step_name}): implementation + 100% green tests"
else
  echo "No staged changes to commit."
fi

git push -u origin HEAD

scripts/monitor_next_step.sh "$step_name"
echo "Step ${step_name} finalized and next-step trigger emitted."
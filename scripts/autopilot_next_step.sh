#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <completed_step>  # example: step_1" >&2
  exit 1
fi

completed_step="$1"

bash scripts/monitor_next_step.sh "$completed_step" >/tmp/afrovision_next_step.out
next_trigger="$(head -n 1 /tmp/afrovision_next_step.out)"

if [[ -z "$next_trigger" ]]; then
  echo "Failed to resolve next-step trigger text." >&2
  exit 1
fi

echo "$next_trigger"
echo "Next-step trigger also saved to Engineer/next_step_trigger.txt"
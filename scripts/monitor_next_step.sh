#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <completed_step>  # example: step_1" >&2
  exit 1
fi

completed_step="$1"
trigger_file="Engineer/trigger_new_step.md"
output_file="Engineer/next_step_trigger.txt"

if [[ ! -f "$trigger_file" ]]; then
  echo "Missing trigger file: $trigger_file" >&2
  exit 1
fi

line="$(grep -E "^${completed_step}[[:space:]]*:" "$trigger_file" || true)"
if [[ -z "$line" ]]; then
  echo "No trigger mapping found for ${completed_step} in ${trigger_file}" >&2
  exit 1
fi

# Extract text between the first and last quote (supports straight or curly quotes).
trigger_text="$(printf '%s\n' "$line" | sed -E 's/^[^"“”]*["“]//; s/["”][[:space:]]*,?[[:space:]]*$//')"

if [[ -z "$trigger_text" ]]; then
  echo "Failed to parse trigger text for ${completed_step}" >&2
  exit 1
fi

printf '%s\n' "$trigger_text" | tee "$output_file"
echo "Saved next-step trigger to ${output_file}"
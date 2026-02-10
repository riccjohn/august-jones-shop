#!/bin/bash
# .claude/hooks/block-env-files.sh
# Prevents Claude from reading .env files (except .env.example)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Allow reading .env.example
if [[ "$FILE_PATH" == *".env.example"* ]]; then
  exit 0
fi

# Block reading any other .env files
if [[ "$FILE_PATH" == *".env"* ]]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Reading .env files is blocked to prevent accidental exposure of secrets. Use .env.example instead for reference."
    }
  }'
  exit 0
fi

# Allow all other files
exit 0

#!/bin/bash
# Runs Biome lint on JS/TS files after Claude writes or edits them

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

if [[ "$FILE_PATH" =~ \.(js|mjs|ts|tsx|jsx)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR" && pnpm exec biome check --write "$FILE_PATH" 2>&1
fi

exit 0

#!/usr/bin/env bash
set -euo pipefail

# Node Feature provides a user-writable global npm prefix on PATH.
# Bound retries so an offline registry does not delay startup indefinitely.
if npm install --global @openai/codex@latest --no-audit --no-fund \
    --fetch-retries=1 --fetch-timeout=30000; then
  codex --version
elif command -v codex >/dev/null 2>&1; then
  echo "WARNING: Codex update failed; using the installed version." >&2
  codex --version
else
  echo "ERROR: Codex installation failed. Retry: bash .devcontainer/update-codex.sh" >&2
  exit 1
fi

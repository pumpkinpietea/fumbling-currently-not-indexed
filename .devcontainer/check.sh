#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
git --version
node --version
npm --version
codex --version
gh --version
gcloud --version
./node_modules/.bin/firebase --version
npm run check:ci

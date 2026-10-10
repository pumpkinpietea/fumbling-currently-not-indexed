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
hugo version
# Verify the actual site without modifying public/.
check_dir="$(mktemp -d)"
trap 'rm -rf "$check_dir"' EXIT
hugo --minify --destination "$check_dir/public" --cacheDir "$check_dir/cache"
test -s "$check_dir/public/index.html"
test -s "$check_dir/public/jp/index.html"

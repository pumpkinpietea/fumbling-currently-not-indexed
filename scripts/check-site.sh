#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
hugo version
check_dir="$(mktemp -d)"
trap 'rm -rf "$check_dir"' EXIT
hugo --minify --destination "$check_dir/public" --cacheDir "$check_dir/cache"
test -s "$check_dir/public/index.html"
test -s "$check_dir/public/jp/index.html"
node scripts/check-built-site.cjs "$check_dir/public"

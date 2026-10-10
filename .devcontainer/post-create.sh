#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Named volumes are initially owned by root. Keep credentials across rebuilds.
for config_dir in "$HOME/.config/gh" "$HOME/.config/gcloud" "$HOME/.config/configstore" "$HOME/.codex"; do
  sudo mkdir -p "$config_dir"
  sudo chown "$(id -u):$(id -g)" "$config_dir"
done

bash .devcontainer/update-codex.sh

git submodule sync --recursive
git submodule update --init --recursive
npm ci --no-audit --no-fund
npm run check

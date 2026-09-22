#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
hooks_dir="$repo_root/scripts/hooks"

chmod +x "$hooks_dir"/pre-push
git -C "$repo_root" config core.hooksPath scripts/hooks

echo "Installed git hooks path: scripts/hooks"
echo "Enabled hooks:"
echo "  - pre-push: run 'cd apps/extension && tsc --noEmit' when changes include apps/extension/**"

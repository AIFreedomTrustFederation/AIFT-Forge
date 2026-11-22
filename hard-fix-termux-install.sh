#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Run in the checkout containing this script, including when invoked by full path.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
root=$(git rev-parse --show-toplevel)
[[ "$(pwd -P)" == "$(cd "$root" && pwd -P)" ]] || exit 1

# Older repairs rewrote the root manifest and deleted both tracked lockfiles.
# Use the committed profile for this checkout. Leave the Git index intact.
profile=(package.json package-lock.json pnpm-lock.yaml)
revision=$(git rev-parse HEAD)
if [[ -e npm-shrinkwrap.json || -L npm-shrinkwrap.json ]]; then
  echo 'npm-shrinkwrap.json takes precedence over package-lock.json. Resolve it before repair.' >&2
  exit 1
fi
if ! git diff --cached --quiet "$revision" -- "${profile[@]}"; then
  echo 'Resolve staged profile changes before restoring the committed Termux profile.' >&2
  exit 1
fi
changed=()
for file in "${profile[@]}"; do
  git cat-file -e "$revision:$file"
  if ! git diff --quiet "$revision" -- "$file"; then
    changed+=("$file")
  fi
done
if (( ${#changed[@]} )); then
  backups="$(git rev-parse --absolute-git-dir)/termux-profile-backups"
  mkdir -p -- "$backups"
  backup=$(mktemp -d "$backups/repair-XXXXXXXX")
  echo "Saving local profile changes to $backup"
  for file in "${changed[@]}"; do
    if [[ -f $file || -L $file ]]; then
      cp -P -- "$file" "$backup/$file"
    elif [[ -e $file ]]; then
      echo "Expected a file at $file. Resolve it before repair." >&2
      exit 1
    fi
  done
  git restore --source="$revision" --worktree -- "${changed[@]}"
fi

npm ci --ignore-scripts --no-workspaces
bash scripts/aift-platform-pipeline.sh

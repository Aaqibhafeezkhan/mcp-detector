#!/usr/bin/env bash
# One-time repository setup using the GitHub CLI (https://cli.github.com), which must be installed and logged in
# (`gh auth login`). Safe to re-run: labels are updated in place and issues are skipped if one with the same title exists.
#
#   bash scripts/setup-github.sh labels   # create/update the labels from .github/labels.yml
#   bash scripts/setup-github.sh issues   # open the good-first-issue drafts from .github/good-first-issues/
#   bash scripts/setup-github.sh all      # both
#
# Run it from the repository root. It only talks to the repository `gh` resolves from this folder's git remote.
set -euo pipefail

cd "$(dirname "$0")/.."

command -v gh >/dev/null 2>&1 || { echo "The GitHub CLI (gh) is not installed: https://cli.github.com"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login"; exit 1; }

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "Repository: $REPO"

labels() {
  echo "Creating/updating labels..."
  local name="" color="" desc=""
  # Tiny parser for the flat list in .github/labels.yml
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "- name: "*)
        if [ -n "$name" ]; then gh label create "$name" --color "$color" --description "$desc" --force >/dev/null && echo "  ✓ $name"; fi
        name="${line#- name: }"; color=""; desc="" ;;
      "  color: "*) color="${line#  color: }"; color="${color//\"/}" ;;
      "  description: "*) desc="${line#  description: }" ;;
    esac
  done < .github/labels.yml
  if [ -n "$name" ]; then gh label create "$name" --color "$color" --description "$desc" --force >/dev/null && echo "  ✓ $name"; fi
}

issues() {
  echo "Opening good-first-issue drafts..."
  for f in .github/good-first-issues/*.md; do
    title="$(sed -n '1s/^title: //p' "$f")"
    labels="$(sed -n '2s/^labels: //p' "$f")"
    if [ -z "$title" ]; then echo "  ! skipped $f (no title line)"; continue; fi
    if gh issue list --state all --search "in:title \"$title\"" --json title -q '.[].title' | grep -Fxq "$title"; then
      echo "  = already exists: $title"; continue
    fi
    body="$(mktemp)"; tail -n +3 "$f" > "$body"
    gh issue create --title "$title" --label "$labels" --body-file "$body" >/dev/null
    rm -f "$body"
    echo "  ✓ $title"
  done
}

case "${1:-all}" in
  labels) labels ;;
  issues) issues ;;
  all) labels; issues ;;
  *) echo "usage: bash scripts/setup-github.sh [labels|issues|all]"; exit 1 ;;
esac
echo "Done."

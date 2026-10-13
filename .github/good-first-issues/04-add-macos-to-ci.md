title: Add macOS to the CI matrix and fix whatever it finds
labels: good first issue, help wanted, platform

## Background

CI (`.github/workflows/ci.yml`) runs on Ubuntu and Windows. The project's launcher, file-path handling and the stdio server tests have never run on macOS in CI.

## What to do

1. Add `macos-latest` to the OS matrix in `.github/workflows/ci.yml`.
2. Run the workflow and read the failures. Likely suspects: path handling in `tests/protocol/github-action.test.ts`, the `dogfood` job, `start-app.command`, and temp-directory symlinks (`/var` → `/private/var`).
3. Fix what is OS-specific, in the code if it is a real bug, in the test if it only assumes Linux or Windows.

## Done when

- CI is green on Ubuntu, Windows and macOS.
- Each fix has a short note in the pull request saying what was OS-specific.

## Hints

- If a test is genuinely not applicable on an OS, skip it with `describe.skipIf(...)` and a comment saying why, rather than deleting it.

# Releasing MCP Detector

A checklist for the first public release (v0.1.0) and for every release after it.
Items marked **you** need an account, a decision or a credential that only the maintainer has.

## 0. Already verified (re-run before each release)

```bash
npm ci
npm run typecheck
npm test                 # unit, corpus, CLI end-to-end, HTTP, dashboard, GitHub Action step
npm run build
npm run docs:rules && git diff --exit-code docs/rules.md
```

- [x] Clean typecheck, build and test suite (247 tests at the time of writing).
- [x] **Packed install works.** `npm pack`, install the tarball into an empty project, then `npx mcp-detector --version`, `scan` (clean server exits 0, vulnerable server exits 1 with `--fail-on high`) and `import("mcp-detector")` all work. The tarball has 118 files and no source maps, source or tests.
- [x] Real servers scanned: the official `everything` and `filesystem` servers and 8 remote servers from the registry, with the false positives that turned up fixed and covered by regression tests.
- [x] The GitHub Action's `scan` step script is executed locally by a test (pass, fail, outputs, summary, injection attempt).
- [x] The npm name `mcp-detector` was **unclaimed** on 2026-10-07.

## 1. Decisions and setup (you)

- [ ] **Claim the npm name now** (it can be taken any day). Log in (`npm login`, with 2FA) and either publish 0.1.0 or `npm publish --dry-run` to confirm access. Consider the `@your-scope/mcp-detector` fallback if the name is gone.
- [ ] **Create the GitHub repository** and choose the owner. The docs use `adebayomoses/mcp-detector`. **Rename the GitHub repo from `MCP-Doctor` to `mcp-detector`** (Settings → General → Repository name; GitHub redirects the old URL). Then check these places still match:
  `README.md`, `docs/integrations.md`, `action.yml` usage examples (`uses: adebayomoses/mcp-detector@v1`), `CHANGELOG.md`.
- [x] `package.json` has `repository`, `homepage` and `bugs` (npm provenance requires `repository.url` to match the repo that publishes). **Still yours to add:** `"author": "Your Name <you@example.com>"`. It is left out on purpose because it would publish your name and email.
- [ ] **License holder.** `LICENSE` says "MCP Detector contributors" (MIT). Change it if you want your name or organisation there.
- [ ] **Security contact.** `SECURITY.md` and `CODE_OF_CONDUCT.md` point to GitHub's private vulnerability reporting. Enable it (Settings → Code security → Private vulnerability reporting) and add a contact address for conduct reports.
- [ ] **npm token.** Create an automation token (or configure npm trusted publishing) and add it to the repository as the `NPM_TOKEN` secret.
- [ ] **Branch protection** on `main`: require the CI workflow to pass.

## 1b. Launch sequence (do these in order)

Everything that could be prepared without your accounts is done: single name, `action.yml` at the root, publish dry-run passing, demo animation, release notes, issue templates, labels and good-first-issue drafts.

1. **Rename the repo** on GitHub to `mcp-detector` (Settings → General → Repository name), then point your local copy at it:
   `git remote set-url origin https://github.com/adebayomoses/mcp-detector.git`
2. **Mark the Mac launcher executable** (so a downloaded ZIP runs it):
   `git update-index --add --chmod=+x start-app.command`
3. **Commit and push**, then watch the Actions tab until CI is green on Ubuntu and Windows. Fix anything it finds before going further.
4. **Create the labels and good-first issues** (needs the GitHub CLI, `gh auth login` first):
   `bash scripts/setup-github.sh all`
5. **Set up npm.** Create an automation token and add it as the `NPM_TOKEN` repository secret. To claim the name immediately instead, run `npm login` then `npm publish --access public` (the publish gate runs typecheck, all tests and the build).
6. **Add your `author`** to `package.json`, and set the release date in `CHANGELOG.md`.
7. **Tag the release.** `git tag v0.1.0 && git push origin v0.1.0`. The Release workflow publishes to npm with provenance, creates the GitHub release from `docs/release-notes/v0.1.0.md`, and moves the `v1` tag.
8. **List the Action on the Marketplace.** Repository → Releases → edit the v0.1.0 release → tick *Publish this Action to the GitHub Marketplace* (you must accept the Marketplace agreement and have 2FA on). The action name in `action.yml` ("MCP Detector") must be unique on the Marketplace; change `name:` there if it is taken.
9. **Verify as a stranger** (section 5 below), then follow the announcement plan.

## 2. Pre-release (first push)

- [ ] The repository already has a local commit ("phase 1 and 2"); phases 3 and 4 are uncommitted. Review `git status`, commit, and push.
- [ ] **CI is green on Linux and Windows, Node 22 and 24.** This is the first time the suite runs outside the author's Windows machine. Likely trouble spots: path handling in `tests/protocol/github-action.test.ts` (it uses Git Bash on Windows), the `dogfood` job, and the stdio fixtures. macOS is not in the matrix; add `macos-latest` if you want it.
- [ ] Fix anything CI finds before tagging. Do not tag with a red build.
- [ ] Update `CHANGELOG.md`: change "0.1.0 - Unreleased" to the release date.
- [ ] Skim the README rendering on GitHub (the sample output block, tables, relative links into `docs/`).

## 2b. Make the beginner path work for real people

The README leads with a no-code path (`docs/for-beginners.md`, `start-app.bat`, `start-app.command`). Before announcing:

- [ ] **Mark the Mac launcher executable in git**, otherwise a ZIP downloaded from GitHub opens it as a text file instead of running it:
  `git update-index --chmod=+x start-app.command` then commit. (Windows cannot set this bit on disk, so it has to be recorded in git.)
- [ ] **Try it on a clean Mac** (or ask someone to). The launcher logic is tested under bash on Windows, never on macOS itself. Check the "unidentified developer" prompt matches the wording in `docs/for-beginners.md`.
- [ ] **Try the Windows path on a machine without Node.js** and with an old Node.js to see the guidance messages, and note the exact SmartScreen wording.
- [ ] Download the ZIP from GitHub (not your working folder) and follow `docs/for-beginners.md` as a stranger would. Fix anything unclear.
- [ ] Refresh the screenshots in `docs/images/` if the app's look changes.
- [ ] **When the package is on npm:** remove the "Not on npm yet" notes in `README.md` and `docs/getting-started.md`, and make `npx mcp-detector` the first suggestion for developers.

## 3. Broaden the false-positive check (recommended before announcing)

Detection is heuristic; the only evidence so far is ~12 real servers. Before telling people to put `--fail-on high` in CI, scan more:

```bash
mcp-detector scan-all --registry --limit 100 --concurrency 2 --format markdown -o registry-scan.md
```

Read the high and critical findings and look for ones that are wrong. For each false positive: add the tool text to `tests/security/corpus.ts` (benign) or `tests/security/capability-regressions.test.ts`, fix the rule, and re-run the suite. Registry scans are passive and remote-only; be considerate (see `docs/batch-and-registry.md`).

## 4. Release

```bash
# 1. bump the version in package.json (and CHANGELOG), commit
npm version 0.1.0 --no-git-tag-version     # or edit by hand
git commit -am "Release v0.1.0"

# 2. tag and push; the Release workflow does the rest
git tag v0.1.0
git push origin main v0.1.0
```

The workflow (`.github/workflows/release.yml`) checks the tag matches `package.json`, runs typecheck, tests, build and the docs check, publishes to npm with provenance, creates the GitHub release with generated notes, and moves the floating `v1` tag that `uses: adebayomoses/mcp-detector@v1` refers to.

To publish by hand instead: `npm publish --access public` (the `prepack`/`prepublishOnly` scripts build and test first).

## 5. Verify the release

- [ ] `npx mcp-detector@latest --version` prints the new version, from a machine that has never seen the repo.
- [ ] `npx mcp-detector@latest scan -- npx -y @modelcontextprotocol/server-everything` works end to end.
- [ ] The GitHub Action runs in a throwaway repository (this has never been run on GitHub): use the example in `docs/integrations.md`, check the job summary, the `score` output, and that a high finding fails the build.
- [ ] The npm page shows the README, the provenance badge and the right repository link.

## 6. After release

- [ ] Tell people what it is and is not. Use the README's wording: an **engineering signal, not a security certification**; findings are heuristic indicators.
- [ ] Publish a scoreboard only if you are prepared to handle disputes (see "Publishing a scoreboard responsibly" in `docs/batch-and-registry.md`). A suitable setup is `scan-all --registry --site public/` in a scheduled workflow that deploys `public/` to GitHub Pages.
- [ ] Watch issues for false positives: they are the most valuable feedback. Each fix should add a corpus sample.
- [ ] Add repository topics: `mcp`, `model-context-protocol`, `security`, `ai-agents`, `developer-tools`, `cli`, `github-actions`.

## Rollback

- Published a bad version: `npm deprecate mcp-detector@0.1.0 "use 0.1.1"`, then publish the fix. `npm unpublish` is only allowed for 72 hours and breaks anyone who installed it, so prefer deprecating.
- Bad `v1` Action tag: re-point it (`git tag -f v1 <good-sha> && git push -f origin v1`).

## Versioning

Semantic versioning. Rule IDs are stable forever (never reused or renumbered). A new built-in rule is a minor release because it can change scores and CI results; say so in the changelog. Changing a rule's default severity is also a minor release at least.

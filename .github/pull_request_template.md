## What and why

<!-- One or two sentences. Link the issue this closes: "Closes #123". -->

## Type of change

- [ ] New detection rule (YAML community rule or built-in)
- [ ] Fix for a false positive or a missed detection
- [ ] Bug fix
- [ ] Feature
- [ ] Docs / tests only

## Checklist

- [ ] `npm run typecheck` and `npm test` pass
- [ ] Added or updated tests. For a rule or a false-positive fix: at least one text it **must** flag and one near-miss it must **not** (`tests/security/corpus.ts` is the place)
- [ ] If rules changed: ran `npm run docs:rules` and committed `docs/rules.md`
- [ ] User-facing change: added a line to `CHANGELOG.md`
- [ ] No secrets, tokens or private URLs in code, tests or screenshots

## Notes for the reviewer

<!-- Anything unusual: trade-offs, things you were unsure about, how you tested it by hand. -->

title: Detect more secret formats (SendGrid, Twilio, npm, Hugging Face, Slack webhooks)
labels: good first issue, help wanted, rule proposal

## Background

Rule **MCP-006 (Secret exposure)** looks for credentials in tool descriptions, schema defaults/examples, server instructions, tool output and stderr. It recognises AWS, GitHub, Slack, Google, Stripe, OpenAI/Anthropic-style keys, JWTs, private keys, credentials in URLs and generic `password = …` assignments. Common formats are still missing.

## What to do

1. Open `src/detectors/security/patterns.ts` and add entries to `SECRET_PATTERNS` for formats you know well, for example:
   - SendGrid (`SG.` + two base64url parts)
   - Twilio (`SK` + 32 hex, and `AC` account SIDs)
   - npm tokens (`npm_` + 36 characters)
   - Hugging Face tokens (`hf_` + 34+ characters)
   - Slack incoming webhooks (`https://hooks.slack.com/services/T…/B…/…`)
2. For each one add a sample to `tests/security/security-rules.test.ts` that **must** be flagged, **and** a near-miss that must not (for example a placeholder like `SG.your-key-here`).
3. Evidence must stay redacted: check that the full token never appears in a finding (there is an existing test for this).

## Done when

- `npm test` passes, including your new cases.
- The new formats are flagged and placeholders are not.

## Hints

- Use realistic **fake** values you generate yourself. Never commit a real credential.
- Keep patterns anchored with `\b` so they do not match inside longer identifiers.
- Run `npm run dev -- rules MCP-006` to see how the rule is documented.

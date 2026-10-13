title: SARIF output (--format sarif) for GitHub code scanning
labels: help wanted, enhancement

## Background

GitHub's code scanning shows findings from tools that emit **SARIF**. Supporting it would put MCP Detector's findings in the repository's Security tab and on pull requests, with no extra setup for people already using GitHub Actions.

## What to do

1. Add a `sarif` renderer in `src/reporting/` (alongside `report-generator.ts`) that maps a `ScanResult` to SARIF 2.1.0:
   - one `rule` per MCP rule ID (`id`, `name`, `shortDescription`, `fullDescription` = why, `help` = recommendation, default severity level);
   - one `result` per finding (`ruleId`, `level`, `message`, and the tool name as a logical location).
2. Accept `--format sarif` in `validateFormat` and in the `scan` / `report` commands.
3. Add an `upload-sarif` example to `docs/integrations.md`.
4. Tests: output validates structurally (version, `runs[0].tool.driver.rules`, results reference known rules), and severities map sensibly (critical/high → error, medium → warning, low/info → note).

## Done when

- `mcp-detector scan --format sarif -- <server>` produces a file GitHub accepts.
- Tests and docs are included.

## Notes

- There is no source file for an MCP server finding, so locations will be logical (the tool) rather than file/line. Please keep that honest: do not invent file paths.

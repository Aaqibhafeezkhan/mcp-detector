title: Friendlier error messages for Python servers (uvx, python, pip)
labels: good first issue, help wanted, enhancement

## Background

When a scan cannot connect, `explainConnectError` in `src/core/explain.ts` turns the raw error into plain language ("The program 'x' was not found", "The server crashed because a file or package is missing"). It is shown in the web app and appended to finding MCP-001.

Its hints are Node-centred. Many MCP servers are Python, started with `uvx`, `uv run`, `python -m`, or `pipx`, and the failures look different.

## What to do

Add cases (with tests in `tests/ui/ui-server.test.ts`, "plain-language error explanations") for, at least:

1. `uvx` / `uv` / `python` / `pipx` **not installed**, with a hint to install it (and where).
2. A Python server crashing with `ModuleNotFoundError` or `No module named …`, with a hint to install the package.
3. A **Python version** that is too old (stderr contains `requires-python` or `Python 3.x is not supported`).
4. A server that **prints to stdout** before the handshake (JSON parse errors such as `Unexpected token` / `invalid JSON`). The usual cause is a `print()` or logging to stdout; the fix is to log to stderr.

## Done when

- Each case has a test that feeds a realistic raw error and stderr and checks the title and hint.
- Hints are short, say what to do, and avoid jargon.

## Hints

- Real error text is the best input. If you have a Python MCP server handy, break it on purpose and paste what you see (remove personal paths).
- Keep the order of checks in mind: the more specific cases must come before the generic ones.

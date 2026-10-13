title: Accessibility review of the web app (keyboard, screen reader, contrast)
labels: good first issue, help wanted, enhancement

## Background

The web app (`mcp-detector ui`, source in `src/ui/page.ts`) is the front door for people who are not technical. It was built with labels, tab roles and focus styles, but it has not been audited with real assistive technology.

## What to do

Try the app using only the keyboard, then with a screen reader (NVDA, VoiceOver or Narrator), and check:

1. Can every control be reached and used with the keyboard? Do the tabs support arrow keys?
2. After starting a scan, is the progress and the result announced? Where does focus go?
3. Do error messages (`role="alert"`) get read out?
4. Colour contrast in light and dark mode (score pills, muted text, links).
5. Does the page work at 200% zoom and at a narrow phone width?

## Done when

- A pull request fixes what you found, or an issue lists it with steps to reproduce.
- Behaviour you change is covered by a test in `tests/ui/` where practical.

## Hints

- The report itself is shown in a sandboxed `<iframe>`. Keep it that way for security; improve it by changing the generated HTML in `src/reporting/html.ts`.

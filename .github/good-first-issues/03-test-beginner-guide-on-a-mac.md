title: Test the beginner guide and start-app.command on a real Mac
labels: good first issue, help wanted, documentation, platform

## Background

`docs/for-beginners.md` and the double-click launcher `start-app.command` are meant for people who have never used a terminal. The launcher logic has been tested under bash on Windows, but **never on macOS**. The wording of the macOS security prompts in the guide is written from general knowledge, not from a real machine.

## What to do

On a Mac (ideally one that has never run this project), follow `docs/for-beginners.md` exactly as a newcomer would, starting from "Download ZIP" on GitHub:

1. Does double-clicking `start-app.command` open in Terminal and run, or does it open in a text editor?
2. What exactly does macOS say the first time (the "unidentified developer" box)? Does "right-click → Open" work as the guide says?
3. Does the first-time setup finish, and does the browser open the app?
4. Does `bash start-app.command` (the fallback in the guide) work?
5. Anything confusing, missing or wrong in the guide?

## Done when

- A pull request corrects `docs/for-beginners.md` to match what you saw, ideally with real screenshots in `docs/images/`.
- Any launcher bug is reported (or fixed) with the exact error text.

## Notes

- If the file opens as text instead of running, that is the missing executable bit in git (`git update-index --chmod=+x start-app.command`). Please say so in your report.

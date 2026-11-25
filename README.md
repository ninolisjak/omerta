# Omertà

*Keep your mouth shut. Keep your city.*

The Angular game lives in [`game/`](game/). The original PDF is kept unchanged beside this file. An updated, editable design document lives in [`game/docs/game-design.md`](game/docs/game-design.md).

## Start playing

In a terminal in this folder:

```powershell
cd game
npm.cmd install
npm.cmd start
```

Open **http://localhost:4200**. On Windows PowerShell, `npm.cmd` works even when execution policy blocks `npm.ps1`. On macOS/Linux, use `npm`.

Start with the [learning guide](game/docs/00-start-here.md). Each chapter points to the actual game code and gives you a small exercise.

Follow the [development phases](game/docs/development-phases.md) to build the rest of the game one milestone at a time. Phases 1 and 2 are implemented: separate Angular feature components and solo Family progression. The next phase is backend setup and accounts.

This is a playable **solo prototype** with a dark animated pixel HUD: fronts, timed operations, recruitment, jobs, laundering, Heat, police checks, reports, browser saves, and a local 21-day round. Found your own Family, earn XP and levels, complete contracts, contribute to its treasury, and buy headquarters upgrades. Real accounts, shared Family membership, online combat, shared territory, and rankings are future server work.

# Omertà

_Keep your mouth shut. Keep your city._

Omertà is a noir mafia strategy game for your browser. It's set in a rain-soaked 1930s port city, and you start with one block and a handful of loyal men. Build fronts, launder your money, run rackets, and watch the Heat. Go it alone as an Independent, or join a Family and take on the rival faction for control of the city. Every round ends with one question: who owns the night?

The description above is the complete game vision. **v0.2 implements the solo foundation and founder-only Family progression.** Multiplayer requires the server described in the [roadmap](docs/05-the-road-to-multiplayer.md).

## Run

Requires Node.js 22.12+ (Node 22 LTS recommended) and npm. Dependencies are pinned by `package-lock.json`.

```powershell
npm.cmd ci
npm.cmd start
```

Open http://localhost:4200. Use `npm` in place of `npm.cmd` on macOS/Linux. Stop the server with Ctrl+C.

```powershell
npm.cmd test       # Pure TypeScript game-rule tests
npm.cmd run build # Production files in dist/
```

Browser verification uses Playwright with an installed Chromium browser:

```powershell
npx.cmd playwright install chromium
node scripts/browser-smoke.mjs
```

Start the dev server before running the smoke script. To reuse an existing Chromium binary, set `CHROMIUM_PATH` to its executable path. Screenshots go to ignored `.local/screenshots/`.

## First session

1. Open **Your fronts** and establish **The Velvet Room** ($400, 25 seconds).
2. Establish **Bellini & Sons** ($350, 20 seconds), then launder $400 dirty into $340 clean.
3. Open **Rackets & jobs**, send a runner on **A friendly reminder**, and read the result in Street reports.
4. Establish **Eight Ball Social** to recruit more crew, then hire a smuggler to open the docks job.
5. Watch the Heat. Lay low, launder, or build the office to arrange bribes.

Recruiting is now a real throughput upgrade. In **Rackets & jobs**, choose how many teams to send and optional enforcer cover. One collection team earns $300; four earn $1,200 plus scaled Respect and Family XP. Drivers improve travel coverage, and up to three deployments can run together. See [crew planning](docs/10-crew-and-job-planning.md) for the rules and tradeoffs.

Timers are intentionally short for learning. A round lasts 21 real days. Offline progress uses finish timestamps and stops at round end. At 70+ Heat a scheduled police check can seize cash and arrest one idle enforcer. Every third completed job earns a Favor.

## Learn

The [development phases](docs/development-phases.md) are the working plan for the rest of the project, with checklists and completion criteria. Phases 0, 1, and 2 are implemented. Start with [feature components](docs/07-feature-components.md), [Family progression](docs/08-family-progression.md), and [dark mode and feedback](docs/09-dark-mode-and-game-feedback.md) for the latest changes.

Read [Start here](docs/00-start-here.md), then follow the numbered chapters. The in-game **Learning the ropes?** button gives a short interactive introduction.

```text
src/app/
  app.component.*       Application shell, navigation, overview, dialogs
  fronts/, crew/        Front management and recruitment screens
  rackets/, reports/    Jobs, Heat, and ledger screens
  family/               Family founding, progression, treasury, contracts
  city/                 Map artwork, district selection, zoom
  operations/           Queue and countdown presentation
  game/
    game.model.ts       TypeScript vocabulary
    game.config.ts      Prices, durations, roles, rewards
    game.engine.ts      Framework-independent rules and time resolution
    family.config.ts    Levels, contract rewards, headquarters upgrades
    family.engine.ts    Family validation, progression, and commands
    game.persistence.ts Save validation and v1-to-v2 migration
    game.store.ts       Angular signals, commands, browser persistence
  ui/                   SVG icons and formatting functions
tests/                  Rule tests
docs/                   Lessons, design document, and roadmap
```

## Prototype boundaries

Progress is specific to this browser and device. Clearing site data deletes it. Client data and the system clock can be edited; this is **not a cheat-resistant online economy**. Use one tab for a saved game; concurrent tab reconciliation is not implemented. You can found a solo Family and grind its progression. Login, cloud sync, PvP, chat, online leaderboards, and real multi-account Family membership are not implemented yet. Jobs succeed deterministically; production combat and police randomness need server decisions.

Settings includes an explicit confirmation before replacing a round. The interface respects reduced motion, uses keyboard-accessible controls, and includes optional procedural rain audio.

The current UI uses a dark monochrome handheld-RPG style with readable text, a first-night checklist, Family XP bars, completion rewards, and a top-down pixel map with decorative rain, pedestrians, traffic, smoke, and window light. Motion respects Settings and the system's reduced-motion preference. Read [Chapter 9](docs/09-dark-mode-and-game-feedback.md) to learn how it works.

The current generated map is stored in [`public/art/blackwater-pixel.png`](public/art/blackwater-pixel.png). Its tool and production prompt are documented in [assets.md](docs/assets.md). The original painted map is retained as an earlier asset.

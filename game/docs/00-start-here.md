# Build Omertà, learn Angular

This project is a real game prototype and a small codebase you can explore. You do not need to understand everything before you change something.

## The idea

You own a block in Blackwater. Fronts create income. Jobs create money and Heat. Laundering turns dirty money into spendable clean money. Crew lets you take different jobs. Time connects all of it.

The HUD uses a black-and-white handheld-RPG style: a dark menu, a clear resource ledger, a top-down pixel-art neighborhood, and framed information panels. Body text is 15–16 pixels, controls are larger, and no interface text is smaller than 12 pixels. On a phone, navigation becomes a drawer and panels stack instead of shrinking the text.

## Your learning route

For what to build next and how we will track progress, use the [development phases](development-phases.md). Lesson numbers explain concepts; phase numbers track delivery milestones.

| Chapter                                                     | What you will learn                                | Main file                     |
| ----------------------------------------------------------- | -------------------------------------------------- | ----------------------------- |
| [1. Follow one click](01-your-first-angular-feature.md)     | TypeScript types, a command, and a rule            | `game.engine.ts`              |
| [2. Signals and components](02-signals-and-components.md)   | Binding, computed values, input and output         | `game.store.ts`               |
| [3. Timers and game rules](03-timers-and-game-rules.md)     | Timestamps, queues, offline progress, tests        | `game.engine.ts`              |
| [4. Saving and the HUD](04-saving-and-the-hud.md)           | Browser persistence, responsive CSS, accessibility | `game.store.ts`, `styles.css` |
| [5. The road to multiplayer](05-the-road-to-multiplayer.md) | Server authority and a staged backlog              | Future backend                |

Continue with [6. A readable pixel-art interface](06-readable-pixel-ui.md) for the redesign's typography, grayscale palette, pixel rendering, and responsive layout.

The latest completed work is explained in [7. Feature components](07-feature-components.md), [8. Family progression](08-family-progression.md), and [9. Dark mode and game feedback](09-dark-mode-and-game-feedback.md). You can now found and grow a Family on your own. Its XP, treasury, contracts, and upgrades save alongside your personal game.

Read [the design document](game-design.md) for the complete game vision and the difference between the PDF’s planned MVP and this first playable build.

## The first ten minutes

Start the app with the commands in the README. Build the speakeasy, then the laundering front. Run a job while laundering: different queue categories can run together. Try constructing two fronts at once: the second action is disabled with an explanation. These are business rules, not just UI styling.

Open `src/app/game/game.config.ts`. Change the speakeasy's `cost` from `400` to `450`, save, and start a new round through Settings. Watch the UI display the new price. Then follow Chapter 1 to understand why the engine and screen agree.

## A few terms

- **Component:** a piece of screen with its own template and behavior.
- **Template:** HTML with Angular bindings and control flow.
- **Signal:** a changing value that tells Angular which displays depend on it.
- **Store:** the service that holds the current game and connects actions to rules.
- **Pure function:** a function that returns a result from its inputs without secretly changing the outside world.
- **Command:** a request such as “build this front,” rather than “set my balance to this amount.”

Make one small change, observe it, then read the next layer. The numbered chapters are written around this codebase, not around an imaginary tutorial app.

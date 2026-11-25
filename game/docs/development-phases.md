# Omertà development phases

This is the working implementation plan. The [design document](game-design.md) describes the full game; the [learning chapters](00-start-here.md) explain the code. Phase numbers here describe delivery milestones, not lesson numbers.

Phases 0, 1, and 2 are implemented. Phases 3–9 are planned. Work through one small feature at a time; completing this plan does not require implementing later phases immediately.

## How we will work

For each feature:

1. Explain the behavior and the part of Angular or the backend it teaches.
2. Implement a small, usable change.
3. Add or update a Markdown lesson with real file references and a short exercise.
4. Verify the affected behavior and let you try it.
5. Save a Git checkpoint when the feature is ready. Push when requested; keep the previous working version available.

Keep the monochrome, top-down pixel-art direction throughout. Readability and phone layouts are part of every feature, rather than a final cleanup task.

## Phase 0 — Playable local prototype

**Status: complete.**

- Angular app with the redesigned pixel-art HUD and district selection.
- Four resources, five upgradeable fronts, four crew roles, and three solo jobs.
- Construction, recruitment, laundering, income, offline progress, and queues.
- Heat, laying low, bribes, and deterministic police checks.
- Browser saves, reports, settings, rain ambience, and a local 21-day round.
- Learning notes, 13 game-rule tests, and responsive browser checks.

**Checkpoint:** original prototype on GitHub `main` at `4f81045`; pixel redesign committed locally at `6d93fce` on `feat/monochrome-pixel-ui`.

**Boundary:** this is a local simulation. It has no accounts, shared world, combat simulation, or trusted online economy.

## Phase 1 — Make the Angular project easy to learn

**Status: implemented and verified.** See [feature components](07-feature-components.md).

**Goal:** make the existing game easier to understand and extend before adding Family progression and a server.

- [x] Extract the fronts screen into its own standalone component.
- [x] Extract the crew, rackets, and reports screens in separate small steps.
- [x] Keep one shared store and one rules engine; avoid duplicating balances or rules between screens.
- [x] Add a short first-session checklist: open a speakeasy, open a laundering front, complete a job.
- [x] Explain component boundaries, inputs/outputs, injection, signals, and shared UI patterns in the learning notes.

**You learn:** how a real Angular application is organized and how a click reaches the game engine.

**Done when:** you can locate and edit an individual screen without searching a giant template, and the existing game, saves, and responsive checks still work.

**First task completed:** `FrontsComponent` is extracted and uses the shared store. Crew, rackets, reports, and Family screens also have their own components.

## Phase 2 — Create a Family and grind its progression

**Status: implemented and verified as a browser-local solo feature.** See [Family progression](08-family-progression.md).

**Goal:** let you found and grow a Family immediately after the Angular cleanup, using the existing solo loop. You can test the experience without waiting for accounts, PvP, or a group of other players.

- [x] Add a Family creation screen with a name and a simple pixel-style emblem choice. Founding does not erase personal progress.
- [x] Make the founder the Don. Show the real member count, starting at one; do not simulate other human members.
- [x] Add Family XP, levels, progress to the next level, and a contribution history.
- [x] Award configurable Family XP for eligible jobs completed after founding, exactly once per completion. Past jobs do not retroactively award XP.
- [x] Add Family contracts with objectives a founder can complete alone, such as finishing jobs or laundering a target amount, with clearly shown rewards.
- [x] Add a treasury: contribute clean money from personal funds, then spend treasury funds on level-gated Family headquarters upgrades. Contributions transfer money rather than creating it or awarding repeatable XP by moving it around.
- [x] Define a small, visible upgrade/unlock track so grinding changes what the Family can do. Keep requirements and rewards in configuration and balance them during testing.
- [x] Save Family state alongside the browser game and add a backward-compatible save migration so existing prototype progress survives the new fields.
- [x] Keep the Independent path playable. Define what happens to unclaimed rewards, treasury, and membership when leaving or disbanding; prevent re-founding from duplicating rewards.
- [x] Add a Markdown lesson covering optional state, derived progress bars, command validation, progression rules, and save migration.

**You learn:** how to extend the game model and build a persistent progression loop across multiple Angular screens.

**Done when:** you can create a Family on your own, run existing jobs, watch its XP increase, complete a Family contract, fund its treasury, unlock and buy an upgrade, and reload without losing either personal or Family progress. Existing saves load, and repeated completion/reward handling cannot duplicate XP or money.

**Boundary:** this phase is a browser-local Family progression prototype. Real invitations, multiple accounts, role enforcement between players, chat, shared defense, and joint combat come after the required server systems. All features in this phase must work with one member.

## Phase 3 — Backend, database, and accounts

**Goal:** give each player an identity and a durable place to save progress.

- [ ] Decide the backend path from the design doc: Spring Boot + Postgres or Supabase. This decision is still open.
- [ ] Set up the chosen backend locally, database migrations, and environment configuration.
- [ ] Add registration, login, logout, and session handling.
- [ ] Create a player record and initial game state once per account.
- [ ] Add persistent Family, membership, progression, treasury, and contribution records based on the Phase 2 model.
- [ ] Connect Angular to a protected endpoint that returns the signed-in player's snapshot.
- [ ] Explain requests/responses, database records, authentication, and loading/error states.

**You learn:** how Angular talks to an API and how an account connects to persisted data.

**Done when:** two accounts have separate saved games, signing back in restores the correct player, and one account cannot read another's private state.

**Boundary:** having an account and a database is not yet server authority. Competitive play waits for Phase 4.

## Phase 4 — Move personal and Family progression onto the server

**Goal:** make the server own the existing personal and Family game rules, membership, and time.

- [ ] Move one complete action first: build a front from Angular through validation, database changes, and the returned snapshot.
- [ ] Move upgrades, recruitment, jobs, laundering, bribes, and laying low behind the same command boundary.
- [ ] Move Family creation, XP attribution, contract rewards, donations, and upgrades onto transactional server commands; resolve membership at completion according to an explicit rule.
- [ ] Add real Family invitations, joining, leaving, and Don/capo/soldier permissions. Enforce membership and role checks on the server.
- [ ] Add a permission-checked Family activity feed and basic member communication.
- [ ] Have the server calculate prices, rewards, crew assignments, storage limits, and finish timestamps.
- [ ] Resolve income and offline progress using server time; give Angular a server-time offset for countdown displays.
- [ ] Make spending transactional and commands/completions idempotent, so retries and concurrent requests do not spend or award twice.
- [ ] Replace browser storage as the authority with account-backed state. Decide explicitly whether old prototype saves remain a separate demo or can be imported into a noncompetitive sandbox.
- [ ] Keep local Family progression in that same demo/import policy; never trust client-claimed XP, treasury balances, or unlocked upgrades in a competitive round.

**You learn:** validation, transactions, time-based state, race conditions, retries, and where trust belongs.

**Done when:** editing browser storage or changing the device clock cannot change server balances, two simultaneous spending requests cannot overdraw personal or Family funds, and progress survives signing in on another device. Two test accounts can join the same Family, contribute to the same progression, and see consistent balances and permissions.

## Phase 5 — Real solo targets, travel, and shipments

**Goal:** turn the fixed-reward jobs into a deeper solo strategy loop.

- [ ] Represent districts and NPC targets as data with coordinates and descriptions.
- [ ] Calculate travel time from distance and assigned crew; show outbound and returning operations.
- [ ] Add a documented NPC combat model with persisted outcomes, casualties, and battle reports.
- [ ] Add warehouse storage, goods, and shipments as separate operations.
- [ ] Replace deterministic police outcomes with server-generated, persisted raid decisions and protection rules.
- [ ] Make the map reflect relevant player/world state, such as established fronts and active destinations, rather than only fixed artwork markers.
- [ ] Extend Family contracts to the new NPC and shipment content while keeping founder-only progression viable.

**You learn:** world modeling, combat rules, scheduled events, reproducible tests, and presenting server state on a map.

**Done when:** a player can scout an NPC, assign a crew, watch it travel, receive a result and returning survivors, and arrange an independent goods shipment. Refreshing never rerolls an outcome.

**Boundary:** a data-driven strategy map does not require a walkable avatar. Pokémon-style character movement and collision are optional later work, not a hidden requirement of this phase.

## Phase 6 — Shared rounds and rankings

**Goal:** put players into the same season with a clear finish line.

- [ ] Replace per-browser round dates with shared server-controlled rounds.
- [ ] Associate player progress with the correct round and rules version.
- [ ] Add individual rankings, personal stats, and an activity feed that respects private information.
- [ ] Add Family progression rankings and specify which Family identity, membership, XP, treasury, and upgrade fields reset or persist between rounds. Keep archived results separate from active-round benefits.
- [ ] Finalize a round once, freeze scores, retain its history, and start the next round with fresh round-specific progress.

**You learn:** shared state, queries, ranking rules, and lifecycle transitions.

**Done when:** multiple accounts see the same deadline and consistent individual rankings; the end of a round cannot award twice or erase the previous round's results.

## Phase 7 — PvP and Family combat cooperation

**Goal:** let players compete directly using the server-backed travel and combat foundation.

- [ ] Add scouting, player targets, attacks, defense, and returning crews.
- [ ] Define protection for new players and limits on loot and repeated attacks.
- [ ] Resolve simultaneous arrivals safely and persist private battle reports for the correct participants.
- [ ] Add notifications and a useful attack/defense overview.
- [ ] Add Family shared defense, combat-based joint operations, and explicit tribute rules, building on the membership and treasury already implemented.
- [ ] Check group-operation permissions, crew reservations, costs, losses, and reward attribution so cooperative actions cannot duplicate units or payouts.

**You learn:** interactions between multiple players, conflict resolution, permissions, and fairness.

**Done when:** test accounts can attack, defend an ally, and complete a joint operation; resources and losses remain consistent, and reopening a report never repeats a battle or payout. Independents can still progress without joining a Family.

## Phase 8 — Factions and the fight for the city

**Goal:** deliver the game's city-control endgame.

- [ ] Finalize faction names, membership rules, bonuses, and configuration.
- [ ] Associate Families with a faction and keep the neutral Independent path clear.
- [ ] Add capture and defense rules for high-value districts such as the docks and City Hall.
- [ ] Add territory scoring, Family/faction rankings, and explicit victory and tie rules.
- [ ] Add and test rules intended to prevent an early leader from making the rest of the round pointless.

**You learn:** systems built on top of other systems, configurable rules, scoring, and strategic balance.

**Done when:** Families can contest districts, ownership changes appear on the map, and a shared round ends with consistent individual, Family, and faction results.

## Phase 9 — Playtest and prepare a release

**Goal:** make the implemented game reliable and understandable for real players.

- [ ] Run closed playtests and adjust income, costs, production timers, combat, Heat, and round pacing from feedback.
- [ ] Finish onboarding, accessibility, mobile interactions, and understandable loading/error states.
- [ ] Verify account isolation, abuse controls, command limits, deployment configuration, backups, and recovery.
- [ ] Exercise concurrent play and important round-boundary cases under realistic load.
- [ ] Set up operational visibility and a repeatable deployment process, then publish when requested.

**You learn:** debugging a running service, testing with users, production operations, and making evidence-based balance changes.

**Done when:** invited players can complete sessions without assistance, the core scenarios pass, saves and round results remain reliable, and deployment/recovery steps are documented.

## After the first release — Optional expansions

Cosmetic themes and building skins, a season pass without selling power, casino and funeral parlor fronts, corrupt cops and lawyers, named lieutenants, additional story contracts, and possibly a playable police faction.

Treat walkable pixel characters as a separate design decision if desired. The current art direction does not by itself change Omertà from a timer-based strategy game into a movement-driven RPG.

These are not blockers for the first complete game. Choose expansions after the core has been played and evaluated.

## Current next step

**Phase 3: choose the backend path, set up a local database, and add accounts.** The choice between Spring Boot + Postgres and Supabase remains open. You can play and evaluate the completed local Family loop before starting backend work.

# Omertà

_Keep your mouth shut. Keep your city._

Status: prototype v0.1. Adapted from **Noir Mafia Browser Game Prototype Design Doc.pdf**. The original PDF remains unchanged. This Markdown document is the editable design source going forward. The game title is decided: **Omertà**.

## Description

Omertà is a noir mafia strategy game for your browser. It's set in a rain-soaked 1930s port city, and you start with one block and a handful of loyal men. Build fronts, launder your money, run rackets, and watch the Heat. Go it alone as an independent, or join a Family and take on the rival faction for control of the city. Every round ends with one question: who owns the night?

**Store card / bio:** Build a criminal empire in a noir port city. Play solo or join a Family, and fight a rival faction for control of the city.

**One-liner:** Tribal Wars with a noir mafia soul.

The descriptions express the full vision. The implementation status is listed below; multiplayer is not present in v0.1.

## 1. Concept

A persistent, timer-based browser strategy game in the spirit of Tribal Wars and Travian, set in a rain-soaked 1930s port city. You are an up-and-coming crew boss. You build fronts, recruit crew, run rackets, launder money, and compete for districts while managing police attention. Blackwater is the current fictional city name.

## 2. Design pillars

1. Solo-first: a satisfying Independent path, with Families as an optional layer.
2. Greed versus safety: profitable actions create Heat and risk.
3. Noir identity: period typography, restrained colors, rain, jazz, docks, and back rooms.
4. Finishable rounds: a few weeks with clear winners, then a reset.
5. Server authority: production state and time belong to the server.

## 3. Goals

Create a portfolio-quality Angular project, learn through explained changes, and build a game real players want to revisit. Monetization may follow later without selling power. Deliver the solo core first and add shared systems in stages.

## 4. Setting and interface

A fictional port city: speakeasies, warehouses, corrupt officials, old neighborhoods, and constant rain. Stylized noir rather than graphic realism.

The redesigned HUD uses a command-desk layout: persistent navigation, a resource ledger, a spacious city map, an operations queue, and an intelligence column. Original isometric city art supplies atmosphere while controls remain readable. Mobile layouts stack panels and use a navigation drawer. Optional procedural rain audio ships in this prototype; a jazz soundtrack is later work.

## 5. Core loop

In a short visit, check completed operations, earn dirty money, launder a batch, upgrade a front, recruit, send a crew, assess Heat, and queue work before leaving. Construction, training, laundering, and travel take real time. Production durations will be longer than the 15–50 second learning timers.

## 6. Resources

| Resource    | Sources                                                     | Uses                                                     |
| ----------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Dirty money | Speakeasy income, jobs, rackets, future raids               | Laundering; exposed to police seizure and storage limits |
| Clean money | Laundering, future legitimate business income               | Construction, upgrades, crew, bribes                     |
| Respect     | Jobs, future victories and territory                        | Rank and future unlocks                                  |
| Favors      | Every third solo job in v0.1; future contracts and contacts | Bribes, future protection and Heat management            |

Starting prototype resources: $1,240 dirty, $2,450 clean, 12 Respect, 3 Favors. Initial Heat: 12.

## 7. Fronts and operations

| Front                     | Role                            | v0.1                                                    |
| ------------------------- | ------------------------------- | ------------------------------------------------------- |
| Safehouse                 | Storage and basic protection    | Starts level 1; dirty storage = 5,000 + 2,000 per level |
| Speakeasy                 | Dirty income                    | The Velvet Room; $90 per minute per level               |
| Tailor / laundering front | Dirty-to-clean conversion       | Bellini & Sons; 85% yield, −4 Heat per batch            |
| Recruitment hall          | Train crew                      | Eight Ball Social; higher levels shorten training       |
| Back-room office          | Influence and Heat reduction    | Unlocks bribes and improves passive Heat decay          |
| Warehouse                 | Goods and independent shipments | Planned                                                 |
| Casino                    | High income and high Heat       | Later                                                   |
| Funeral parlor            | Reduce raid losses              | Later                                                   |

The first five fronts can reach level 5. Construction is one at a time. Costs scale by 1.65 per existing level. Laundering starts at $400 per batch and adds $100 per extra front level.

## 8. Crew

| Role        | Purpose                                        | v0.1                                             |
| ----------- | ---------------------------------------------- | ------------------------------------------------ |
| Runner      | Collections and carrying money                 | Available                                        |
| Enforcer    | Combat and intimidation                        | Available                                        |
| Driver      | Faster travel                                  | Available; attaches automatically, −20% job time |
| Smuggler    | Contraband and route income                    | Available; needed for harbor job                 |
| Corrupt cop | Heat management, exposure risk                 | Later                                            |
| Lawyer      | Reduce arrest losses                           | Later                                            |
| Lieutenant  | Named, unique, levels and betrayal/arrest risk | Later                                            |

Start with 3 runners, 2 enforcers, and 1 driver. One recruit trains at a time. Assigned units are unavailable until their job finishes.

## 9. Heat

Jobs create Heat. Base decay is 1.5 per minute; office levels add 0.5 per minute each. Laundering removes 4, laying low removes 20 after 25 seconds, and a bribe removes 25 for $200 clean plus a Favor.

At 70+ Heat, a scheduled police check can seize 20% of dirty cash and arrest one idle enforcer, then reduce Heat by 30. Checks are deterministic in v0.1. Production will add server-controlled random raid outcomes, temporary front closures, broader arrests, and additional protection options. Police are NPCs at launch.

## 10. Solo path: the Independent

Everyone starts as a small crew boss. Independents keep all earnings, defend themselves, attract less attention, and focus on street rackets, NPC rivals, heists, and story contracts. The current label is Independent; alternatives remain an open naming decision.

The first playable jobs are a protection collection, a dockside shipment, and an NPC rival hit. They succeed deterministically and return assigned crew. Production solo goals include becoming the richest or most respected kingpin, selling services as a fixer, and founding a Family when established.

## 11. Families

Planned: Don/capo/soldier hierarchy, shared defense, territory control, joint heists, shared goals, and chat. Members pay tribute and gain protection, with the risk of being dragged into a war. Only Families hold high-value districts. The current UI explains these plans without offering fake membership.

## 12. Rival factions

Planned faction layer: **Old Guard** (tradition, tribute, loyalty; defensive and cohesion bonuses) versus **New Blood** (smuggling, modern methods; speed and income-route bonuses). These names remain provisional. Independents can remain neutral.

Families belong to a faction. Families compete internally while factions contest the city. Keep faction rules in configuration so bonuses and names can change without rewriting the game engine. Leave the model open to a future police faction without making it a launch requirement.

## 13. Rounds

Early: build your block and stay quiet. Midgame: expand and challenge nearby rivals. Late: contest docks, City Hall, and other valuable districts. A shared production round lasts a few weeks and ends with individual, Family, and faction rankings before the next round starts.

v0.1 runs a local 21-day round from first launch. Actions and income stop at its deadline. Final personal stats remain visible. A confirmed Settings action begins another local round. There is no shared calendar, automatic public reset, or online scoreboard yet.

## 14. Monetization

Later: cosmetic themes, outfits, building skins, and possibly a season pass. No sales of competitive power and no monetization changes to the core loop.

## 15. Technical approach

Frontend: Angular 21, standalone components, signals, strict TypeScript and templates. Configuration, pure rules, state/persistence, and UI are separate layers. The current browser save is a teaching implementation.

Backend choice remains open: Spring Boot + Postgres or Supabase. Production must calculate progress, outcomes, balances, and time on the server. Use finish timestamps and scheduled resolution for public events, not a global per-second simulation. Commands must be transactional and idempotent.

See [the server roadmap](05-the-road-to-multiplayer.md).

## 16. Planned MVP versus current build

| Feature                                                 | Status                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| One block, four resources, five fronts, four crew types | Implemented                                                          |
| Timed construction, training, jobs, laundering          | Implemented                                                          |
| Smuggling route                                         | Timed solo job implemented; separate goods/shipments planned         |
| Heat and police                                         | Deterministic prototype implemented; random server raids planned     |
| NPC solo farming                                        | Three deterministic job types implemented; combat simulation planned |
| City view, activity feed, local reports                 | Implemented                                                          |
| Persistence                                             | Browser-local implemented; server saves planned                      |
| Accounts and login                                      | Planned                                                              |
| World map, PvP, battle reports                          | Planned                                                              |
| Families, shared defense, factions, rankings            | Planned                                                              |

## 17. Build order

1. Solo foundation and learning documents: current milestone.
2. Accounts, authoritative server, database, concurrency checks.
3. World map, travel, shipments, battles, and persisted reports.
4. Shared round calendar, leaderboards, activity feed.
5. Families, defense, joint operations.
6. Factions and territory victory.
7. Cosmetics and optional later expansions.

## 18. Open questions

- Final name for the solo path: Independent, Racketeer, Wildcat, or Hustler?
- Final faction names, flavor, and bonuses?
- Backend choice: Spring Boot + Postgres or Supabase?
- Final production balance and timer lengths after playtesting?
- Should police ever become a playable faction?

The game-title question is resolved and removed. This is a fresh Angular project in `game/`, separate from any existing idle app.

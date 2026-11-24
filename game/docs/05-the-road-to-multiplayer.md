# 5. The road to multiplayer

The first milestone is the playable solo foundation. The PDF's full game is larger than this build. This chapter makes the remaining work explicit.

## Implemented now

- Angular standalone components, signals, strict templates, responsive noir HUD.
- One owned block, four resources, five fronts, four crew types.
- Timed construction, recruitment, solo jobs, and laundering.
- A timed smuggling job, with a driver speed bonus.
- Heat decay, laying low, bribes, scheduled deterministic police raids.
- Offline timestamp resolution, storage caps, local reports, browser saves.
- Local 21-day round closure, final stats, and confirmed manual restart.
- Rule tests, browser smoke checks, and learning notes.

## Before inviting competitive players

The server must own all balances, crew assignments, time, outcomes, and round boundaries. A disabled button and validated browser save cannot enforce an online economy.

The PDF proposes Spring Boot with Postgres or Supabase. That decision is intentionally still open. Spring Boot is a natural teaching path if you want to practice Java and explicit transaction handling. Either option must enforce the same authority and transaction rules.

The future command boundary could look like:

```text
POST /api/commands
{ commandId: "unique-id", type: "BUILD_FRONT", frontId: "speakeasy" }
```

The authenticated player comes from the server session. The client does not submit a price, a balance, a finish time, or a claimed winner. The server returns an authoritative snapshot and `serverNow` for display-clock adjustment.

## Transactions and retries

Inside one transaction, the server authenticates the player, locks the affected state, resolves due events, validates the command, deducts resources, and inserts the operation. Persist a command ID with a uniqueness constraint so retries cannot spend twice. Completion needs its own idempotency guard so competing workers cannot award a job twice.

Keep timestamps in UTC. Return ISO timestamps or epoch milliseconds consistently. Use a scheduled worker to resolve attacks and important public events. Ordinary income can be calculated lazily from timestamps when the player reads or acts.

## Data model to grow into

| Entity              | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| Player / account    | Identity, solo or Family path, faction field               |
| Round               | Shared start/end times, rules version, finalization status |
| Block / district    | Map ownership, position, strategic value                   |
| Front               | Type and level per owned block                             |
| Crew stack          | Unit type, total and assignment                            |
| Operation           | Category, payload, start/finish time, resolution state     |
| Resource ledger     | Auditable changes and idempotency key                      |
| Family / membership | Don, capos, soldiers, tribute and permissions              |
| Battle report       | Persisted participants, outcome, and losses                |

Keep faction definitions in configuration and references generic enough for a possible later police faction. Police remain an NPC system at launch.

## Suggested learning milestones

1. **Accounts and server saves.** Authentication, one authoritative player snapshot, command endpoint, database migrations, tests for concurrent spending and duplicate commands.
2. **World and travel.** Coordinate-based travel, separate shipments, NPC targets, combat resolution, casualties, battle reports. Replace deterministic solo outcomes with persisted server decisions.
3. **Shared rounds.** Shared calendar, individual rankings, round finalization once, a new round without erasing past history.
4. **Families.** Invitations, roles, shared defense, tribute, joint heists, and chat permissions.
5. **Faction territory.** Old Guard versus New Blood, territory scoring, comeback rules, high-value district ownership, Family and faction rankings.
6. **Balance and retention.** Real production durations, playtesting, onboarding, observability, accessibility audit, and abuse controls.
7. **Optional later content.** Cosmetics without power sales; casino, funeral parlor, corrupt cop, lawyer, lieutenants. Consider playable police only after the core proves itself.

Do not start by implementing every screen on this list. Take one authoritative action from Angular to the database and back, test it, then move the remaining solo commands behind the same interface.

## Try it

Sketch the request and response for training an enforcer. Identify which values must be calculated by the server. Then write down what should happen if two tabs send the request at the same time with only enough cash for one recruit.

# 8. Found a Family and grind its progression

Phase 2 is implemented as a browser-local solo feature. Open **The Families**, choose a name and emblem, and establish the Family. You become its single member and Don. Founding is free and preserves your personal fronts, crew, and balances.

## Your first Family session

1. Found your Family before sending the next job.
2. Complete **A friendly reminder** three times. Each collection earns 25 Family XP.
3. At 60 total XP, you reach level 2. Three collections give 75 XP.
4. Claim **Make an introduction**: +40 Family XP and $250 treasury money.
5. Buy the first **Hidden vault** upgrade for $200 from the treasury. Your dirty-money storage increases by 1,000.
6. Build a laundering front if necessary and launder two standard batches. The **A respectable reputation** contract needs $680 of clean output.
7. Keep running jobs, claiming contracts, and investing to unlock the street network and counting room.

Nothing in this loop requires a second player. The member list shows exactly one real founder; it does not invent other players.

## Configuration and rules

`game/family.config.ts` contains the level thresholds, rank names, job XP, contracts, upgrade costs, and effects. The current level thresholds are 0, 60, 160, 320, 550, and 850 total XP. The UI derives the current level and progress from XP rather than saving another number that might disagree.

| Upgrade        | First required Family level | First cost    | Effect per tier                        |
| -------------- | --------------------------- | ------------- | -------------------------------------- |
| Hidden vault   | 2                           | $200 treasury | +1,000 dirty storage                   |
| Street network | 3                           | $350 treasury | +10% speakeasy income                  |
| Counting room  | 4                           | $500 treasury | +3 percentage points laundering return |

Each upgrade has three tiers. Costs multiply by the next tier number, and the required Family level rises by one per tier. Effects apply to the real income, storage, and laundering rules, not just to a progress display.

`family.engine.ts` validates and executes founding, contributions, contract claims, headquarters upgrades, and disbanding. The main engine advances due events first and delegates Family commands to that module. `game.events.ts` records reports for both engines.

`game.economy.ts` holds the shared income, storage, and laundering calculations. Both personal operations and Family commands use these functions so upgrade effects and disbanding apply the same rules. A laundering batch uses the current headquarters bonus when it completes.

## Attribute work to the Family that sent it

When a job or laundering batch is queued, the operation captures the current `familyId`. Completion grants Family progress only if that ID still matches the active Family. Jobs sent before founding do not retroactively grant XP.

Every completed job grants its configured XP once. The operation is removed after completion, so reloading does not award it again. Laundering progress counts clean money actually paid out, not the dirty amount submitted.

## Transfer money; do not copy it

A contribution subtracts a positive whole-dollar amount from personal clean money and adds the same amount to the treasury. It does not create money or XP. Headquarters purchases spend treasury money. Family contracts award treasury money and XP when claimed, and a claimed contract cannot be claimed again.

The claimed-contract ledger belongs to the round, outside the active Family object. Disbanding and refounding cannot reset this ledger to farm the same reward.

## Disbanding and rounds

Disbanding requires an explicit confirmation and is blocked while Family-tagged operations are running. It forfeits Family XP, treasury, and purchased upgrades. Personal buildings, crew, and clean money remain yours; dirty money above the reduced storage cap is lost. Another Family can be founded, but already-claimed contracts remain claimed that round.

Starting a new local round clears the Family and its seasonal claim ledger along with other round progress. These are prototype rules; the shared-server season policy remains a later design task.

## Migrate saves rather than resetting them

`game.persistence.ts` validates snapshots and migrates version 1 saves into version 2 by adding a null Family, a founding counter, and an empty claim ledger. It preserves balances, buildings, crew, journal, and queued finish timestamps. The browser storage key stays `omerta.game.v1` so existing saves can be found; the JSON's `version` field is now 2.

The migration is tested as a pure function. Local saves remain editable by the user and are not a competitive online economy. Real membership, invitations, chat, shared defense, and cloud progress still need the backend.

## Try it

Change the collection job's Family XP from 25 to 30 in `family.config.ts`. Predict how many collections level 2 will take, then try it in a fresh local round. Update the affected test expectation and restore the value when finished.

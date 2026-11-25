# 10. Make crew size matter

The earlier prototype required fixed crew for each job and paid the same reward regardless of how many people you recruited. Outside the first smuggler and driver, extra units had little practical value. The new planner gives recruitment a visible effect on job capacity, returns, travel, and Heat.

## What each role does now

| Role     | Use                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner   | One per collection team; one per shipping team alongside a smuggler. More runners allow larger or simultaneous jobs.                                                                          |
| Enforcer | Two per rival-hit team. Extra enforcers can cover any job and reduce Heat by 2 each, capped at 50% reduction and two support enforcers per team.                                              |
| Driver   | Automatically assigned up to one per team. Full coverage gives a 20% travel reduction; partial coverage gives a proportional reduction. More drivers help large and simultaneous deployments. |
| Smuggler | One per shipping team alongside a runner. More smugglers allow several $650 shipments in the same deployment.                                                                                 |

There are three shared street-operation slots. Each deployment can contain up to ten teams and must have enough unassigned crew. Construction, recruitment, and laundering keep their own queues. Laying low waits until all street jobs have returned.

## Examples you can test

The starting crew has three runners, two enforcers, and one driver. One collection team quotes $300, 3 Respect, 25 Family XP, 8 Heat, and 24 seconds with the driver.

Three collection teams quote $900, 9 Respect, 75 Family XP, and 24 Heat. One driver covers one of three teams, so the deployment takes 28 seconds. Assign both enforcers as cover and Heat drops to 20, while rewards stay the same.

Recruit a fourth runner and use four collection teams: the quote becomes $1,200, 12 Respect, 100 Family XP, 32 Heat, and 28.5 seconds with one driver. Two cover enforcers reduce Heat to 28. Recruit more drivers and that travel time falls, reaching 24 seconds with four drivers.

For rival hits, four enforcers make two teams and quote $960 rather than $480. A third enforcer can already help a single rival team as cover, even before you can form a second team.

Family XP is earned only if a Family was active when the deployment was sent and still matches at completion. Respect, jobs completed, Family job-contract progress, and rewards scale with teams. Every third completed team-job grants a Favor, including when one batch crosses multiple milestones.

## The tradeoffs

Larger squads earn more but create more Heat and reserve more people. An enforcer covering a collection cannot join a rival hit at the same time. A driver assigned to one operation is unavailable to the next. Cash above storage capacity is lost; the card warns if its payout exceeds current free storage. Passive income while the crew is away can consume more capacity.

These jobs still succeed deterministically. Full combat, casualties, and PvP are later phases; the planner makes the current solo loop useful without pretending a combat simulation already exists.

## One calculation for the preview and dispatch

`src/app/game/crew-planner.ts` owns `previewJob()`, available crew, capacity helpers, and assignment validation. The UI and engine call the same calculation.

```ts
money = job.reward * teams;
familyXp = baseFamilyXp * teams;
travel = job.seconds * (1 - (0.2 * assignedDrivers) / teams);
heat = Math.max(Math.ceil(baseHeat * 0.5), baseHeat - escorts * 2);
```

Configuration in `game.config.ts` holds the caps and modifiers. Invalid, fractional, negative, or unavailable quantities are rejected by the engine, even if a disabled button is bypassed.

## Save what was promised

Dispatch records a `jobOutcome` snapshot on the operation. Completion uses that stored team count, reward, Respect, Heat, and Family XP. Recruiting another driver while a job is running does not change its finish timestamp or payout.

Older operations with no snapshot retain the original single-team payouts. Save validation allows multiple job operations, limits the total slots, rejects duplicate operation IDs, and checks aggregate crew reservations so two operations cannot reserve the same person. Six operations can coexist: three street jobs, construction, recruitment, and laundering.

Operations queued in the same millisecond get distinct IDs. Completed operations are removed and crew availability is derived from remaining reservations, so reloads cannot return people or pay a job twice.

## Try it

1. Build Eight Ball Social and recruit one runner.
2. Open the collection job and select **Use max**. Confirm the larger quote before sending.
3. Add enforcer cover and watch Heat change while money and XP remain unchanged.
4. Try a multi-team deployment with one driver, then recruit enough drivers to cover every team and compare durations.
5. Send two separate jobs. Check that the second sees only the crew and drivers left available by the first.

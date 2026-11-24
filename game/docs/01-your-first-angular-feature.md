# 1. Follow one click

Goal: understand what happens when you click **Establish front**.

## Start in the template

Open `src/app/app.component.html` and find the fronts screen. Its `@for` repeats one card per item in `buildings`. This list comes from `BUILDINGS` in `game.config.ts`.

The button's important binding is:

```html
(click)="game.dispatch({type:'build', target:building.id})"
```

Parentheses attach an event listener. Angular runs the expression when the click happens. The command contains the intent and the target, not a price or a proposed balance.

The button also has:

```html
[disabled]="!!reason({type:'build', target:building.id})"
```

Square brackets bind a JavaScript value to a property. `reason()` asks the engine why this action would be invalid. `!!` converts the answer to a boolean. A message means the button is disabled. The message is shown below the button too, so touch and keyboard users can understand it.

## Follow the service

Open `game.store.ts` and find `dispatch()`:

```ts
const result = executeCommand(this.state(), command, Date.now());
this.state.set(result.state);
```

The store reads the current state, passes it to the engine, and publishes the returned state. Saving and notifications happen here too. The component does not subtract cash itself.

## Follow the rule

Open `game.engine.ts`. `executeCommand()` first advances old events to the current time. A front that finished a second ago must count before a new command is checked.

It calls `commandError()`. A build can fail because another construction is running, the front has reached level 5, the player lacks money, or the round has ended. These checks still run when someone bypasses the disabled button.

On success, it deducts `buildingCost()`, calculates a finish timestamp, and appends an `Operation`. The building level stays unchanged until the operation completes.

## Why types matter

In `game.model.ts`:

```ts
type BuildingId = "safehouse" | "speakeasy" | "laundry" | "office" | "poolhall";
```

This union permits only those identifiers. A typo such as `'speakeseasy'` is caught during compilation. `GameCommand` is another union: a build command needs a building target, while a bribe command does not need one.

`Record<BuildingId, number>` means every building ID has a numeric level. It documents the shape and catches missing buildings in the initial state.

## Try it

1. Change the speakeasy's cost to 450 in `game.config.ts`.
2. Check that the displayed cost changes without editing the template.
3. Update the first test's expected cost in `tests/game-engine.test.ts` and run `npm.cmd test`.
4. Restore the original cost so the existing first-session walkthrough matches again.

Next, add a “total crew” number to a screen using the existing `game.crewCount()` computed signal. Chapter 2 explains why Angular updates it automatically.

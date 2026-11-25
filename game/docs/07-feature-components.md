# 7. From one large screen to feature components

Phase 1 is implemented. Fronts, crew, rackets, reports, and the new Family screen now have their own standalone Angular components.

## Where to look

| Screen                        | Component and template directory |
| ----------------------------- | -------------------------------- |
| Fronts and laundering         | `src/app/fronts/`                |
| Crew and recruitment          | `src/app/crew/`                  |
| Jobs and Heat management      | `src/app/rackets/`               |
| Street reports                | `src/app/reports/`               |
| Founding and growing a Family | `src/app/family/`                |

`AppComponent` owns the application shell, navigation, overview, and dialogs. It imports the screen components directly. The fronts branch in its template now reads:

```html
@case ("fronts") {
<o-fronts />
}
```

Open `fronts.component.html` to change a front card. Open `fronts.component.ts` to find the values and actions used by that screen. You no longer need to search through the entire application template.

## One shared game

Each feature uses `inject(GameStore)`. The store is still provided at the application root, so all screens read the same game. Do not add `providers: [GameStore]` to individual screens: that would give them separate stores.

The features do not own prices, rewards, or balances. Their small `reason()`, `cost()`, and similar helpers call the shared rules engine. Rules still belong in `game.engine.ts` and configuration files.

## Tell the parent when navigation is needed

The crew screen includes a button leading to the fronts screen when recruitment is locked. It emits an event:

```ts
readonly navigate = output<string>();
```

```html
<button (click)="navigate.emit('fronts')">View fronts</button>
```

The parent decides what navigation means:

```html
<o-crew (navigate)="go($event)" />
```

The Family screen uses the same pattern for its “Run a job” button. This keeps a feature focused on its own screen instead of giving it control over the entire application.

## A checklist derived from real state

The overview's first-night checklist reads the speakeasy level, total money laundered, and completed job count through `computed()`. There is no second set of completion flags to get out of sync. Opening a screen does not complete its objective; the actual game action does.

## Try it

Add a small “Open a recruitment hall” checklist item based on `state().buildings.poolhall`. Keep its completion derived from the building level. Then inspect the checklist on a phone: the rows should stack without shrinking the text.

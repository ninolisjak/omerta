# 2. Signals and components

Goal: understand how the screen stays synchronized with the game.

## A signal is a value you read by calling

In `game.store.ts`, `state` holds a `GameState`:

```ts
readonly state = signal(this.load());
```

Read it with `state()`. Replace it with `state.set(nextState)`. Derive the next value with `state.update(previous => nextState)`.

Do not mutate a nested property such as `state().crew.runner++`. That bypasses signal notification. The engine clones its input and returns a new object; the store publishes that object.

The `readonly` keyword prevents replacing the signal field itself. It does not make its entire value deeply immutable. The discipline is: the engine owns changes, components request them.

## Derived values belong in computed

The income counter is not a second balance to maintain:

```ts
readonly income = computed(() => incomePerMinute(this.state()));
```

Angular tracks the signal read inside that function. When the state changes, the income computation becomes stale and is recomputed when read. The template uses `game.income()`.

The same pattern calculates active front count and total crew. Avoid copying these values into independent signals, where one update could forget to change both.

## Templates

```html
<strong>{{ game.crewCount() }}</strong>
@if (game.state().buildings.poolhall === 0) {
<p>Build a recruitment hall first.</p>
}
```

Double braces display an expression. `@if` conditionally renders. `@for (...; track id)` repeats content and gives Angular a stable identity so it can preserve matching DOM elements.

## Standalone components

`AppComponent` imports the components and pipes its template needs directly. There is no application NgModule. `main.ts` starts the root with `bootstrapApplication()`.

`CityComponent` is responsible for map presentation and selection. It has an input and an output:

```ts
readonly expanded = input(false);
readonly navigate = output<string>();
```

The parent uses it like this:

```html
<o-city [expanded]="true" (navigate)="go($event)" />
```

Data flows down through `[expanded]`. An event flows up through `(navigate)`. The city component does not need to know how navigation works or how game resources are saved.

`OperationsComponent` receives the queue and current display time. It renders countdowns; it does not complete operations or award money.

## Injection and change detection

`inject(GameStore)` asks Angular for the shared game service. `providedIn: 'root'` makes it available application-wide. Components read the same state instead of accidentally creating separate games.

`OnPush` reduces unnecessary checks. Signals read by the template still notify Angular when they change. This project uses Angular's zoneless default; timers update signals explicitly.

## Try it

Add this to the store:

```ts
readonly totalMoney = computed(() => this.state().clean + this.state().dirty);
```

Display it on the reports screen using `{{ game.totalMoney() | number:'1.0-0' }}`. Run a job and watch it change. Remember that clean and dirty money are different resources even if you display their sum.

References: [Angular signals](https://angular.dev/guide/signals) and [component imports](https://angular.dev/guide/components/importing).

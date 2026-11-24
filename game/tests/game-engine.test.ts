import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceGame,
  availableCrew,
  createGame,
  executeCommand,
  storageCap,
} from "../src/app/game/game.engine.ts";
import { RULES } from "../src/app/game/game.config.ts";

const NOW = 1_800_000_000_000;

test("a build deducts its price once and rejects a second construction", () => {
  const start = createGame(NOW);
  const first = executeCommand(
    start,
    { type: "build", target: "speakeasy" },
    NOW,
  );
  assert.equal(first.error, null);
  assert.equal(first.state.clean, start.clean - 400);
  assert.equal(first.state.buildings.speakeasy, 0);
  const again = executeCommand(
    first.state,
    { type: "build", target: "laundry" },
    NOW,
  );
  assert.match(again.error!, /builder is busy/);
  assert.equal(again.state.clean, first.state.clean);
  assert.equal(again.state.operations.length, 1);
  assert.equal(
    start.operations.length,
    0,
    "commands must not mutate their input",
  );
});

test("offline income starts at construction completion, not before", () => {
  const result = executeCommand(
    createGame(NOW),
    { type: "build", target: "speakeasy" },
    NOW,
  );
  const state = advanceGame(result.state, NOW + 85_000);
  assert.equal(state.buildings.speakeasy, 1);
  assert.equal(state.operations.length, 0);
  assert.equal(
    state.dirty,
    1240 + 90,
    "25 second construction followed by one minute of earnings",
  );
});

test("the offline result matches small online updates across events", () => {
  const start = createGame(NOW);
  start.buildings.laundry = 1;
  let state = executeCommand(
    start,
    { type: "build", target: "speakeasy" },
    NOW,
  ).state;
  state = executeCommand(state, { type: "launder" }, NOW).state;
  state = executeCommand(
    state,
    { type: "job", target: "collection" },
    NOW,
  ).state;
  const offline = advanceGame(state, NOW + 180_000);
  let online = state;
  for (let elapsed = 1000; elapsed <= 180_000; elapsed += 1000)
    online = advanceGame(online, NOW + elapsed);
  assert.ok(Math.abs(online.dirty - offline.dirty) < 0.00001);
  assert.ok(Math.abs(online.heat - offline.heat) < 0.00001);
  assert.equal(online.clean, offline.clean);
  assert.equal(online.respect, offline.respect);
  assert.deepEqual(online.crew, offline.crew);
});

test("crew is reserved during jobs and comes home exactly once", () => {
  const start = createGame(NOW);
  const sent = executeCommand(
    start,
    { type: "job", target: "collection" },
    NOW,
  ).state;
  assert.equal(availableCrew(sent, "runner"), 2);
  assert.equal(availableCrew(sent, "driver"), 0);
  assert.equal(
    sent.operations[0].endsAt,
    NOW + 24_000,
    "driver reduces travel by 20%",
  );
  const returned = advanceGame(sent, NOW + 24_000);
  assert.equal(availableCrew(returned, "runner"), 3);
  assert.equal(availableCrew(returned, "driver"), 1);
  assert.equal(returned.dirty, start.dirty + 300);
  assert.equal(returned.respect, start.respect + 3);
  assert.equal(advanceGame(returned, NOW + 24_000).dirty, returned.dirty);
});

test("jobs cannot borrow missing crew or overlap with laying low", () => {
  const start = createGame(NOW);
  assert.match(
    executeCommand(start, { type: "job", target: "shipment" }, NOW).error!,
    /smuggler/,
  );
  const low = executeCommand(start, { type: "laylow" }, NOW).state;
  assert.match(
    executeCommand(low, { type: "job", target: "collection" }, NOW).error!,
    /street operation/,
  );
});

test("laundering takes dirty money up front and pays out once", () => {
  const start = createGame(NOW);
  assert.match(
    executeCommand(start, { type: "launder" }, NOW).error!,
    /Bellini/,
  );
  start.buildings.laundry = 1;
  const sent = executeCommand(start, { type: "launder" }, NOW).state;
  assert.equal(sent.dirty, start.dirty - 400);
  assert.equal(sent.clean, start.clean);
  const done = advanceGame(sent, NOW + 20_000);
  assert.equal(done.clean, start.clean + 340);
  assert.equal(done.totalLaundered, 340);
  assert.equal(advanceGame(done, NOW + 60_000).clean, done.clean);
});

test("a police raid seizes money and an idle enforcer without breaking assigned crew", () => {
  const start = createGame(NOW);
  start.heat = 90;
  const done = advanceGame(start, NOW + RULES.policeInterval);
  assert.equal(done.dirty, 1240 - Math.floor(1240 * 0.2));
  assert.equal(done.crew.enforcer, 1);
  assert.equal(done.heat, 58.5);
  assert.equal(done.journal[0].tone, "warning");
});

test("crossing the Heat threshold keeps police checks consistent offline", () => {
  const start = createGame(NOW);
  start.heat = 55;
  start.operations.push({
    id: "delayed-job",
    kind: "job",
    target: "rival",
    label: "Returning from Ash Row",
    startedAt: NOW,
    endsAt: NOW + 70_000,
    crew: { enforcer: 2 },
  });
  const offline = advanceGame(start, NOW + 180_000);
  let online = start;
  for (let elapsed = 1000; elapsed <= 180_000; elapsed += 1000)
    online = advanceGame(online, NOW + elapsed);
  assert.equal(offline.dirty, online.dirty);
  assert.equal(offline.crew.enforcer, online.crew.enforcer);
  assert.equal(offline.journal[0].at, NOW + 120_000);
  assert.equal(online.journal[0].at, offline.journal[0].at);
  assert.ok(Math.abs(offline.heat - online.heat) < 0.00001);
});

test("a bribe needs an office, money, and a Favor", () => {
  const start = createGame(NOW);
  start.heat = 50;
  assert.match(executeCommand(start, { type: "bribe" }, NOW).error!, /office/);
  start.buildings.office = 1;
  start.favors = 0;
  assert.match(executeCommand(start, { type: "bribe" }, NOW).error!, /Favor/);
  start.favors = 1;
  const result = executeCommand(start, { type: "bribe" }, NOW);
  assert.equal(result.state.heat, 25);
  assert.equal(result.state.clean, start.clean - 200);
  assert.equal(result.state.favors, 0);
});

test("storage caps offline earnings and Heat stays in range", () => {
  const start = createGame(NOW);
  start.buildings.speakeasy = 5;
  const result = advanceGame(start, NOW + 86_400_000);
  assert.equal(result.dirty, storageCap(result));
  assert.equal(result.heat, 0);
});

test("round end stops income and rejects actions", () => {
  const start = createGame(NOW);
  start.buildings.speakeasy = 1;
  start.roundEndsAt = NOW + 60_000;
  const ended = advanceGame(start, NOW + 1_000_000);
  assert.equal(ended.updatedAt, start.roundEndsAt);
  assert.equal(ended.dirty, start.dirty + 90);
  assert.match(
    executeCommand(ended, { type: "build", target: "laundry" }, NOW + 1_000_000)
      .error!,
    /round has ended/,
  );
});

test("not enough clean money cannot create a negative balance", () => {
  const start = createGame(NOW);
  start.clean = 1;
  const result = executeCommand(
    start,
    { type: "build", target: "speakeasy" },
    NOW,
  );
  assert.match(result.error!, /clean money/);
  assert.equal(result.state.clean, 1);
  assert.equal(result.state.operations.length, 0);
});

test("recruitment requires the pool hall and completes while offline", () => {
  const start = createGame(NOW);
  assert.match(
    executeCommand(start, { type: "recruit", target: "smuggler" }, NOW).error!,
    /Eight Ball/,
  );
  start.buildings.poolhall = 1;
  const sent = executeCommand(
    start,
    { type: "recruit", target: "smuggler" },
    NOW,
  ).state;
  assert.equal(sent.crew.smuggler, 0);
  assert.equal(sent.clean, start.clean - 250);
  const done = advanceGame(sent, NOW + 30_000);
  assert.equal(done.crew.smuggler, 1);
  assert.equal(done.operations.length, 0);
});

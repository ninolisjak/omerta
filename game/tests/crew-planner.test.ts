import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  executeCommand,
  advanceGame,
  availableCrew,
} from "../src/app/game/game.engine.ts";
import { JOBS } from "../src/app/game/game.config.ts";
import {
  maxJobTeams,
  previewJob,
  jobAssignmentError,
} from "../src/app/game/crew-planner.ts";
import { migrateSave } from "../src/app/game/game.persistence.ts";

const NOW = 1_800_000_000_000;
const collection = JOBS.find((job) => job.id === "collection")!;
const shipment = JOBS.find((job) => job.id === "shipment")!;
const rival = JOBS.find((job) => job.id === "rival")!;

test("more runners scale collections instead of sitting idle", () => {
  const s = createGame(NOW);
  assert.equal(maxJobTeams(s, collection), 3);
  assert.equal(previewJob(s, collection, { teams: 3 }).reward, 900);
  s.crew.runner++;
  assert.equal(maxJobTeams(s, collection), 4);
  const bigger = previewJob(s, collection, { teams: 4 });
  assert.equal(bigger.reward, 1200);
  assert.equal(bigger.respect, 12);
  assert.equal(bigger.familyXp, 100);
  assert.equal(bigger.seconds, 28.5);
});
test("additional drivers improve coverage for a larger deployment", () => {
  const s = createGame(NOW);
  assert.equal(previewJob(s, collection, { teams: 3 }).seconds, 28);
  s.crew.driver = 2;
  assert.equal(previewJob(s, collection, { teams: 3 }).seconds, 26);
  s.crew.driver = 3;
  assert.equal(previewJob(s, collection, { teams: 3 }).seconds, 24);
  s.crew.driver = 10;
  assert.equal(previewJob(s, collection, { teams: 3 }).drivers, 3);
  assert.equal(previewJob(s, collection, { teams: 3 }).seconds, 24);
});
test("extra smugglers and runners create multiple profitable shipping teams", () => {
  const s = createGame(NOW);
  s.crew.smuggler = 1;
  assert.equal(maxJobTeams(s, shipment), 1);
  assert.match(
    jobAssignmentError(s, shipment, { teams: 2 })!,
    /2 available smugglers/,
  );
  s.crew.smuggler = 2;
  assert.equal(maxJobTeams(s, shipment), 2);
  assert.equal(jobAssignmentError(s, shipment, { teams: 2 }), null);
  assert.equal(previewJob(s, shipment, { teams: 2 }).reward, 1300);
});
test("extra enforcers increase rival-hit capacity and can cover any job", () => {
  const s = createGame(NOW);
  assert.equal(maxJobTeams(s, rival), 1);
  s.crew.enforcer = 3;
  assert.equal(previewJob(s, rival, { teams: 1, escorts: 1 }).heat, 20);
  assert.equal(jobAssignmentError(s, rival, { teams: 1, escorts: 1 }), null);
  s.crew.enforcer = 4;
  assert.equal(maxJobTeams(s, rival), 2);
  assert.equal(previewJob(s, rival, { teams: 2 }).reward, 960);
});
test("cover reduces Heat but does not create extra money or XP", () => {
  const s = createGame(NOW);
  const covered = previewJob(s, collection, { teams: 1, escorts: 2 });
  assert.equal(covered.heat, 4);
  assert.equal(covered.reward, 300);
  assert.equal(covered.familyXp, 25);
  assert.equal(covered.crew.enforcer, 2);
  assert.match(
    jobAssignmentError(s, collection, { teams: 1, escorts: 3 })!,
    /0–2/,
  );
});
test("a multi-team deployment reserves everyone, pays the quote once, and scales Family progress", () => {
  const start = executeCommand(
    createGame(NOW),
    { type: "foundFamily", name: "Blackwater", emblem: "shield" },
    NOW,
  ).state;
  const result = executeCommand(
    start,
    { type: "job", target: "collection", teams: 3, escorts: 2 },
    NOW,
  );
  assert.equal(result.error, null);
  assert.equal(availableCrew(result.state, "runner"), 0);
  assert.equal(availableCrew(result.state, "enforcer"), 0);
  assert.equal(availableCrew(result.state, "driver"), 0);
  assert.equal(result.state.operations[0].jobOutcome!.heat, 20);
  const done = advanceGame(result.state, NOW + 28_000);
  assert.equal(done.dirty, start.dirty + 900);
  assert.equal(done.respect, start.respect + 9);
  assert.equal(done.jobsCompleted, 3);
  assert.equal(done.family!.jobsCompleted, 3);
  assert.equal(done.family!.xp, 75);
  assert.equal(done.favors, start.favors + 1);
  assert.deepEqual(done.crew, start.crew);
  assert.equal(advanceGame(done, NOW + 30_000).dirty, done.dirty);
});
test("three simultaneous jobs use separate IDs and cannot borrow reserved people", () => {
  let s = createGame(NOW);
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  s = executeCommand(s, { type: "job", target: "rival" }, NOW).state;
  assert.equal(s.operations.length, 3);
  assert.equal(new Set(s.operations.map((op) => op.id)).size, 3);
  assert.equal(s.operations[0].endsAt, NOW + 24_000);
  assert.equal(s.operations[1].endsAt, NOW + 30_000);
  assert.equal(availableCrew(s, "runner"), 1);
  assert.equal(availableCrew(s, "enforcer"), 0);
  assert.match(
    executeCommand(s, { type: "job", target: "collection" }, NOW).error!,
    /All 3/,
  );
  const done = advanceGame(s, NOW + 45_000);
  assert.equal(done.operations.length, 0);
  assert.equal(done.dirty, 1240 + 300 + 300 + 480);
  assert.equal(availableCrew(done, "runner"), 3);
  assert.equal(availableCrew(done, "driver"), 1);
  assert.equal(availableCrew(done, "enforcer"), 2);
});
test("quoted work stays fixed when more people become available while it is running", () => {
  const sent = executeCommand(
    createGame(NOW),
    { type: "job", target: "collection", teams: 3 },
    NOW,
  ).state;
  sent.crew.runner = 10;
  sent.crew.driver = 10;
  assert.equal(sent.operations[0].endsAt, NOW + 28_000);
  const done = advanceGame(sent, NOW + 28_000);
  assert.equal(done.dirty, 2140);
  assert.equal(done.jobsCompleted, 3);
});
test("jobs saved before team planning still pay their original one-team reward", () => {
  const sent = executeCommand(
    createGame(NOW),
    { type: "job", target: "collection" },
    NOW,
  ).state;
  delete sent.operations[0].jobOutcome;
  sent.crew.runner = 10;
  assert.ok(migrateSave(sent));
  const done = advanceGame(sent, NOW + 24_000);
  assert.equal(done.dirty, 1540);
  assert.equal(done.jobsCompleted, 1);
});
test("invalid quantities and missing crew are rejected before assignment", () => {
  const s = createGame(NOW);
  for (const teams of [-1, 0, 1.5, 11, NaN, Infinity])
    assert.ok(
      executeCommand(s, { type: "job", target: "collection", teams }, NOW)
        .error,
    );
  for (const escorts of [-1, 0.5, 3, NaN, Infinity])
    assert.ok(
      executeCommand(s, { type: "job", target: "collection", escorts }, NOW)
        .error,
    );
  assert.match(
    executeCommand(s, { type: "job", target: "collection", teams: 4 }, NOW)
      .error!,
    /4 available runners/,
  );
  assert.equal(s.operations.length, 0);
});
test("a six-operation save supports building, recruitment, laundering, and three jobs together", () => {
  let s = createGame(NOW);
  s.buildings.poolhall = 1;
  s.buildings.laundry = 1;
  s.crew.driver = 3;
  s = executeCommand(s, { type: "build", target: "safehouse" }, NOW).state;
  s = executeCommand(s, { type: "recruit", target: "runner" }, NOW).state;
  s = executeCommand(s, { type: "launder" }, NOW).state;
  for (let i = 0; i < 3; i++)
    s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  assert.equal(s.operations.length, 6);
  const loaded = migrateSave(JSON.parse(JSON.stringify(s)))!;
  assert.ok(loaded);
  const done = advanceGame(loaded, NOW + 60_000);
  assert.equal(done.operations.length, 0);
  assert.equal(done.crew.runner, 4);
  assert.equal(done.crew.driver, 3);
  assert.equal(done.buildings.safehouse, 2);
  assert.equal(done.clean, 1865);
  assert.equal(done.dirty, 1740);
});
test("save validation rejects overlapping reservations and malformed reward snapshots", () => {
  let s = createGame(NOW);
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  const over = structuredClone(s);
  over.crew.runner = 1;
  assert.equal(migrateSave(over), null);
  const badReward = structuredClone(s);
  badReward.operations[0].jobOutcome!.reward = -1;
  assert.equal(migrateSave(badReward), null);
  const duplicate = structuredClone(s);
  duplicate.operations[1].id = duplicate.operations[0].id;
  assert.equal(migrateSave(duplicate), null);
});
test("laying low waits for every active deployment to come home", () => {
  let s = createGame(NOW);
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  s = executeCommand(s, { type: "job", target: "collection" }, NOW).state;
  assert.ok(executeCommand(s, { type: "laylow" }, NOW + 24_000).error);
  assert.equal(executeCommand(s, { type: "laylow" }, NOW + 30_000).error, null);
});

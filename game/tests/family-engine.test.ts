import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceGame,
  createGame,
  executeCommand,
  incomePerMinute,
  launderingYield,
  storageCap,
} from "../src/app/game/game.engine.ts";
import { familyLevel } from "../src/app/game/family.engine.ts";
import type { GameState } from "../src/app/game/game.model.ts";

const NOW = 1_800_000_000_000;
const found = (s = createGame(NOW)) =>
  executeCommand(
    s,
    { type: "foundFamily", name: "Blackwater", emblem: "shield" },
    s.updatedAt,
  ).state;
function collection(s: GameState): GameState {
  const result = executeCommand(
    s,
    { type: "job", target: "collection" },
    s.updatedAt,
  );
  assert.equal(result.error, null);
  return advanceGame(
    result.state,
    result.state.operations.find((op) => op.kind === "job")!.endsAt,
  );
}

test("founding preserves personal progress, is free, and creates a single founder", () => {
  const start = createGame(NOW);
  const s = found(start);
  assert.equal(s.family!.name, "Blackwater");
  assert.equal(s.family!.xp, 0);
  assert.equal(s.clean, start.clean);
  assert.deepEqual(s.crew, start.crew);
  assert.deepEqual(s.buildings, start.buildings);
  assert.equal(s.familySerial, 1);
  assert.equal(start.family, null);
  assert.match(
    executeCommand(
      s,
      { type: "foundFamily", name: "Again", emblem: "anchor" },
      NOW,
    ).error!,
    /already/,
  );
});
test("invalid names and emblems cannot create a Family", () => {
  for (const name of ["", "ab", "<script>", "a".repeat(25)]) {
    assert.ok(
      executeCommand(
        createGame(NOW),
        { type: "foundFamily", name, emblem: "shield" },
        NOW,
      ).error,
    );
  }
});
test("jobs award XP and contract progress once, including offline completions", () => {
  const s = collection(collection(collection(found())));
  assert.equal(s.family!.xp, 75);
  assert.equal(s.family!.jobsCompleted, 3);
  assert.equal(familyLevel(s.family!.xp), 2);
  assert.equal(advanceGame(s, s.updatedAt + 60_000).family!.xp, 75);
});
test("jobs sent before founding do not retroactively grant Family progress", () => {
  let s = executeCommand(
    createGame(NOW),
    { type: "job", target: "collection" },
    NOW,
  ).state;
  s = executeCommand(
    s,
    { type: "foundFamily", name: "Blackwater", emblem: "shield" },
    NOW + 1000,
  ).state;
  s = advanceGame(s, NOW + 25_000);
  assert.equal(s.jobsCompleted, 1);
  assert.equal(s.family!.xp, 0);
  assert.equal(s.family!.jobsCompleted, 0);
});
test("donations transfer clean money, do not award XP, and reject invalid amounts", () => {
  const s = found();
  for (const amount of [-100, 0, 1.5, NaN, Infinity, s.clean + 1]) {
    const result = executeCommand(s, { type: "contributeFamily", amount }, NOW);
    assert.ok(result.error);
    assert.equal(result.state.family!.treasury, 0);
    assert.equal(result.state.clean, s.clean);
  }
  const donated = executeCommand(
    s,
    { type: "contributeFamily", amount: 100 },
    NOW,
  ).state;
  assert.equal(donated.clean, s.clean - 100);
  assert.equal(donated.family!.treasury, 100);
  assert.equal(donated.family!.xp, 0);
  assert.equal(donated.family!.contributions.length, 1);
});
test("a completed contract pays once and funds an unlocked headquarters upgrade", () => {
  let s = collection(collection(collection(found())));
  const claim = executeCommand(
    s,
    { type: "claimFamilyContract", target: "first-steps" },
    s.updatedAt,
  );
  assert.equal(claim.error, null);
  s = claim.state;
  assert.equal(s.family!.xp, 115);
  assert.equal(s.family!.treasury, 250);
  const duplicate = executeCommand(
    s,
    { type: "claimFamilyContract", target: "first-steps" },
    s.updatedAt,
  );
  assert.match(duplicate.error!, /already claimed/);
  assert.equal(duplicate.state.family!.treasury, 250);
  const upgraded = executeCommand(
    s,
    { type: "upgradeFamily", target: "vault" },
    s.updatedAt,
  );
  assert.equal(upgraded.error, null);
  assert.equal(upgraded.state.family!.upgrades.vault, 1);
  assert.equal(upgraded.state.family!.treasury, 50);
  assert.equal(storageCap(upgraded.state), storageCap(s) + 1000);
});
test("upgrades enforce level gates, treasury costs, and maximum tier", () => {
  const s = found();
  s.family!.treasury = 5000;
  assert.match(
    executeCommand(s, { type: "upgradeFamily", target: "vault" }, NOW).error!,
    /level 2/,
  );
  s.family!.xp = 850;
  s.family!.treasury = 0;
  assert.match(
    executeCommand(s, { type: "upgradeFamily", target: "vault" }, NOW).error!,
    /treasury/,
  );
  s.family!.treasury = 5000;
  s.family!.upgrades.vault = 3;
  assert.match(
    executeCommand(s, { type: "upgradeFamily", target: "vault" }, NOW).error!,
    /maxed/,
  );
});
test("Family income and laundering upgrades affect actual payouts", () => {
  const s = found();
  s.family!.upgrades.network = 2;
  s.family!.upgrades.books = 1;
  s.buildings.speakeasy = 1;
  s.buildings.laundry = 1;
  assert.equal(incomePerMinute(s), 108);
  assert.equal(launderingYield(s), 0.88);
  const result = executeCommand(s, { type: "launder" }, NOW);
  const done = advanceGame(result.state, NOW + 20_000);
  assert.equal(done.clean, s.clean + 352);
  assert.equal(done.family!.laundered, 352);
});
test("contracts cannot be farmed by disbanding and re-founding", () => {
  let s = collection(collection(collection(found())));
  s = executeCommand(
    s,
    { type: "claimFamilyContract", target: "first-steps" },
    s.updatedAt,
  ).state;
  s = executeCommand(s, { type: "disbandFamily" }, s.updatedAt).state;
  assert.equal(s.family, null);
  const personalClean = s.clean;
  s = found(s);
  assert.equal(s.family!.id, "family-2");
  assert.equal(s.family!.xp, 0);
  assert.equal(s.clean, personalClean);
  s = collection(collection(collection(s)));
  assert.match(
    executeCommand(
      s,
      { type: "claimFamilyContract", target: "first-steps" },
      s.updatedAt,
    ).error!,
    /already claimed/,
  );
});
test("active Family operations must finish before disbanding", () => {
  const s = executeCommand(
    found(),
    { type: "job", target: "collection" },
    NOW,
  ).state;
  assert.match(
    executeCommand(s, { type: "disbandFamily" }, NOW).error!,
    /operations to finish/,
  );
});
test("round closure rejects Family actions and a new round clears the seasonal ledger", () => {
  const s = found();
  s.roundEndsAt = NOW + 1000;
  assert.match(
    executeCommand(s, { type: "contributeFamily", amount: 100 }, NOW + 2000)
      .error!,
    /round has ended/,
  );
  const fresh = createGame(NOW + 2000);
  assert.equal(fresh.family, null);
  assert.deepEqual(fresh.claimedFamilyContracts, []);
});
test("rapid contributions keep report IDs unique after the ledger fills up", () => {
  let s = found();
  for (let i = 0; i < 40; i++)
    s = executeCommand(s, { type: "contributeFamily", amount: 1 }, NOW).state;
  assert.equal(s.journal.length, 30);
  assert.equal(new Set(s.journal.map((entry) => entry.id)).size, 30);
  assert.equal(s.family!.treasury, 40);
});
test("disbanding removes upgrade benefits and applies the base storage limit immediately", () => {
  const s = found();
  s.family!.upgrades.vault = 1;
  s.family!.upgrades.network = 1;
  s.buildings.speakeasy = 1;
  s.dirty = 8000;
  assert.equal(incomePerMinute(s), 99);
  const result = executeCommand(s, { type: "disbandFamily" }, NOW).state;
  assert.equal(result.family, null);
  assert.equal(result.dirty, 7000);
  assert.equal(incomePerMinute(result), 90);
});

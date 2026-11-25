import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, executeCommand } from "../src/app/game/game.engine.ts";
import { migrateSave } from "../src/app/game/game.persistence.ts";

const NOW = 1_800_000_000_000;
test("a v1 save migrates without losing balances, buildings, crews, or timers", () => {
  const current = executeCommand(
    createGame(NOW),
    { type: "build", target: "speakeasy" },
    NOW,
  ).state;
  const { family, familySerial, claimedFamilyContracts, ...base } = current;
  const legacy = { ...base, version: 1 };
  const migrated = migrateSave(JSON.parse(JSON.stringify(legacy)))!;
  assert.ok(migrated);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.clean, current.clean);
  assert.equal(migrated.dirty, current.dirty);
  assert.deepEqual(migrated.operations, current.operations);
  assert.deepEqual(migrated.buildings, current.buildings);
  assert.deepEqual(migrated.crew, current.crew);
  assert.equal(migrated.family, null);
  assert.deepEqual(migrated.claimedFamilyContracts, []);
  assert.equal(legacy.version, 1);
});
test("a valid v2 Family save retains treasury, XP, and contribution history", () => {
  let s = executeCommand(
    createGame(NOW),
    { type: "foundFamily", name: "Blackwater", emblem: "anchor" },
    NOW,
  ).state;
  s = executeCommand(s, { type: "contributeFamily", amount: 100 }, NOW).state;
  const loaded = migrateSave(JSON.parse(JSON.stringify(s)))!;
  assert.deepEqual(loaded, s);
  assert.notEqual(loaded, s);
});
test("malformed Family state is rejected instead of entering the engine", () => {
  const s = executeCommand(
    createGame(NOW),
    { type: "foundFamily", name: "Blackwater", emblem: "anchor" },
    NOW,
  ).state;
  const invalid = [
    { ...s, familySerial: -1 },
    { ...s, family: undefined },
    { ...s, family: { ...s.family, xp: -1 } },
    { ...s, family: { ...s.family, upgrades: null } },
    { ...s, family: { ...s.family, contributions: [{}] } },
    { ...s, claimedFamilyContracts: ["invented"] },
    { ...s, claimedFamilyContracts: ["first-steps", "first-steps"] },
  ];
  for (const value of invalid) assert.equal(migrateSave(value), null);
});

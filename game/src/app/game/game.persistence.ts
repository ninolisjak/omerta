import { BUILDINGS, CREW, JOBS } from "./game.config.ts";
import {
  FAMILY_CONTRACTS,
  FAMILY_RULES,
  FAMILY_UPGRADES,
} from "./family.config.ts";
import type { GameState } from "./game.model.ts";
// localStorage is untrusted input, even for a single-player prototype.
function validBase(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  const number = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (
    ![1, 2].includes(Number(s.version)) ||
    ![
      "startedAt",
      "updatedAt",
      "roundEndsAt",
      "nextPoliceAt",
      "dirty",
      "clean",
      "respect",
      "favors",
      "heat",
      "jobsCompleted",
      "totalLaundered",
    ].every((key) => number(s[key as keyof GameState]))
  )
    return false;
  if (
    s.heat > 100 ||
    s.startedAt > s.updatedAt ||
    s.updatedAt > s.roundEndsAt ||
    s.roundEndsAt <= s.startedAt
  )
    return false;
  if (
    !s.buildings ||
    !BUILDINGS.every(
      (b) =>
        Number.isInteger(s.buildings[b.id]) &&
        s.buildings[b.id] >= 0 &&
        s.buildings[b.id] <= 5,
    )
  )
    return false;
  if (
    !s.crew ||
    !CREW.every((c) => Number.isInteger(s.crew[c.id]) && s.crew[c.id] >= 0)
  )
    return false;
  if (
    !Array.isArray(s.operations) ||
    s.operations.length > 5 ||
    !Array.isArray(s.journal) ||
    s.journal.length > 30
  )
    return false;
  const kinds = new Set<string>();
  for (const op of s.operations) {
    if (
      !op ||
      !["build", "recruit", "job", "launder", "laylow"].includes(op.kind) ||
      kinds.has(op.kind) ||
      typeof op.id !== "string" ||
      typeof op.label !== "string" ||
      typeof op.target !== "string" ||
      !number(op.startedAt) ||
      !number(op.endsAt) ||
      op.endsAt <= op.startedAt
    )
      return false;
    kinds.add(op.kind);
    if (op.kind === "build" && !BUILDINGS.some((b) => b.id === op.target))
      return false;
    if (op.kind === "recruit" && !CREW.some((c) => c.id === op.target))
      return false;
    if (op.kind === "job" && !JOBS.some((j) => j.id === op.target))
      return false;
    if (
      op.kind === "launder" &&
      (!number(Number(op.target)) || Number(op.target) > 800)
    )
      return false;
    if (
      op.crew &&
      Object.entries(op.crew).some(
        ([id, count]) =>
          !CREW.some((c) => c.id === id) ||
          !Number.isInteger(count) ||
          count! < 0 ||
          count! > s.crew[id as keyof typeof s.crew],
      )
    )
      return false;
  }
  return s.journal.every(
    (e) =>
      e &&
      typeof e.id === "string" &&
      number(e.at) &&
      typeof e.title === "string" &&
      typeof e.text === "string" &&
      ["good", "warning", "neutral"].includes(e.tone),
  );
}

export function migrateSave(value: unknown): GameState | null {
  if (!validBase(value)) return null;
  const s = structuredClone(value);
  if (Number(s.version) === 1) {
    return {
      ...s,
      version: 2,
      family: null,
      familySerial: 0,
      claimedFamilyContracts: [],
    };
  }
  if (
    !Number.isSafeInteger(s.familySerial) ||
    s.familySerial < 0 ||
    !Array.isArray(s.claimedFamilyContracts)
  )
    return null;
  if (
    s.claimedFamilyContracts.some(
      (id) => !FAMILY_CONTRACTS.some((c) => c.id === id),
    ) ||
    new Set(s.claimedFamilyContracts).size !== s.claimedFamilyContracts.length
  )
    return null;
  if (
    s.operations.some(
      (op) => op.familyId !== undefined && typeof op.familyId !== "string",
    )
  )
    return null;
  if (s.family !== null) {
    const f = s.family;
    if (
      !f ||
      typeof f !== "object" ||
      typeof f.id !== "string" ||
      f.id !== "family-" + s.familySerial ||
      s.familySerial < 1 ||
      typeof f.name !== "string" ||
      f.name.length < 3 ||
      f.name.length > 24 ||
      !["shield", "crown", "anchor"].includes(f.emblem)
    )
      return null;
    if (
      ![f.foundedAt, f.xp, f.treasury, f.jobsCompleted, f.laundered].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      f.foundedAt < s.startedAt ||
      f.foundedAt > s.updatedAt
    )
      return null;
    if (
      !f.upgrades ||
      !FAMILY_UPGRADES.every(
        (u) =>
          Number.isInteger(f.upgrades[u.id]) &&
          f.upgrades[u.id] >= 0 &&
          f.upgrades[u.id] <= FAMILY_RULES.maxUpgrade,
      )
    )
      return null;
    if (
      !Array.isArray(f.contributions) ||
      f.contributions.length > 20 ||
      !f.contributions.every(
        (c) =>
          c &&
          Number.isSafeInteger(c.at) &&
          c.at >= f.foundedAt &&
          c.at <= s.updatedAt &&
          Number.isSafeInteger(c.amount) &&
          c.amount > 0,
      )
    )
      return null;
  }
  return s;
}

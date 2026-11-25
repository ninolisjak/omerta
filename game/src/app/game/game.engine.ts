import { BUILDINGS, CREW, JOBS, RULES } from "./game.config.ts";
import { FAMILY_RULES } from "./family.config.ts";
import {
  awardFamilyXp,
  executeFamilyCommand,
  familyCommandError,
  isFamilyCommand,
} from "./family.engine.ts";
import { recordEntry as entry } from "./game.events.ts";
import {
  storageCap,
  incomePerMinute,
  launderingYield,
} from "./game.economy.ts";
export {
  storageCap,
  incomePerMinute,
  launderingYield,
} from "./game.economy.ts";
import type {
  BuildingId,
  CrewId,
  GameCommand,
  GameState,
  Operation,
} from "./game.model.ts";

export function createGame(now: number): GameState {
  return {
    version: 2,
    family: null,
    familySerial: 0,
    claimedFamilyContracts: [],
    startedAt: now,
    updatedAt: now,
    roundEndsAt: now + RULES.roundDays * 86_400_000,
    nextPoliceAt: now + RULES.policeInterval,
    dirty: 1240,
    clean: 2450,
    respect: 12,
    favors: 3,
    heat: 12,
    buildings: {
      safehouse: 1,
      speakeasy: 0,
      laundry: 0,
      office: 0,
      poolhall: 0,
    },
    crew: { runner: 3, enforcer: 2, driver: 1, smuggler: 0 },
    operations: [],
    jobsCompleted: 0,
    totalLaundered: 0,
    journal: [
      {
        id: `welcome-${now}`,
        at: now,
        title: "Every empire starts somewhere.",
        text: "One block in Little Italy. Six loyal men. The rest is up to you.",
        tone: "neutral",
      },
    ],
  };
}
export function buildingCost(s: GameState, id: BuildingId): number {
  return Math.round(
    BUILDINGS.find((b) => b.id === id)!.cost * 1.65 ** s.buildings[id],
  );
}
export function availableCrew(s: GameState, id: CrewId): number {
  return (
    s.crew[id] - s.operations.reduce((n, op) => n + (op.crew?.[id] ?? 0), 0)
  );
}
function accrue(s: GameState, until: number): void {
  const minutes = Math.max(0, until - s.updatedAt) / 60_000;
  s.dirty = Math.min(storageCap(s), s.dirty + incomePerMinute(s) * minutes);
  s.heat = Math.max(
    0,
    s.heat - (RULES.heatDecayPerMinute + s.buildings.office * 0.5) * minutes,
  );
  s.updatedAt = until;
}
function complete(s: GameState, op: Operation): void {
  const at = op.endsAt;
  if (op.kind === "build") {
    const id = op.target as BuildingId;
    s.buildings[id]++;
    entry(
      s,
      at,
      "Open for business.",
      `${BUILDINGS.find((b) => b.id === id)!.name} is now level ${s.buildings[id]}.`,
    );
  } else if (op.kind === "recruit") {
    s.crew[op.target as CrewId]++;
    entry(
      s,
      at,
      "A new face at the table.",
      `Your ${op.target} has finished training and is ready for work.`,
    );
  } else if (op.kind === "job") {
    const job = JOBS.find((j) => j.id === op.target)!;
    s.dirty = Math.min(storageCap(s), s.dirty + job.reward);
    s.respect += job.respect;
    s.heat = Math.min(100, s.heat + job.heat);
    s.jobsCompleted++;
    if (s.jobsCompleted % 3 === 0) s.favors++;
    entry(
      s,
      at,
      "Business taken care of.",
      `${job.name}: $${job.reward} dirty money, +${job.respect} Respect, +${job.heat} Heat. Every third job earns a Favor.`,
    );
    if (s.family && op.familyId === s.family.id) {
      s.family.jobsCompleted++;
      awardFamilyXp(s, FAMILY_RULES.jobXp[job.id], at);
    }
  } else if (op.kind === "launder") {
    const clean = Math.floor(Number(op.target) * launderingYield(s));
    s.clean += clean;
    s.totalLaundered += clean;
    if (s.family && op.familyId === s.family.id) s.family.laundered += clean;
    s.heat = Math.max(0, s.heat - 4);
    entry(
      s,
      at,
      "Clean as a whistle.",
      `$${clean} clean money added to your books. Heat reduced by 4.`,
    );
  } else {
    s.heat = Math.max(0, s.heat - RULES.laylowReduction);
    entry(
      s,
      at,
      "The streets have cooled.",
      "Your crew kept a low profile. Heat reduced by 20.",
    );
  }
}

// Resolve events in time order. A front completed while offline earns only AFTER it opens.
export function advanceGame(previous: GameState, now: number): GameState {
  const s = structuredClone(previous);
  const end = Math.min(Math.max(now, s.updatedAt), s.roundEndsAt);
  while (s.updatedAt < end || s.operations.some((op) => op.endsAt <= end)) {
    const nextOperation = Math.min(...s.operations.map((op) => op.endsAt));
    if (s.nextPoliceAt <= s.updatedAt) {
      // Skip quiet checks without moving the original check cadence.
      // Offline and online updates must see the same police clock.
      const skipped =
        Math.floor((s.updatedAt - s.nextPoliceAt) / RULES.policeInterval) + 1;
      s.nextPoliceAt += skipped * RULES.policeInterval;
    }
    const policeAt = s.heat >= RULES.raidThreshold ? s.nextPoliceAt : Infinity;
    const next = Math.min(end, nextOperation, policeAt);
    accrue(s, next);
    const completed = s.operations.filter((op) => op.endsAt <= next);
    s.operations = s.operations.filter((op) => op.endsAt > next);
    completed.forEach((op) => complete(s, op));
    if (policeAt === next) {
      if (s.heat >= RULES.raidThreshold) {
        const seized = Math.floor(s.dirty * 0.2);
        s.dirty -= seized;
        s.heat = Math.max(0, s.heat - 30);
        // Only an idle enforcer can be arrested; assigned crews return consistently.
        const arrested = availableCrew(s, "enforcer") > 0;
        if (arrested) s.crew.enforcer--;
        entry(
          s,
          next,
          "The police came knocking.",
          `$${seized} seized.${arrested ? " One enforcer arrested." : ""} Heat reduced by 30.`,
          "warning",
        );
      }
      s.nextPoliceAt = next + RULES.policeInterval;
    }
    if (next === end) break;
  }
  return s;
}

export function commandError(
  s: GameState,
  command: GameCommand,
): string | null {
  if (s.updatedAt >= s.roundEndsAt)
    return "This round has ended. Start a new round from Settings.";
  if (isFamilyCommand(command)) return familyCommandError(s, command);
  if (command.type === "build") {
    if (s.operations.some((op) => op.kind === "build"))
      return "Your builder is busy. Let the current construction finish.";
    if (s.buildings[command.target] >= RULES.maxLevel)
      return "This front has reached its maximum level.";
    if (s.clean < buildingCost(s, command.target))
      return "You need more clean money for this front.";
  } else if (command.type === "recruit") {
    if (!s.buildings.poolhall)
      return "Build Eight Ball Social to recruit crew.";
    if (s.operations.some((op) => op.kind === "recruit"))
      return "The recruitment queue is occupied.";
    if (s.clean < CREW.find((c) => c.id === command.target)!.cost)
      return "You need more clean money to recruit.";
  } else if (command.type === "job") {
    if (s.operations.some((op) => op.kind === "job" || op.kind === "laylow"))
      return "Let your current street operation finish first.";
    const job = JOBS.find((j) => j.id === command.target)!;
    for (const [id, count] of Object.entries(job.crew))
      if (availableCrew(s, id as CrewId) < count!)
        return `You need ${count} available ${id}${count! > 1 ? "s" : ""} for this job.`;
  } else if (command.type === "launder") {
    if (!s.buildings.laundry)
      return "Build Bellini & Sons to start laundering.";
    if (s.operations.some((op) => op.kind === "launder"))
      return "A laundering batch is already running.";
    if (s.dirty < laundryBatch(s))
      return `You need $${laundryBatch(s)} dirty money for a batch.`;
  } else if (command.type === "bribe") {
    if (!s.buildings.office)
      return "Build the back-room office to arrange bribes.";
    if (s.heat < 1) return "The captain has no reason to bother you right now.";
    if (s.clean < RULES.bribeCost || s.favors < 1)
      return "A bribe costs $200 clean money and 1 Favor.";
  } else {
    if (s.operations.some((op) => op.kind === "job" || op.kind === "laylow"))
      return "Your crew must finish their street operation first.";
    if (s.heat < 1) return "Your crew is already under the radar.";
  }
  return null;
}
export function laundryBatch(s: GameState): number {
  return RULES.launderingBatch + Math.max(0, s.buildings.laundry - 1) * 100;
}
export function executeCommand(
  previous: GameState,
  command: GameCommand,
  now: number,
): { state: GameState; error: string | null } {
  const s = advanceGame(previous, now);
  const error = commandError(s, command);
  if (error) return { state: s, error };
  if (isFamilyCommand(command)) {
    executeFamilyCommand(s, command, now);
    return { state: s, error: null };
  }
  let op: Pick<Operation, "kind" | "target" | "label" | "crew">;
  let seconds: number;
  if (command.type === "build") {
    const building = BUILDINGS.find((b) => b.id === command.target)!;
    s.clean -= buildingCost(s, command.target);
    seconds = building.seconds * (s.buildings[command.target] + 1);
    op = {
      kind: "build",
      target: command.target,
      label: `${building.name} · level ${s.buildings[command.target] + 1}`,
    };
  } else if (command.type === "recruit") {
    const unit = CREW.find((c) => c.id === command.target)!;
    s.clean -= unit.cost;
    seconds = Math.max(
      5,
      unit.seconds * (1 - (s.buildings.poolhall - 1) * 0.1),
    );
    op = {
      kind: "recruit",
      target: command.target,
      label: `Training a ${unit.name.toLowerCase()}`,
    };
  } else if (command.type === "job") {
    const job = JOBS.find((j) => j.id === command.target)!;
    const crew = { ...job.crew };
    const driver = availableCrew(s, "driver") > 0;
    if (driver) crew.driver = 1;
    seconds = job.seconds * (driver ? 0.8 : 1);
    op = { kind: "job", target: job.id, label: job.name, crew };
  } else if (command.type === "launder") {
    const batch = laundryBatch(s);
    s.dirty -= batch;
    seconds = RULES.launderingSeconds;
    op = {
      kind: "launder",
      target: String(batch),
      label: `Cleaning $${batch} through Bellini & Sons`,
    };
  } else if (command.type === "laylow") {
    seconds = RULES.laylowSeconds;
    op = { kind: "laylow", target: "", label: "Keeping a low profile" };
  } else {
    s.clean -= RULES.bribeCost;
    s.favors--;
    s.heat = Math.max(0, s.heat - RULES.bribeReduction);
    entry(
      s,
      now,
      "An understanding was reached.",
      "The captain accepted $200 and a Favor. Heat reduced by 25.",
    );
    return { state: s, error: null };
  }
  s.operations.push({
    ...op,
    id: `${now}-${command.type}`,
    startedAt: now,
    endsAt: now + seconds * 1000,
    ...(s.family ? { familyId: s.family.id } : {}),
  });
  return { state: s, error: null };
}

import { RULES } from "./game.config.ts";
import { FAMILY_RULES } from "./family.config.ts";
import type {
  CrewId,
  GameState,
  JobAssignment,
  JobDefinition,
  JobPreview,
} from "./game.model.ts";

export function availableCrew(s: GameState, id: CrewId): number {
  return (
    s.crew[id] -
    s.operations.reduce((count, op) => count + (op.crew?.[id] ?? 0), 0)
  );
}
export function maxJobTeams(
  s: GameState,
  job: JobDefinition,
  escorts = 0,
): number {
  return Math.max(
    0,
    Math.min(
      RULES.maxTeamsPerJob,
      ...Object.entries(job.crew).map(([id, required]) =>
        Math.floor(
          (availableCrew(s, id as CrewId) - (id === "enforcer" ? escorts : 0)) /
            required!,
        ),
      ),
    ),
  );
}
export function maxJobEscorts(
  s: GameState,
  job: JobDefinition,
  teams: number,
): number {
  return Math.max(
    0,
    Math.min(
      teams * RULES.maxEscortsPerTeam,
      availableCrew(s, "enforcer") - (job.crew.enforcer ?? 0) * teams,
    ),
  );
}
export function previewJob(
  s: GameState,
  job: JobDefinition,
  assignment: JobAssignment = {},
): JobPreview {
  // UI drafts can be temporarily empty/invalid. The command validator checks raw inputs.
  const teams =
    Number.isSafeInteger(assignment.teams) && assignment.teams! > 0
      ? Math.min(assignment.teams!, RULES.maxTeamsPerJob)
      : 1;
  const escorts =
    Number.isSafeInteger(assignment.escorts) && assignment.escorts! >= 0
      ? Math.min(assignment.escorts!, teams * RULES.maxEscortsPerTeam)
      : 0;
  const crew: Partial<Record<CrewId, number>> = {};
  for (const [id, required] of Object.entries(job.crew))
    crew[id as CrewId] = required! * teams;
  if (escorts) crew.enforcer = (crew.enforcer ?? 0) + escorts;
  const drivers = Math.max(0, Math.min(availableCrew(s, "driver"), teams));
  if (drivers) crew.driver = drivers;
  const baseHeat = job.heat * teams;
  const heat = Math.max(
    Math.ceil(baseHeat * (1 - RULES.maxEscortHeatReduction)),
    baseHeat - escorts * RULES.heatReductionPerEscort,
  );
  return {
    teams,
    escorts,
    drivers,
    crew,
    reward: job.reward * teams,
    respect: job.respect * teams,
    heat,
    familyXp: FAMILY_RULES.jobXp[job.id] * teams,
    seconds:
      Math.round(
        job.seconds * (1 - (RULES.driverSpeedBonus * drivers) / teams) * 1000,
      ) / 1000,
  };
}
export function jobAssignmentError(
  s: GameState,
  job: JobDefinition,
  assignment: JobAssignment = {},
): string | null {
  if (s.operations.some((op) => op.kind === "laylow"))
    return "Let your current street operation finish before sending a crew.";
  if (
    s.operations.filter((op) => op.kind === "job").length >= RULES.maxStreetJobs
  )
    return `All ${RULES.maxStreetJobs} street operation slots are busy.`;
  const teams = assignment.teams ?? 1;
  const escorts = assignment.escorts ?? 0;
  if (!Number.isSafeInteger(teams) || teams < 1 || teams > RULES.maxTeamsPerJob)
    return `Choose 1–${RULES.maxTeamsPerJob} teams.`;
  if (
    !Number.isSafeInteger(escorts) ||
    escorts < 0 ||
    escorts > teams * RULES.maxEscortsPerTeam
  )
    return `Choose 0–${teams * RULES.maxEscortsPerTeam} enforcers for cover.`;
  const plan = previewJob(s, job, assignment);
  for (const [id, required] of Object.entries(plan.crew)) {
    if (availableCrew(s, id as CrewId) < required!)
      return `You need ${required} available ${id}${required! > 1 ? "s" : ""} for this deployment.`;
  }
  return null;
}

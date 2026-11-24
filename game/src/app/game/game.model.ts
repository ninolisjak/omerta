export type BuildingId =
  | "safehouse"
  | "speakeasy"
  | "laundry"
  | "office"
  | "poolhall";
export type CrewId = "runner" | "enforcer" | "driver" | "smuggler";
export type JobId = "collection" | "shipment" | "rival";
export type TaskKind = "build" | "recruit" | "job" | "launder" | "laylow";
export interface Operation {
  id: string;
  kind: TaskKind;
  target: string;
  label: string;
  startedAt: number;
  endsAt: number;
  crew?: Partial<Record<CrewId, number>>;
}
export interface Entry {
  id: string;
  at: number;
  title: string;
  text: string;
  tone: "good" | "warning" | "neutral";
}
export interface GameState {
  version: 1;
  startedAt: number;
  updatedAt: number;
  roundEndsAt: number;
  nextPoliceAt: number;
  dirty: number;
  clean: number;
  respect: number;
  favors: number;
  heat: number;
  buildings: Record<BuildingId, number>;
  crew: Record<CrewId, number>;
  operations: Operation[];
  journal: Entry[];
  jobsCompleted: number;
  totalLaundered: number;
}
export interface BuildingDefinition {
  id: BuildingId;
  name: string;
  type: string;
  icon: string;
  description: string;
  effect: string;
  cost: number;
  seconds: number;
}
export interface CrewDefinition {
  id: CrewId;
  name: string;
  role: string;
  description: string;
  icon: string;
  cost: number;
  seconds: number;
}
export interface JobDefinition {
  id: JobId;
  name: string;
  district: string;
  description: string;
  seconds: number;
  reward: number;
  respect: number;
  heat: number;
  crew: Partial<Record<CrewId, number>>;
  icon: string;
}
export type GameCommand =
  | { type: "build"; target: BuildingId }
  | { type: "recruit"; target: CrewId }
  | { type: "job"; target: JobId }
  | { type: "launder" | "bribe" | "laylow" };

import type {
  BuildingDefinition,
  CrewDefinition,
  JobDefinition,
} from "./game.model";

// All tuning lives here. Components never decide prices or rewards.
export const RULES = {
  roundDays: 21,
  maxLevel: 5,
  launderingBatch: 400,
  launderingYield: 0.85,
  launderingSeconds: 20,
  dirtyPerMinutePerLevel: 90,
  heatDecayPerMinute: 1.5,
  raidThreshold: 70,
  policeInterval: 60_000,
  bribeCost: 200,
  bribeReduction: 25,
  laylowSeconds: 25,
  laylowReduction: 20,
  maxStreetJobs: 3,
  maxTeamsPerJob: 10,
  maxEscortsPerTeam: 2,
  heatReductionPerEscort: 2,
  maxEscortHeatReduction: 0.5,
  driverSpeedBonus: 0.2,
} as const;

export const BUILDINGS: BuildingDefinition[] = [
  {
    id: "safehouse",
    name: "The safehouse",
    type: "HEADQUARTERS",
    icon: "shield",
    description: "A locked door. A trusted face. Somewhere to call your own.",
    effect: "+2,000 dirty money storage per level",
    cost: 500,
    seconds: 25,
  },
  {
    id: "speakeasy",
    name: "The Velvet Room",
    type: "SPEAKEASY",
    icon: "glass",
    description: "The drinks are illegal. The margins are excellent.",
    effect: "+$90 dirty money / minute per level",
    cost: 400,
    seconds: 25,
  },
  {
    id: "laundry",
    name: "Bellini & Sons",
    type: "LAUNDERING FRONT",
    icon: "laundry",
    description: "Impeccable tailoring. Even cleaner books.",
    effect: "Launder $400 at 85% return; +$100 batch per extra level",
    cost: 350,
    seconds: 20,
  },
  {
    id: "poolhall",
    name: "Eight Ball Social",
    type: "RECRUITMENT HALL",
    icon: "crew",
    description: "Good men are hard to find. Start at the pool table.",
    effect: "Unlock crew training; 10% faster per extra level",
    cost: 300,
    seconds: 20,
  },
  {
    id: "office",
    name: "The back-room office",
    type: "INFLUENCE",
    icon: "briefcase",
    description: "The captain has a price. Everybody does.",
    effect: "Unlock bribes; +0.5 Heat decay / minute per level",
    cost: 450,
    seconds: 30,
  },
];
export const CREW: CrewDefinition[] = [
  {
    id: "runner",
    name: "Runner",
    role: "COLLECTION",
    description:
      "One runner per collection team. Each team collects $300; pair runners with smugglers for $650 shipping runs.",
    icon: "runner",
    cost: 100,
    seconds: 15,
  },
  {
    id: "enforcer",
    name: "Enforcer",
    role: "MUSCLE",
    description:
      "Two per rival-hit team. Extra enforcers can cover any job: −2 Heat each, up to half the deployment's Heat.",
    icon: "shield",
    cost: 200,
    seconds: 25,
  },
  {
    id: "driver",
    name: "Driver",
    role: "TRANSPORT",
    description:
      "One per team for the full 20% travel bonus. Extra drivers cover bigger squads and simultaneous jobs.",
    icon: "car",
    cost: 150,
    seconds: 20,
  },
  {
    id: "smuggler",
    name: "Smuggler",
    role: "CONTRABAND",
    description:
      "One smuggler and one runner per shipping team. Each additional team brings another $650 shipment.",
    icon: "box",
    cost: 250,
    seconds: 30,
  },
];
export const JOBS: JobDefinition[] = [
  {
    id: "collection",
    name: "A friendly reminder",
    district: "LITTLE ITALY",
    description:
      "The neighborhood shops owe you a small protection payment. Send someone they know.",
    seconds: 30,
    reward: 300,
    respect: 3,
    heat: 8,
    crew: { runner: 1 },
    icon: "coins",
  },
  {
    id: "shipment",
    name: "Something off the boat",
    district: "THE DOCKLANDS",
    description:
      "An unmarked crate. A moonless pier. A customs officer looking the other way.",
    seconds: 50,
    reward: 650,
    respect: 6,
    heat: 15,
    crew: { smuggler: 1, runner: 1 },
    icon: "anchor",
  },
  {
    id: "rival",
    name: "Send a message",
    district: "ASH ROW",
    description:
      "A small rival crew is making noise. Remind them whose neighborhood this is.",
    seconds: 45,
    reward: 480,
    respect: 10,
    heat: 22,
    crew: { enforcer: 2 },
    icon: "target",
  },
];
export const FACTIONS = [
  {
    name: "Old Guard",
    motto: "Blood. Honor. Tradition.",
    bonus: "Defense & Family cohesion",
    icon: "shield",
  },
  {
    name: "New Blood",
    motto: "The future belongs to the bold.",
    bonus: "Speed & smuggling routes",
    icon: "bolt",
  },
];

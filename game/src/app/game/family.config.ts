import type { FamilyContractId, FamilyUpgradeId } from "./game.model.ts";

// Learning-friendly progression: a founder can reach level 2 after three collections.
export const FAMILY_RULES = {
  levels: [0, 60, 160, 320, 550, 850],
  ranks: [
    "New blood",
    "Street name",
    "Neighborhood power",
    "Respected outfit",
    "City institution",
    "Underworld dynasty",
  ],
  jobXp: { collection: 25, shipment: 50, rival: 40 },
  maxUpgrade: 3,
  storagePerLevel: 1000,
  incomeBonusPerLevel: 0.1,
  laundryBonusPerLevel: 0.03,
} as const;
export const FAMILY_UPGRADES: {
  id: FamilyUpgradeId;
  name: string;
  icon: string;
  description: string;
  cost: number;
  level: number;
}[] = [
  {
    id: "vault",
    name: "Hidden vault",
    icon: "lock",
    description: "+1,000 dirty money storage per upgrade.",
    cost: 200,
    level: 2,
  },
  {
    id: "network",
    name: "Street network",
    icon: "crew",
    description: "+10% speakeasy income per upgrade.",
    cost: 350,
    level: 3,
  },
  {
    id: "books",
    name: "Counting room",
    icon: "laundry",
    description: "+3 percentage points of laundering return per upgrade.",
    cost: 500,
    level: 4,
  },
];
export const FAMILY_CONTRACTS: {
  id: FamilyContractId;
  name: string;
  description: string;
  metric: "jobsCompleted" | "laundered";
  goal: number;
  level: number;
  xp: number;
  treasury: number;
  icon: string;
}[] = [
  {
    id: "first-steps",
    name: "Make an introduction",
    description: "Complete 3 jobs for your Family.",
    metric: "jobsCompleted",
    goal: 3,
    level: 1,
    xp: 40,
    treasury: 250,
    icon: "target",
  },
  {
    id: "clean-books",
    name: "A respectable reputation",
    description: "Launder $680 clean for your Family.",
    metric: "laundered",
    goal: 680,
    level: 2,
    xp: 60,
    treasury: 350,
    icon: "laundry",
  },
  {
    id: "street-name",
    name: "A name on every corner",
    description: "Complete 8 jobs for your Family.",
    metric: "jobsCompleted",
    goal: 8,
    level: 3,
    xp: 100,
    treasury: 500,
    icon: "crown",
  },
];

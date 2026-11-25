import {
  FAMILY_CONTRACTS,
  FAMILY_RULES,
  FAMILY_UPGRADES,
} from "./family.config.ts";
import { recordEntry } from "./game.events.ts";
import { storageCap } from "./game.economy.ts";
import type {
  FamilyCommand,
  FamilyState,
  FamilyUpgradeId,
  GameCommand,
  GameState,
} from "./game.model.ts";

export function familyLevel(xp: number): number {
  return FAMILY_RULES.levels.filter((threshold) => xp >= threshold).length;
}
export function familyProgress(family: FamilyState): {
  level: number;
  rank: string;
  current: number;
  required: number;
  percent: number;
  max: boolean;
} {
  const level = familyLevel(family.xp);
  const start = FAMILY_RULES.levels[level - 1];
  const next = FAMILY_RULES.levels[level];
  return {
    level,
    rank: FAMILY_RULES.ranks[level - 1],
    current: family.xp - start,
    required: next === undefined ? 0 : next - start,
    percent:
      next === undefined ? 100 : ((family.xp - start) / (next - start)) * 100,
    max: next === undefined,
  };
}
export function familyUpgradeCost(
  family: FamilyState,
  target: FamilyUpgradeId,
): number {
  return (
    FAMILY_UPGRADES.find((upgrade) => upgrade.id === target)!.cost *
    (family.upgrades[target] + 1)
  );
}
export function isFamilyCommand(
  command: GameCommand,
): command is FamilyCommand {
  return [
    "foundFamily",
    "contributeFamily",
    "claimFamilyContract",
    "upgradeFamily",
    "disbandFamily",
  ].includes(command.type);
}
export function familyCommandError(
  s: GameState,
  command: FamilyCommand,
): string | null {
  if (command.type === "foundFamily") {
    if (s.family) return "You already lead a Family.";
    const name = command.name.trim();
    if (
      name.length < 3 ||
      name.length > 24 ||
      !/^[\p{L}\p{N}][\p{L}\p{N} '\u2019-]+$/u.test(name)
    )
      return "Use 3–24 letters, numbers, spaces, apostrophes, or hyphens.";
    if (!["shield", "crown", "anchor"].includes(command.emblem))
      return "Choose a Family emblem.";
    return null;
  }
  const family = s.family;
  if (!family) return "Found a Family first.";
  if (command.type === "contributeFamily") {
    if (!Number.isSafeInteger(command.amount) || command.amount <= 0)
      return "Enter a whole-dollar contribution greater than zero.";
    if (command.amount > s.clean) return "You do not have enough clean money.";
  } else if (command.type === "claimFamilyContract") {
    const contract = FAMILY_CONTRACTS.find(
      (item) => item.id === command.target,
    );
    if (!contract) return "This contract does not exist.";
    if (s.claimedFamilyContracts.includes(contract.id))
      return "This contract was already claimed this round.";
    if (familyLevel(family.xp) < contract.level)
      return `Reach Family level ${contract.level} first.`;
    if (family[contract.metric] < contract.goal)
      return "Complete the contract objective first.";
  } else if (command.type === "upgradeFamily") {
    const upgrade = FAMILY_UPGRADES.find((item) => item.id === command.target);
    if (!upgrade) return "This upgrade does not exist.";
    if (family.upgrades[upgrade.id] >= FAMILY_RULES.maxUpgrade)
      return "This headquarters upgrade is maxed out.";
    const required = upgrade.level + family.upgrades[upgrade.id];
    if (familyLevel(family.xp) < required)
      return `Reach Family level ${required} first.`;
    if (family.treasury < familyUpgradeCost(family, upgrade.id))
      return "Contribute more clean money to the Family treasury.";
  } else if (s.operations.some((op) => op.familyId === family.id)) {
    return "Wait for your Family operations to finish before disbanding.";
  }
  return null;
}
export function awardFamilyXp(s: GameState, xp: number, at: number): void {
  if (!s.family) return;
  const before = familyLevel(s.family.xp);
  s.family.xp += xp;
  const level = familyLevel(s.family.xp);
  if (level > before)
    recordEntry(
      s,
      at,
      `Family level ${level} unlocked!`,
      `${s.family.name} is now ${FAMILY_RULES.ranks[level - 1].toLowerCase()}. Visit headquarters for new upgrades.`,
    );
}
export function executeFamilyCommand(
  s: GameState,
  command: FamilyCommand,
  now: number,
): void {
  if (command.type === "foundFamily") {
    s.familySerial++;
    s.family = {
      id: `family-${s.familySerial}`,
      name: command.name.trim().replace(/\s+/g, " "),
      emblem: command.emblem,
      foundedAt: now,
      xp: 0,
      treasury: 0,
      jobsCompleted: 0,
      laundered: 0,
      upgrades: { vault: 0, network: 0, books: 0 },
      contributions: [],
    };
    recordEntry(
      s,
      now,
      "A new name in Blackwater.",
      `The ${s.family.name} Family has been founded. You are the Don. Run jobs to earn Family XP.`,
    );
  } else if (command.type === "contributeFamily") {
    const family = s.family!;
    s.clean -= command.amount;
    family.treasury += command.amount;
    family.contributions.unshift({ at: now, amount: command.amount });
    family.contributions = family.contributions.slice(0, 20);
    recordEntry(
      s,
      now,
      "Investing in the name.",
      `$${command.amount} clean money transferred into the Family treasury.`,
    );
  } else if (command.type === "claimFamilyContract") {
    const contract = FAMILY_CONTRACTS.find(
      (item) => item.id === command.target,
    )!;
    s.claimedFamilyContracts.push(contract.id);
    s.family!.treasury += contract.treasury;
    recordEntry(
      s,
      now,
      "Family contract complete.",
      `${contract.name}: +${contract.xp} Family XP and $${contract.treasury} into the treasury.`,
    );
    awardFamilyXp(s, contract.xp, now);
  } else if (command.type === "upgradeFamily") {
    const upgrade = FAMILY_UPGRADES.find((item) => item.id === command.target)!;
    s.family!.treasury -= familyUpgradeCost(s.family!, command.target);
    s.family!.upgrades[command.target]++;
    recordEntry(
      s,
      now,
      "Headquarters upgraded.",
      `${upgrade.name} is now tier ${s.family!.upgrades[command.target]}. ${upgrade.description}`,
    );
  } else {
    const name = s.family!.name;
    s.family = null;
    s.dirty = Math.min(s.dirty, storageCap(s));
    recordEntry(
      s,
      now,
      "Back to the streets.",
      `${name} has been disbanded. Its treasury, XP, and upgrades are forfeited. Claimed contracts stay claimed for this round.`,
      "neutral",
    );
  }
}

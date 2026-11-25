import { RULES } from "./game.config.ts";
import { FAMILY_RULES } from "./family.config.ts";
import type { GameState } from "./game.model.ts";

// Both personal operations and Family commands use these same economy calculations.
export function storageCap(s: GameState): number {
  return (
    5000 +
    s.buildings.safehouse * 2000 +
    (s.family?.upgrades.vault ?? 0) * FAMILY_RULES.storagePerLevel
  );
}
export function incomePerMinute(s: GameState): number {
  return (
    Math.round(
      s.buildings.speakeasy *
        RULES.dirtyPerMinutePerLevel *
        (1 +
          (s.family?.upgrades.network ?? 0) *
            FAMILY_RULES.incomeBonusPerLevel) *
        100,
    ) / 100
  );
}
export function launderingYield(s: GameState): number {
  return (
    RULES.launderingYield +
    (s.family?.upgrades.books ?? 0) * FAMILY_RULES.laundryBonusPerLevel
  );
}

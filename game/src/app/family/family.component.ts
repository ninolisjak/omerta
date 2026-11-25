import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { IconComponent } from "../ui/icon.component";
import { GameStore } from "../game/game.store";
import { commandError } from "../game/game.engine";
import { familyProgress, familyUpgradeCost } from "../game/family.engine";
import {
  FAMILY_CONTRACTS,
  FAMILY_RULES,
  FAMILY_UPGRADES,
} from "../game/family.config";
import type {
  FamilyEmblem,
  FamilyUpgradeId,
  GameCommand,
} from "../game/game.model";

@Component({
  selector: "o-family",
  imports: [IconComponent, DecimalPipe, DatePipe],
  templateUrl: "./family.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyComponent {
  readonly game = inject(GameStore);
  readonly navigate = output<string>();
  readonly name = signal("");
  readonly emblem = signal<FamilyEmblem>("shield");
  readonly donation = signal(100);
  readonly confirmDisband = signal(false);
  readonly contracts = FAMILY_CONTRACTS;
  readonly upgrades = FAMILY_UPGRADES;
  readonly rules = FAMILY_RULES;
  readonly emblems: { id: FamilyEmblem; name: string }[] = [
    { id: "shield", name: "Loyalty" },
    { id: "crown", name: "Ambition" },
    { id: "anchor", name: "Roots" },
  ];
  readonly progress = computed(() =>
    this.game.state().family ? familyProgress(this.game.state().family!) : null,
  );
  readonly createCommand = computed(
    (): GameCommand => ({
      type: "foundFamily",
      name: this.name(),
      emblem: this.emblem(),
    }),
  );
  reason(command: GameCommand): string | null {
    return commandError(this.game.state(), command);
  }
  cost(id: FamilyUpgradeId): number {
    return familyUpgradeCost(this.game.state().family!, id);
  }
  percent(value: number, goal: number): number {
    return Math.min(100, (value / goal) * 100);
  }
  setName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }
  setDonation(event: Event): void {
    this.donation.set(Number((event.target as HTMLInputElement).value));
  }
  found(event: Event): void {
    event.preventDefault();
    this.game.dispatch(this.createCommand());
  }
  contribute(event: Event): void {
    event.preventDefault();
    this.game.dispatch({ type: "contributeFamily", amount: this.donation() });
  }
  disband(): void {
    this.game.dispatch({ type: "disbandFamily" });
    this.confirmDisband.set(false);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from "@angular/core";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
import { OperationsComponent } from "../operations/operations.component";
import { CREW, RULES } from "../game/game.config";
import { availableCrew, commandError } from "../game/game.engine";
import type { CrewId, GameCommand } from "../game/game.model";
@Component({
  selector: "o-crew",
  imports: [IconComponent, OperationsComponent],
  templateUrl: "./crew.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrewComponent {
  readonly game = inject(GameStore);
  readonly navigate = output<string>();
  readonly crew = CREW;
  readonly rules = RULES;
  useCase(id: CrewId): string {
    const count = this.available(id);
    if (id === "runner")
      return `${count} idle: up to ${Math.min(count, RULES.maxTeamsPerJob)} collection teams in one deployment.`;
    if (id === "enforcer")
      return `${count} idle: ${Math.floor(count / 2)} rival-hit teams, or assign them as Heat-reducing cover.`;
    if (id === "driver")
      return `${count} idle: full speed coverage for ${count} teams across active deployments.`;
    return `${count} idle: ${Math.min(count, this.available("runner"), RULES.maxTeamsPerJob)} shipping teams with your available runners.`;
  }
  available(id: CrewId) {
    return availableCrew(this.game.state(), id);
  }
  reason(command: GameCommand) {
    return commandError(this.game.state(), command);
  }
  pending(kind: string, target?: string) {
    return this.game
      .state()
      .operations.some(
        (op) => op.kind === kind && (!target || op.target === target),
      );
  }
}

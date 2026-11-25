import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from "@angular/core";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
import { OperationsComponent } from "../operations/operations.component";
import { CREW } from "../game/game.config";
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

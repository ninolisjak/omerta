import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
import { OperationsComponent } from "../operations/operations.component";
import { BUILDINGS, RULES } from "../game/game.config";
import {
  buildingCost,
  commandError,
  laundryBatch,
  launderingYield,
} from "../game/game.engine";
import type { BuildingId, GameCommand } from "../game/game.model";
@Component({
  selector: "o-fronts",
  imports: [DecimalPipe, IconComponent, OperationsComponent],
  templateUrl: "./fronts.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontsComponent {
  readonly game = inject(GameStore);
  readonly buildings = BUILDINGS;
  readonly rules = RULES;
  cost(id: BuildingId) {
    return buildingCost(this.game.state(), id);
  }
  reason(command: GameCommand) {
    return commandError(this.game.state(), command);
  }
  batch() {
    return laundryBatch(this.game.state());
  }
  yield() {
    return launderingYield(this.game.state());
  }
  pending(kind: string, target?: string) {
    return this.game
      .state()
      .operations.some(
        (op) => op.kind === kind && (!target || op.target === target),
      );
  }
}

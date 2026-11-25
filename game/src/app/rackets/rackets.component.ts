import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
import { OperationsComponent } from "../operations/operations.component";
import { JOBS, RULES } from "../game/game.config";
import { FAMILY_RULES } from "../game/family.config";
import {
  availableCrew,
  commandError,
  laundryBatch,
  launderingYield,
} from "../game/game.engine";
import type { CrewId, GameCommand, JobDefinition } from "../game/game.model";
@Component({
  selector: "o-rackets",
  imports: [DecimalPipe, IconComponent, OperationsComponent],
  templateUrl: "./rackets.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacketsComponent {
  readonly game = inject(GameStore);
  readonly jobs = JOBS;
  readonly rules = RULES;
  readonly familyRules = FAMILY_RULES;
  available(id: CrewId) {
    return availableCrew(this.game.state(), id);
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
  jobCrew(job: JobDefinition) {
    return Object.entries(job.crew)
      .map(([name, count]) => count + " " + name + (count > 1 ? "s" : ""))
      .join(" + ");
  }
  jobSeconds(job: JobDefinition) {
    return job.seconds * (this.available("driver") > 0 ? 0.8 : 1);
  }
}

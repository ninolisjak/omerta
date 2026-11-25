import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
@Component({
  selector: "o-reports",
  imports: [DecimalPipe, DatePipe, IconComponent],
  templateUrl: "./reports.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  readonly game = inject(GameStore);
}

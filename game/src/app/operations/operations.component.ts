import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Operation } from "../game/game.model";
import { IconComponent } from "../ui/icon.component";
import { countdown, progress } from "../ui/format";

@Component({
  selector: "o-operations",
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (operations().length) {
      <div class="operations-list">
        @for (op of operations(); track op.id) {
          <div class="operation-row">
            <div class="operation-icon"><o-icon [name]="icons[op.kind]" /></div>
            <div class="operation-info">
              <div class="operation-heading">
                <span>{{ op.label }}</span
                ><time>{{ countdown(op.endsAt - now()) }}</time>
              </div>
              <div
                class="operation-track"
                role="progressbar"
                [attr.aria-label]="op.label"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="progress(op.startedAt, op.endsAt, now())"
              >
                <i
                  [style.width.%]="progress(op.startedAt, op.endsAt, now())"
                ></i>
              </div>
              <span class="operation-type">{{ labels[op.kind] }}</span>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="quiet-operations">
        <span class="quiet-icon"><o-icon name="clock" /></span>
        <div>
          <strong>Quiet streets. Busy minds.</strong>
          <p>Build a front or send your crew on a job to get things moving.</p>
        </div>
        <span class="quiet-dots" aria-hidden="true">···</span>
      </div>
    }
  `,
})
export class OperationsComponent {
  readonly operations = input.required<Operation[]>();
  readonly now = input.required<number>();
  readonly countdown = countdown;
  readonly progress = progress;
  readonly icons = {
    build: "building",
    recruit: "crew",
    job: "target",
    launder: "laundry",
    laylow: "eye",
  };
  readonly labels = {
    build: "CONSTRUCTION",
    recruit: "RECRUITMENT",
    job: "CREW ON THE STREET",
    launder: "LAUNDERING",
    laylow: "LAYING LOW",
  };
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { GameStore } from "../game/game.store";
import { IconComponent } from "../ui/icon.component";
import { OperationsComponent } from "../operations/operations.component";
import { JOBS, RULES } from "../game/game.config";
import { maxJobTeams, maxJobEscorts, previewJob } from "../game/crew-planner";
import {
  commandError,
  laundryBatch,
  launderingYield,
} from "../game/game.engine";
import type { GameCommand, JobDefinition, JobId } from "../game/game.model";
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
  readonly assignments = signal<
    Record<JobId, { teams: number; escorts: number }>
  >({
    collection: { teams: 1, escorts: 0 },
    shipment: { teams: 1, escorts: 0 },
    rival: { teams: 1, escorts: 0 },
  });
  readonly activeJobs = computed(
    () => this.game.state().operations.filter((op) => op.kind === "job").length,
  );
  preview(job: JobDefinition) {
    return previewJob(this.game.state(), job, this.assignments()[job.id]);
  }
  maxTeams(job: JobDefinition) {
    return maxJobTeams(this.game.state(), job);
  }
  maxEscorts(job: JobDefinition) {
    return maxJobEscorts(
      this.game.state(),
      job,
      this.assignments()[job.id].teams,
    );
  }
  jobCommand(job: JobDefinition): GameCommand {
    return { type: "job", target: job.id, ...this.assignments()[job.id] };
  }
  changeTeams(job: JobDefinition, teams: number): void {
    this.assignments.update((current) => ({
      ...current,
      [job.id]: {
        teams,
        escorts: Math.min(
          current[job.id].escorts,
          maxJobEscorts(this.game.state(), job, teams),
        ),
      },
    }));
  }
  changeEscorts(job: JobDefinition, escorts: number): void {
    this.assignments.update((current) => ({
      ...current,
      [job.id]: { ...current[job.id], escorts },
    }));
  }
  inputTeams(job: JobDefinition, event: Event): void {
    this.changeTeams(job, Number((event.target as HTMLInputElement).value));
  }
  inputEscorts(job: JobDefinition, event: Event): void {
    this.changeEscorts(job, Number((event.target as HTMLInputElement).value));
  }
  crewSummary(job: JobDefinition): string {
    return Object.entries(this.preview(job).crew)
      .map(([name, count]) => `${count} ${name}${count! > 1 ? "s" : ""}`)
      .join(" · ");
  }
  storageOverflow(job: JobDefinition): number {
    return Math.max(
      0,
      Math.ceil(
        this.game.state().dirty +
          this.preview(job).reward -
          this.game.capacity(),
      ),
    );
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
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { DecimalPipe, DatePipe } from "@angular/common";
import { GameStore } from "./game/game.store";
import { BUILDINGS, CREW, FACTIONS, JOBS, RULES } from "./game/game.config";
import {
  availableCrew,
  buildingCost,
  commandError,
  laundryBatch,
} from "./game/game.engine";
import type {
  BuildingId,
  CrewId,
  GameCommand,
  JobDefinition,
} from "./game/game.model";
import { IconComponent } from "./ui/icon.component";
import { CityComponent } from "./city/city.component";
import { OperationsComponent } from "./operations/operations.component";
import { countdown } from "./ui/format";

type View =
  | "overview"
  | "city"
  | "fronts"
  | "crew"
  | "rackets"
  | "family"
  | "reports";
@Component({
  selector: "omerta-app",
  imports: [
    DecimalPipe,
    DatePipe,
    IconComponent,
    CityComponent,
    OperationsComponent,
  ],
  templateUrl: "./app.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly game = inject(GameStore);
  readonly view = signal<View>("overview");
  readonly modal = signal<"guide" | "settings" | null>(null);
  readonly guideStep = signal(0);
  readonly confirmReset = signal(false);
  readonly rainOn = signal(false);
  readonly motion = signal(true);
  readonly mobileMenu = signal(false);
  readonly buildings = BUILDINGS;
  readonly crew = CREW;
  readonly jobs = JOBS;
  readonly factions = FACTIONS;
  readonly rules = RULES;
  readonly countdown = countdown;
  readonly nav = [
    { id: "overview" as View, label: "Overview", icon: "grid" },
    { id: "city" as View, label: "City map", icon: "map" },
    { id: "fronts" as View, label: "Your fronts", icon: "building" },
    { id: "crew" as View, label: "The crew", icon: "crew" },
    { id: "rackets" as View, label: "Rackets & jobs", icon: "target" },
    { id: "family" as View, label: "The Families", icon: "shield" },
  ];
  readonly headings: Record<
    View,
    { eyebrow: string; title: string; subtitle: string }
  > = {
    overview: {
      eyebrow: "YOUR EMPIRE, AT A GLANCE",
      title: "Every empire starts with a block.",
      subtitle: "The rain hasn’t stopped. Neither should you.",
    },
    city: {
      eyebrow: "BLACKWATER • CITY INTELLIGENCE",
      title: "A city full of opportunity.",
      subtitle: "Know the streets. Know who walks them.",
    },
    fronts: {
      eyebrow: "THE LEGITIMATE SIDE OF BUSINESS",
      title: "A respectable establishment.",
      subtitle: "What happens behind the counter is your business.",
    },
    crew: {
      eyebrow: "LOYALTY IS EVERYTHING",
      title: "Good men. Better connections.",
      subtitle: "Build your crew. Give them a reason to stay.",
    },
    rackets: {
      eyebrow: "A LITTLE RISK. A LITTLE REWARD.",
      title: "Put the city to work.",
      subtitle: "Send a message. Collect a debt. Keep an eye on the Heat.",
    },
    family: {
      eyebrow: "BLOOD IS THICKER THAN RAIN",
      title: "Choose your own kind of loyalty.",
      subtitle: "For now, you answer to nobody. That has its advantages.",
    },
    reports: {
      eyebrow: "NOTHING HAPPENS WITHOUT A WHISPER",
      title: "Word on the street.",
      subtitle: "Your operation’s history, one quiet transaction at a time.",
    },
  };
  readonly heading = computed(() => this.headings[this.view()]);
  readonly heatLabel = computed(() =>
    this.game.state().heat >= 70
      ? "THE POLICE ARE WATCHING"
      : this.game.state().heat >= 40
        ? "ATTRACTING ATTENTION"
        : "UNDER THE RADAR",
  );
  readonly nextStep = computed(() => {
    const s = this.game.state();
    if (!s.buildings.speakeasy)
      return {
        title: "Open your first speakeasy",
        text: "Turn a quiet storefront into a steady stream of dirty money.",
        action: "Build your first front",
        view: "fronts",
      };
    if (!s.buildings.laundry)
      return {
        title: "Make your money respectable",
        text: "Open Bellini & Sons to turn street earnings into clean money.",
        action: "Open a laundering front",
        view: "fronts",
      };
    if (!s.jobsCompleted)
      return {
        title: "Let the neighborhood know",
        text: "Send a runner to collect protection money on your first job.",
        action: "Run your first racket",
        view: "rackets",
      };
    if (!s.buildings.poolhall)
      return {
        title: "Make room at the table",
        text: "Build Eight Ball Social and recruit some fresh faces.",
        action: "Build a recruitment hall",
        view: "fronts",
      };
    return {
      title: "The night is still young",
      text: "Expand your fronts, recruit a smuggler, and work the harbor route.",
      action: "Find your next opportunity",
      view: "rackets",
    };
  });
  readonly lessons = [
    {
      title: "Follow one click",
      subtitle: "From a button to a business",
      file: "src/app/game/game.engine.ts",
      body: "A Build button sends a command to GameStore. The store calls executeCommand(), which checks your cash and the queue, deducts the cost, and records an operation with a finish timestamp. Angular then renders the new state.",
      code: "button click → dispatch({ type: 'build', target: 'speakeasy' })\n             → executeCommand(state, command, now)\n             → state.set(result.state)\n             → the template updates",
      exercise:
        "Open game.config.ts and change the speakeasy’s cost from 400 to 450. Restart a round and see how the price changes.",
      doc: "docs/01-your-first-angular-feature.md",
    },
    {
      title: "Think in signals",
      subtitle: "State that tells the screen when to change",
      file: "src/app/game/game.store.ts",
      body: "signal() holds a value that changes. Read it by calling it: state(). Update it with .set() or .update(). computed() derives another value from signals; Angular keeps it current for you.",
      code: "readonly state = signal(createGame(Date.now()));\nreadonly income = computed(() =>\n  incomePerMinute(this.state())\n);",
      exercise:
        "Add a computed signal for total money: dirty plus clean. Display it in the template using yourSignal().",
      doc: "docs/02-signals-and-components.md",
    },
    {
      title: "Let time do the work",
      subtitle: "Finish timestamps, not fragile counters",
      file: "src/app/game/game.engine.ts",
      body: "An operation records startedAt and endsAt. The countdown displays endsAt minus now. Closing a tab does not erase the finish timestamp. When you return, advanceGame() resolves finished events chronologically, then calculates income and Heat decay.",
      code: "endsAt = now + durationInSeconds * 1000;\nremaining = Math.max(0, endsAt - now);\nnextState = advanceGame(savedState, Date.now());",
      exercise:
        "Build a front, close the tab for a minute, and reopen it. Compare the result with the timestamp tests.",
      doc: "docs/03-timers-and-game-rules.md",
    },
    {
      title: "Give the server authority",
      subtitle: "The next chapter of this project",
      file: "docs/05-the-road-to-multiplayer.md",
      body: "This version saves locally and simulates a single-player round. A production server must own cash, crew, prices, random outcomes, and time. The Angular store will later send commands to that server and display its response. Families and faction wars come after that foundation.",
      code: "Angular → POST /api/commands\nServer  → validate, lock, resolve, persist\nAngular ← authoritative game snapshot",
      exercise:
        "Read the backend chapter. Sketch a BuildFront request that contains a front ID, but never a price or a claimed balance.",
      doc: "docs/05-the-road-to-multiplayer.md",
    },
  ];
  private audio?: AudioContext;
  private previousFocus: HTMLElement | null = null;

  go(id: string): void {
    if (Object.hasOwn(this.headings, id)) this.view.set(id as View);
    this.mobileMenu.set(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  cost(id: BuildingId): number {
    return buildingCost(this.game.state(), id);
  }
  available(id: CrewId): number {
    return availableCrew(this.game.state(), id);
  }
  reason(command: GameCommand): string | null {
    return commandError(this.game.state(), command);
  }
  batch(): number {
    return laundryBatch(this.game.state());
  }
  pending(kind: string, target?: string): boolean {
    return this.game
      .state()
      .operations.some(
        (op) => op.kind === kind && (!target || op.target === target),
      );
  }
  jobCrew(job: JobDefinition): string {
    return Object.entries(job.crew)
      .map(([name, count]) => `${count} ${name}${count! > 1 ? "s" : ""}`)
      .join(" + ");
  }
  jobSeconds(job: JobDefinition): number {
    return job.seconds * (this.available("driver") > 0 ? 0.8 : 1);
  }
  age(at: number): string {
    const seconds = Math.max(0, (this.game.now() - at) / 1000);
    return seconds < 60
      ? "Just now"
      : seconds < 3600
        ? `${Math.floor(seconds / 60)}m ago`
        : seconds < 86400
          ? `${Math.floor(seconds / 3600)}h ago`
          : `${Math.floor(seconds / 86400)}d ago`;
  }
  openModal(which: "guide" | "settings"): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.confirmReset.set(false);
    this.modal.set(which);
    (document.querySelector("#game-dialog") as HTMLDialogElement).showModal();
  }
  closeModal(): void {
    (document.querySelector("#game-dialog") as HTMLDialogElement).close();
    this.modal.set(null);
    this.previousFocus?.focus();
  }
  backdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }
  resetGame(): void {
    this.game.reset();
    this.view.set("overview");
    this.closeModal();
  }
  async toggleRain(): Promise<void> {
    try {
      if (this.rainOn()) {
        await this.audio?.suspend();
        this.rainOn.set(false);
        return;
      }
      if (!this.audio) {
        this.audio = new AudioContext();
        const buffer = this.audio.createBuffer(
          1,
          this.audio.sampleRate * 3,
          this.audio.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = this.audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = this.audio.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 700;
        const volume = this.audio.createGain();
        volume.gain.value = 0.045;
        source.connect(filter);
        filter.connect(volume);
        volume.connect(this.audio.destination);
        source.start();
      }
      await this.audio.resume();
      this.rainOn.set(true);
    } catch {
      this.game.notify("Rain audio is unavailable in this browser.", true);
    }
  }
}

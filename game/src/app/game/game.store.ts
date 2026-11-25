import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from "@angular/core";
import {
  advanceGame,
  createGame,
  executeCommand,
  incomePerMinute,
  storageCap,
} from "./game.engine";
import { migrateSave } from "./game.persistence";
import { familyLevel } from "./family.engine";
import type { GameCommand, GameState } from "./game.model";

const SAVE_KEY = "omerta.game.v1";

@Injectable({ providedIn: "root" })
export class GameStore {
  private readonly destroyRef = inject(DestroyRef);
  readonly persistenceWarning = signal("");
  readonly now = signal(Date.now());
  readonly state = signal(this.load());
  readonly toast = signal<{ text: string; error: boolean } | null>(null);
  readonly celebration = signal<{
    title: string;
    detail: string;
    levelUp: boolean;
  } | null>(null);
  readonly income = computed(() => incomePerMinute(this.state()));
  readonly capacity = computed(() => storageCap(this.state()));
  readonly frontCount = computed(
    () =>
      Object.values(this.state().buildings).filter((level) => level > 0).length,
  );
  readonly crewCount = computed(() =>
    Object.values(this.state().crew).reduce((sum, count) => sum + count, 0),
  );
  readonly roundOver = computed(() => this.now() >= this.state().roundEndsAt);
  private toastTimer?: ReturnType<typeof setTimeout>;
  private rewardTimer?: ReturnType<typeof setTimeout>;
  private lastSave = 0;

  constructor() {
    const interval = setInterval(() => this.tick(), 1000);
    const save = () => {
      this.tick();
      this.save();
    };
    window.addEventListener("pagehide", save);
    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
      clearTimeout(this.toastTimer);
      clearTimeout(this.rewardTimer);
      window.removeEventListener("pagehide", save);
    });
  }
  private load(): GameState {
    let raw: string | null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch {
      this.persistenceWarning.set(
        "Browser storage is unavailable. This session may not survive a reload.",
      );
      return createGame(Date.now());
    }
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        const migrated = migrateSave(parsed);
        if (migrated) return advanceGame(migrated, Date.now());
      } catch {
        // Malformed JSON is a damaged save, not a browser-storage failure.
      }
      this.persistenceWarning.set(
        "Your saved game was unreadable. A fresh round has been started.",
      );
    }
    return createGame(Date.now());
  }
  private tick(): void {
    const now = Date.now();
    this.now.set(now);
    if (
      !this.roundOver() ||
      this.state().updatedAt < this.state().roundEndsAt
    ) {
      const previous = this.state();
      const next = advanceGame(previous, now);
      this.state.set(next);
      this.showReward(previous, next);
    }
    if (now - this.lastSave >= 5000) this.save();
  }
  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state()));
      this.lastSave = Date.now();
    } catch {
      this.persistenceWarning.set(
        "Progress could not be saved. Check browser storage settings.",
      );
    }
  }
  dispatch(command: GameCommand): void {
    const previous = this.state();
    const result = executeCommand(previous, command, Date.now());
    this.state.set(result.state);
    this.save();
    this.showReward(previous, result.state);
    this.notify(
      result.error ??
        ([
          "foundFamily",
          "contributeFamily",
          "claimFamilyContract",
          "upgradeFamily",
          "disbandFamily",
        ].includes(command.type)
          ? result.state.journal[0].text
          : command.type === "bribe"
            ? "The captain appreciates your generosity."
            : "Word sent. Your operation is underway."),
      !!result.error,
    );
  }
  private showReward(previous: GameState, next: GameState): void {
    if (previous.journal[0]?.id === next.journal[0]?.id) return;
    const levelUp =
      !!previous.family &&
      !!next.family &&
      familyLevel(next.family.xp) > familyLevel(previous.family.xp);
    const completed = previous.operations.some(
      (op) => !next.operations.some((active) => active.id === op.id),
    );
    if (!levelUp && !completed) return;
    const report = levelUp
      ? (next.journal.find(
          (entry) =>
            entry.title ===
            `Family level ${familyLevel(next.family!.xp)} unlocked!`,
        ) ?? next.journal[0])
      : next.journal[0];
    this.celebration.set({ title: report.title, detail: report.text, levelUp });
    clearTimeout(this.rewardTimer);
    this.rewardTimer = setTimeout(() => this.celebration.set(null), 6000);
  }
  notify(text: string, error = false): void {
    this.toast.set({ text, error });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4500);
  }
  reset(): void {
    this.celebration.set(null);
    this.state.set(createGame(Date.now()));
    this.now.set(Date.now());
    this.save();
    this.notify("A new night. A new empire. Welcome back to Little Italy.");
  }
}

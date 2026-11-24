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
import { BUILDINGS, CREW, JOBS } from "./game.config";
import type { GameCommand, GameState } from "./game.model";

const SAVE_KEY = "omerta.game.v1";

// localStorage is untrusted input, even for a single-player prototype.
function validSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  const number = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (
    s.version !== 1 ||
    ![
      "startedAt",
      "updatedAt",
      "roundEndsAt",
      "nextPoliceAt",
      "dirty",
      "clean",
      "respect",
      "favors",
      "heat",
      "jobsCompleted",
      "totalLaundered",
    ].every((key) => number(s[key as keyof GameState]))
  )
    return false;
  if (
    s.heat > 100 ||
    s.startedAt > s.updatedAt ||
    s.updatedAt > s.roundEndsAt ||
    s.roundEndsAt <= s.startedAt
  )
    return false;
  if (
    !s.buildings ||
    !BUILDINGS.every(
      (b) =>
        Number.isInteger(s.buildings[b.id]) &&
        s.buildings[b.id] >= 0 &&
        s.buildings[b.id] <= 5,
    )
  )
    return false;
  if (
    !s.crew ||
    !CREW.every((c) => Number.isInteger(s.crew[c.id]) && s.crew[c.id] >= 0)
  )
    return false;
  if (
    !Array.isArray(s.operations) ||
    s.operations.length > 5 ||
    !Array.isArray(s.journal) ||
    s.journal.length > 30
  )
    return false;
  const kinds = new Set<string>();
  for (const op of s.operations) {
    if (
      !op ||
      !["build", "recruit", "job", "launder", "laylow"].includes(op.kind) ||
      kinds.has(op.kind) ||
      typeof op.id !== "string" ||
      typeof op.label !== "string" ||
      typeof op.target !== "string" ||
      !number(op.startedAt) ||
      !number(op.endsAt) ||
      op.endsAt <= op.startedAt
    )
      return false;
    kinds.add(op.kind);
    if (op.kind === "build" && !BUILDINGS.some((b) => b.id === op.target))
      return false;
    if (op.kind === "recruit" && !CREW.some((c) => c.id === op.target))
      return false;
    if (op.kind === "job" && !JOBS.some((j) => j.id === op.target))
      return false;
    if (
      op.kind === "launder" &&
      (!number(Number(op.target)) || Number(op.target) > 800)
    )
      return false;
    if (
      op.crew &&
      Object.entries(op.crew).some(
        ([id, count]) =>
          !CREW.some((c) => c.id === id) ||
          !Number.isInteger(count) ||
          count! < 0 ||
          count! > s.crew[id as keyof typeof s.crew],
      )
    )
      return false;
  }
  return s.journal.every(
    (e) =>
      e &&
      typeof e.id === "string" &&
      number(e.at) &&
      typeof e.title === "string" &&
      typeof e.text === "string" &&
      ["good", "warning", "neutral"].includes(e.tone),
  );
}

@Injectable({ providedIn: "root" })
export class GameStore {
  private readonly destroyRef = inject(DestroyRef);
  readonly persistenceWarning = signal("");
  readonly now = signal(Date.now());
  readonly state = signal(this.load());
  readonly toast = signal<{ text: string; error: boolean } | null>(null);
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
        if (validSave(parsed)) return advanceGame(parsed, Date.now());
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
    if (!this.roundOver() || this.state().updatedAt < this.state().roundEndsAt)
      this.state.update((state) => advanceGame(state, now));
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
    const result = executeCommand(this.state(), command, Date.now());
    this.state.set(result.state);
    this.save();
    this.notify(
      result.error ??
        (command.type === "bribe"
          ? "The captain appreciates your generosity."
          : "Word sent. Your operation is underway."),
      !!result.error,
    );
  }
  notify(text: string, error = false): void {
    this.toast.set({ text, error });
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4500);
  }
  reset(): void {
    this.state.set(createGame(Date.now()));
    this.now.set(Date.now());
    this.save();
    this.notify("A new night. A new empire. Welcome back to Little Italy.");
  }
}

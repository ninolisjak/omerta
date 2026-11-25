import type { GameState } from "./game.model.ts";

export function recordEntry(
  s: GameState,
  at: number,
  title: string,
  text: string,
  tone: "good" | "warning" | "neutral" = "good",
): void {
  let serial = s.journal.length;
  while (s.journal.some((item) => item.id === `${at}-${serial}-${title}`))
    serial++;
  s.journal.unshift({ id: `${at}-${serial}-${title}`, at, title, text, tone });
  s.journal = s.journal.slice(0, 30);
}

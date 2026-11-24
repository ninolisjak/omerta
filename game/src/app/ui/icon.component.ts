import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

const PATHS: Record<string, string> = {
  city: "M3 21V8l5-3v16M8 12l5-3v12M13 5l5-3v19M18 10l3-2v13M1 21h22M5 10v1m0 3v1m5-1v1m5-8v1m0 3v1m0 3v1m5-4v1",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15",
  building: "M4 21V7l8-4 8 4v14M2 21h20M8 9h2m4 0h2M8 13h2m4 0h2M10 21v-4h4v4",
  crew: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  target:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 10v4m-2-2h4",
  shield: "M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7zM9 12l2 2 4-4",
  coins:
    "M18 8c0 2.2-3.6 4-8 4S2 10.2 2 8s3.6-4 8-4 8 1.8 8 4M2 8v5c0 2.2 3.6 4 8 4 1.1 0 2.1-.1 3-.3M18 8v3M2 13v4c0 2.2 3.6 4 8 4M16 14h6m-3-3v10",
  wallet:
    "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6m19 7h-5v4h5z",
  crown: "m3 6 4 4 5-7 5 7 4-4-2 12H5zM6 21h12",
  favor: "m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z",
  flame:
    "M12 3s2 5 0 8c3 0 4-3 4-3s5 5 3 10c-2 5-12 5-14 0C3 13 7 8 7 8s0 4 3 4c-1-4 2-9 2-9z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3l-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3z",
  book: "M12 6C8 3 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-2-1-6-1-10 2zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3",
  sound: "M11 4 5 9H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "M11 4 5 9H2v6h3l6 5zM16 9l6 6m0-6-6 6",
  glass: "M4 3h16l-8 9zM12 12v9m-5 0h10",
  laundry:
    "M4 3h16v18H4zM7 6h1m3 0h1m0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-4 4c3-3 5 3 8 0",
  briefcase: "M3 7h18v14H3zM8 7V3h8v4M3 12c6 4 12 4 18 0m-9 0v4",
  runner:
    "M14 4a2 2 0 1 0 0 .1M5 10l5-3 4 3h5M11 8l-2 7 4 3 1 4M9 15l-3 6M7 7l-3 2",
  car: "M3 12l3-7h12l3 7v7H3zM3 12h18M6 16h2m8 0h2M5 19v2m14-2v2",
  box: "m12 3 9 5v10l-9 5-9-5V8zm0 10v10M3 8l9 5 9-5M7.5 5.5l9 5",
  anchor:
    "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6m0 0v15M7 10h10M3 14v3c0 3 5 5 9 5s9-2 9-5v-3M1 16l2-2 2 2m14 0 2-2 2 2",
  bolt: "m13 2-9 12h7l-1 8 10-12h-7z",
  pin: "M12 22s8-8 8-13a8 8 0 1 0-16 0c0 5 8 13 8 13zm0-16a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  lock: "M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3M12 14v3",
  rain: "M6 15a5 5 0 1 1 1-10 6 6 0 0 1 11 3 3.5 3.5 0 0 1 0 7M8 18l-1 3m6-3-1 3m6-3-1 3",
  reset: "M3 10a9 9 0 1 1 0 5M3 3v7h7",
  expand: "M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6",
};
@Component({
  selector: "o-icon",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.45"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path()" />
  </svg>`,
  styles: [
    ":host{display:inline-flex;width:20px;height:20px;flex-shrink:0;align-items:center;justify-content:center}svg{width:100%;height:100%}",
  ],
})
export class IconComponent {
  readonly name = input("grid");
  readonly path = computed(() => PATHS[this.name()] ?? PATHS["favor"]);
}

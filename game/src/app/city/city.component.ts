import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { IconComponent } from "../ui/icon.component";

export interface District {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  icon: string;
  description: string;
  action: string;
  view: string;
}
@Component({
  selector: "o-city",
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./city.component.html",
  styleUrl: "./city.component.css",
})
export class CityComponent {
  readonly expanded = input(false);
  readonly navigate = output<string>();
  readonly zoom = signal(1);
  readonly selected = signal("italy");
  readonly districts: District[] = [
    {
      id: "italy",
      name: "Little Italy",
      type: "YOUR TERRITORY",
      x: 24,
      y: 36,
      icon: "shield",
      description: "Home turf. Your empire starts on this block.",
      action: "Manage fronts",
      view: "fronts",
    },
    {
      id: "ash",
      name: "Ash Row",
      type: "RIVAL CREW",
      x: 80,
      y: 29,
      icon: "target",
      description: "A small-time gang. A chance to earn some Respect.",
      action: "Scout a job",
      view: "rackets",
    },
    {
      id: "docks",
      name: "The Docklands",
      type: "SMUGGLING ROUTE",
      x: 74,
      y: 72,
      icon: "anchor",
      description: "Goods arrive quietly. The right crew makes them disappear.",
      action: "View shipments",
      view: "rackets",
    },
    {
      id: "civic",
      name: "Civic Quarter",
      type: "CONTESTED DISTRICT",
      x: 51,
      y: 26,
      icon: "building",
      description:
        "City Hall. High stakes. Family territory control is planned for multiplayer.",
      action: "About Families",
      view: "family",
    },
  ];
  district(): District {
    return this.districts.find((d) => d.id === this.selected())!;
  }
  changeZoom(amount: number): void {
    this.zoom.update(
      (z) => Math.round(Math.max(1, Math.min(1.5, z + amount)) * 10) / 10,
    );
  }
}

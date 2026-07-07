import { _decorator, Component, JsonAsset, Node } from "cc";
import { IStats, StatsType } from "./CharacterDataInterface";
import { Signal } from "../eventSystem/Signal";
const { ccclass, property } = _decorator;

@ccclass("PlayerStats")
export class PlayerStats extends Component {
  @property(JsonAsset) private dataStats: JsonAsset = null;
  private stats: IStats[] = [];

  public onUpgradeStats = new Signal<StatsType>();

  protected onLoad(): void {
    if (this.dataStats) {
      this.stats = JSON.parse(JSON.stringify(this.dataStats.json));
    }
    console.log(this.stats);
  }

  public getStats(type: StatsType): IStats {
    return this.stats.find((stat) => stat.type === type);
  }

  public upgradeStats(type: StatsType): void {
    const stat = this.getStats(type);
    if (stat) {
      stat.level++;
      stat.cost += stat.costPerLevel * stat.level;
      stat.value += stat.valuePerLevel * stat.level;
    }

    this.onUpgradeStats.trigger(type);
  }
}

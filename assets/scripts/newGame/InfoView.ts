import { _decorator, Component, Label } from "cc";
import { StatsType } from "./CharacterDataInterface";
import { PlayerStats } from "./PlayerStats";
const { ccclass, property } = _decorator;

@ccclass("InfoView")
export class InfoView extends Component {
  @property(PlayerStats) private playerStats: PlayerStats = null;
  @property(Label) private damage: Label = null;
  @property(Label) private regen: Label = null;

  protected start(): void {
    this.playerStats.onUpgradeStats.on(this.updateInfo, this);
    this.updateInfo();
  }

  private updateInfo(): void {
    this.damage.string = this.playerStats
      .getStats(StatsType.DAMAGE)
      .value.toString();
    this.regen.string = `${this.playerStats.getStats(StatsType.REGEN).value.toFixed(2)}/s`;
  }
}

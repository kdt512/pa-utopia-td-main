import {
  _decorator,
  CCInteger,
  Component,
  instantiate,
  Node,
  Prefab,
  SpriteFrame,
} from "cc";
import { PlayerStats } from "./PlayerStats";
import { StatsType } from "./CharacterDataInterface";
import { UpgradeStatsView } from "./UpgradeStatsView";
const { ccclass, property } = _decorator;

@ccclass("ContainStats")
export class ContainStats extends Component {
  @property(PlayerStats) private playerStats: PlayerStats = null;
  @property(CCInteger) private arrStats: number[] = [];
  @property(Prefab) private upgradeStatsViewPrefab: Prefab = null;
  @property(Node) private parentStats: Node = null;
  @property(SpriteFrame) private arrSprite: SpriteFrame[] = [];

  private arrUpgradeStatsView: UpgradeStatsView[] = [];

  protected start(): void {
    this.setupView();
    this.playerStats.onUpgradeStats.on(this.onUpgradeStats, this);
  }

  private setupView(): void {
    this.arrStats.forEach((stat) => {
      const statData = this.playerStats.getStats(stat);
      const upgradeStatsView = instantiate(this.upgradeStatsViewPrefab);
      upgradeStatsView.setParent(this.parentStats);
      upgradeStatsView
        .getComponent(UpgradeStatsView)
        .setupView(statData, this.arrSprite[statData.type], this.playerStats);
      this.arrUpgradeStatsView.push(
        upgradeStatsView.getComponent(UpgradeStatsView),
      );
    });
  }

  private onUpgradeStats(type: StatsType): void {
    const statData = this.playerStats.getStats(type);
    const upgradeStatsView = this.arrUpgradeStatsView.find(
      (view) => view.type === type,
    );
    if (upgradeStatsView) {
      upgradeStatsView.setupView(
        statData,
        this.arrSprite[statData.type],
        this.playerStats,
      );
    }
  }
}

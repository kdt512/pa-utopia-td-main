import {
  _decorator,
  Component,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  Widget,
} from "cc";
import { UIButton } from "../eventSystem/UIButton";
import { IStats, StatsType } from "./CharacterDataInterface";
import { PlayerStats } from "./PlayerStats";
import { Currency } from "./Currency";
import * as i18n from './../../resources/i18n/LanguageData';

const { ccclass, property } = _decorator;

@ccclass("UpgradeStatsView")
export class UpgradeStatsView extends Component {
  @property(Sprite) private icon: Sprite = null;
  @property(Label) private level: Label = null;
  @property(Label) private statName: Label = null;
  @property(Label) private statValue: Label = null;
  @property(Label) private cost: Label = null;

  public type: StatsType;
  private playerStats: PlayerStats;
  public setupView(
    statData: IStats,
    sprite: SpriteFrame,
    playerStats: PlayerStats,
  ): void {
    this.icon.spriteFrame = sprite;
    this.level.string = `Lv.${statData.level}`;
    const id = statData.id;
    const statsName = i18n.t(`stats_type_${id}`);
    this.statName.string = statsName;
    this.statValue.string = this.formatStatValue(statData.value, statData.type);
    this.cost.string = `$${statData.cost}`;

    this.statName.node.getComponent(Widget).updateAlignment();
    this.type = statData.type;
    this.playerStats = playerStats;
  }

  private onUpgradeButtonInteracted(button: UIButton): void {
    if (
      Currency.instance.getCurrency() >=
      this.playerStats.getStats(this.type).cost
    ) {
      Currency.instance.useCurrency(this.playerStats.getStats(this.type).cost);
      this.playerStats.upgradeStats(this.type);
    }
  }

  private formatStatValue(value: number, type: StatsType): string {
    switch (type) {
      case StatsType.ATTACK_SPEED:
        return value.toFixed(2);
      case StatsType.CRITICAL_CHANCE:
        return `${value.toFixed(2)}%`;
      case StatsType.CRITICAL_FACTOR:
        return `x${value.toFixed(2)}`;
      case StatsType.REGEN:
        return `${value.toFixed(2)}/s`;
      default:
        return value.toString();
    }
  }
}

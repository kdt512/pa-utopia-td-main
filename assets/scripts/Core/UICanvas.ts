import { _decorator, Canvas, Component, Label, Node } from "cc";

import { Game, GameState } from "./Game";
import * as i18n from "./../../resources/i18n/LanguageData";
import { UIButton } from "../eventSystem/UIButton";
import { PlayerStats } from "../newGame/PlayerStats";
import { StatsType } from "../newGame/CharacterDataInterface";
import { Currency } from "../newGame/Currency";
import { FxManager } from "../newGame/FxManager";
import { Player } from "../newGame/Player";

const { ccclass, property } = _decorator;

@ccclass("UICanvas")
export class UICanvas extends Component {
  @property(Node) private gameplayPanel: Node = null;
  @property(Node) private winPanel: Node = null;
  @property(Node) private losePanel: Node = null;
  @property(Node) private uiBottom: Node = null;
  @property(Label) private lblTut: Label = null;

  @property(UIButton) private btnWin: UIButton = null;
  @property(UIButton) private btnLose: UIButton = null;
  @property(UIButton) private btnDownload: UIButton = null;

  @property(Node) private tutNode: Node = null;
  @property(PlayerStats) private playerStats: PlayerStats = null;

  @property(Label) private atkLbl: Label = null;
  @property(Label) private defLbl: Label = null;
  @property(Node) private player: Node = null;
  @property(Node) private fireCircle: Node = null;
  @property(Node) private yellowCircle: Node = null;

  private oneTime: boolean = false;

  onLoad(): void {}

  public init(game: Game): void {
    // this.node.active = true;
    // game.onChangeState.on(this.onChangeState, this);
    // this.btnWin.InteractedEvent.on(this.onWin, this);
    // this.btnLose.InteractedEvent.on(this.onLose, this);
    // this.btnDownload.InteractedEvent.on(() => {
    //     Game.instance.GameFlow.setEndGame();
    //     Game.instance.GameFlow.callCTA();
    // }, this);
    // this.playerStats.onUpgradeStats.on(this.updateTut, this);
    if (this.atkLbl)
      this.atkLbl.string = this.playerStats
        .getValue(StatsType.DAMAGE)
        .toString();
    if (this.defLbl)
      this.defLbl.string = this.playerStats
        .getValue(StatsType.HEALTH)
        .toString();
  }

  private updateTut(): void {
    this.tutNode.active = false;
    if (!this.oneTime) {
      this.oneTime = true;
      Game.instance.CurrentGameState = GameState.GamePlay;
    }
    for (let i = 0; i < 4; i++) {
      this.playerStats.upgradeStats(StatsType.DAMAGE);
      this.playerStats.upgradeStats(StatsType.ATTACK_SPEED);
    }
  }

  upgradeDamagePa3() {
    this.tutNode.active = false;
    if (!this.oneTime) {
      this.oneTime = true;
      Game.instance.CurrentGameState = GameState.GamePlay;
    }
    if (
      Currency.instance.getCurrency() > 10 &&
      this.playerStats.getStats(StatsType.DAMAGE).level < 10
    ) {
      this.playerStats.upgradeStats(StatsType.DAMAGE);
      this.playerStats.upgradeStats(StatsType.ATTACK_SPEED);
      this.playerStats.upgradeStats(StatsType.ATTACK_SPEED);

      Currency.instance.useCurrency(10);
      if (this.atkLbl)
        this.atkLbl.string = this.playerStats
          .getValue(StatsType.DAMAGE)
          .toString();
      FxManager.instance.creatFxUpgrade(this.player.worldPosition);
    } else {
      Game.instance.GameCallCTA();
    }
  }

  defLevel: number = 0;

  upgradeDefPa3() {
    this.tutNode.active = false;
    if (!this.oneTime) {
      this.oneTime = true;
      Game.instance.CurrentGameState = GameState.GamePlay;
    }

    if (Currency.instance.getCurrency() > 10 && this.defLevel < 10) {
      this.defLevel++;
      if (this.defLevel == 1)
        FxManager.instance.showFire(Player.Instance.node.worldPosition);
      else if (this.defLevel == 3) FxManager.instance.showSubPlayer();
      else if (this.defLevel == 6)
        FxManager.instance.showThunderBold(Player.Instance.node.worldPosition);
      else this.playerStats.upgradeStats(StatsType.HEALTH);

      Currency.instance.useCurrency(10);
      if (this.defLbl)
        this.defLbl.string = this.playerStats
          .getValue(StatsType.HEALTH)
          .toString();
    } else {
      Game.instance.GameCallCTA();
    }
  }

  upgradeTutPa6() {
    console.log("UICanvas: Upgrade tutorial for PA6");
    this.tutNode.active = false;

    if (!this.oneTime) {
      this.oneTime = true;
      Game.instance.CurrentGameState = GameState.GamePlay;
    }
    console.log(
      "Current DAMAGE level:",
      this.playerStats.getStats(StatsType.DAMAGE).level,
    );
    if (this.playerStats.getStats(StatsType.DAMAGE).level < 20) {
      for (let i = 0; i < 4; i++) {
        this.playerStats.upgradeStats(StatsType.DAMAGE);
        this.playerStats.upgradeStats(StatsType.ATTACK_SPEED);
      }
      if (this.playerStats.getStats(StatsType.DAMAGE).level >= 20) {
        this.lblTut.string = i18n.t("upgrade_max");
      }
    } else {
      Game.instance.GameCallCTA();
    }
  }

  private onWin(): void {
    Game.instance.GameCallCTA();
  }

  private onLose(): void {
    Game.instance.GameCallCTA();
  }

  private onChangeState(state: GameState): void {
    switch (state) {
      case GameState.Win:
        this.winPanel.active = true;
        this.uiBottom.active = false;
        break;

      case GameState.Lose:
        this.losePanel.active = true;
        this.uiBottom.active = false;
        break;
    }
  }
}

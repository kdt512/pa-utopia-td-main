import { _decorator, Canvas, Component, Label, Node } from "cc";

import { Game, GameState } from "./Game";
import * as i18n from './../../resources/i18n/LanguageData';
import { UIButton } from "../eventSystem/UIButton";
import { PlayerStats } from "../newGame/PlayerStats";
import { StatsType } from "../newGame/CharacterDataInterface";

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

  private oneTime: boolean = false;

  onLoad(): void { }

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

  upgradeTutPa6() {
    console.log("UICanvas: Upgrade tutorial for PA6");
    this.tutNode.active = false;

    if (!this.oneTime) {
      this.oneTime = true;
      Game.instance.CurrentGameState = GameState.GamePlay;
    }
    console.log("Current DAMAGE level:", this.playerStats.getStats(StatsType.DAMAGE).level);
    if (this.playerStats.getStats(StatsType.DAMAGE).level < 20) {
      for (let i = 0; i < 4; i++) {
        this.playerStats.upgradeStats(StatsType.DAMAGE);
        this.playerStats.upgradeStats(StatsType.ATTACK_SPEED);
      }
      if (this.playerStats.getStats(StatsType.DAMAGE).level >= 20) {
        this.lblTut.string = i18n.t('upgrade_max');
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

import { _decorator, CCFloat, Component, Label, Node, UITransform } from "cc";
import { EnemySpawner, IWaveEnemy } from "./EnemySpawner";
import { Game, GameState } from "../Core/Game";
import { PlayerStats } from "./PlayerStats";
import { StatsType } from "./CharacterDataInterface";
const { ccclass, property } = _decorator;

enum BarState {
  Idle,
  Spawning,
  Transition,
}

@ccclass("ProgressBar")
export class ProgressBar extends Component {
  @property(CCFloat) private maxValue: number = 300;
  @property(CCFloat) private minValue: number = 0;
  @property(Node) private bar: Node = null!;
  @property(EnemySpawner) private enemySpawner: EnemySpawner = null!;
  // @property(Label) private label: Label = null!;
  @property(PlayerStats) private playerStats: PlayerStats = null;

  private currentWaveIndex: number = 0;
  private timer: number = 0;
  private targetTime: number = 0;
  private currentState: BarState = BarState.Idle;
  private waves: IWaveEnemy[] = [];
  private barTransform: UITransform | null = null;

  private currentWaveEnemies: number = 1;

  protected start(): void {
    this.barTransform = this.bar.getComponent(UITransform);
    if (!this.barTransform) {
      console.error("ProgressBar: bar node does not have UITransform!");
      return;
    }

    this.updateWidth(this.minValue);

    if (Game.instance) {
      Game.instance.onChangeState.on(this.onChangeState, this);
    } else {
      console.error("ProgressBar: Game instance not found!");
    }

    this.enemySpawner.onWaveCompleted.on(this.onWaveCompleted, this);
    // this.label.string = ` Wave ${this.currentWaveEnemies}`;

    this.playerStats.onUpgradeStats.on(this.updateStat, this);
  }

  updateStat(type: number) {
    if (type === 1) {
      this.updateWidth(this.playerStats.getStats(StatsType.DAMAGE).level * 10);
    }
  }

  private onWaveCompleted() {
    this.currentWaveEnemies++;
    // this.label.string = ` Wave ${this.currentWaveEnemies}`;
  }

  private onChangeState(state: GameState) {
    if (state === GameState.GamePlay) {
      this.waves = this.enemySpawner.getTotalWaveEnemies();
      this.currentWaveIndex = 0;
      this.startSpawningPhase();
    }
  }

  private startSpawningPhase() {
    if (this.currentWaveIndex >= this.waves.length) return;

    const wave = this.waves[this.currentWaveIndex];
    // Calculate total time: amount * delayPerEnemy
    this.targetTime = wave.amount * wave.delayPerEnemy;
    this.timer = 0;
    this.currentState = BarState.Spawning;
  }

  private startTransitionPhase() {
    console.log("end");
    this.targetTime = this.enemySpawner.getWaveDelay();
    this.timer = 0;
    this.currentState = BarState.Transition;
  }

  protected update(dt: number) {
    if (this.currentState === BarState.Idle) return;

    this.timer += dt;
    // Avoid division by zero
    let progress =
      this.targetTime > 0 ? Math.min(this.timer / this.targetTime, 1) : 1;

    if (this.currentState === BarState.Spawning) {
      // min -> max
      const width = this.minValue + (this.maxValue - this.minValue) * progress;
      // this.updateWidth(width);

      if (progress >= 1) {
        this.startTransitionPhase();
      }
    } else if (this.currentState === BarState.Transition) {
      // max -> min
      const width = this.maxValue - (this.maxValue - this.minValue) * progress;
      // this.updateWidth(width);

      if (progress >= 1) {
        this.currentWaveIndex++;
        if (this.currentWaveIndex < this.waves.length) {
          this.startSpawningPhase();
        } else {
          this.stop();
        }
      }
    }
  }

  private stop() {
    this.currentState = BarState.Idle;
    console.log("stop");
    this.updateWidth(this.minValue);
  }

  private updateWidth(width: number) {
    if (this.barTransform) {
      this.barTransform.width = width;
    }
  }

  protected onDestroy(): void {
    if (Game.instance) {
      Game.instance.onChangeState.off(this.onChangeState);
    }
  }
}

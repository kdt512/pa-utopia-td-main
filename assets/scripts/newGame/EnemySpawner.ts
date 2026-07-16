import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  CCInteger,
  CCFloat,
} from "cc";
import { Game, GameState } from "../Core/Game";
import { Signal } from "../eventSystem/Signal";
import { Enemy } from "./Enemy";
const { ccclass, property } = _decorator;

@ccclass("IWaveEnemy")
export class IWaveEnemy {
  @property(CCInteger) public amount: number = 0;
  @property(CCFloat) public delayPerEnemy: number = 0.5;
  @property(Prefab) public enemies: Prefab[] = [];
}

@ccclass("EnemySpawner")
export class EnemySpawner extends Component {
  @property private radius: number = 160;
  @property private minY: number = 30;
  @property private waveDelay: number = 3;

  @property({ type: IWaveEnemy }) private waves: IWaveEnemy[] = [];

  private _timer: number = 0;
  private _spawnedInWave: number = 0;
  private _currentWaveIndex: number = 0;
  private _isWaitingNextWave: boolean = false;
  private _waveTimer: number = 0;

  private canSpawn: boolean = true;

  public onWaveCompleted: Signal = new Signal();

  start() {
    if (this.waves.length > 0) {
      console.log(`Starting Wave ${this._currentWaveIndex + 1}`);
    }

    Game.instance.onChangeState.on(this.onChangeState, this);
    // this.canSpawn = true;
  }

  private onChangeState(state: GameState) {
    if (state === GameState.GamePlay) {
      this.canSpawn = true;
    }
    if (state === GameState.Lose || state === GameState.Win) {
      this.canSpawn = false;
    }
  }

  update(deltaTime: number) {
    if (!this.canSpawn) return;
    if (this._currentWaveIndex >= this.waves.length) return;

    if (Game.instance.CurrentGameState !== GameState.GamePlay) return;

    const currentWaveData = this.waves[this._currentWaveIndex];

    if (this._isWaitingNextWave) {
      this._waveTimer += deltaTime;
      if (this._waveTimer >= this.waveDelay) {
        this._isWaitingNextWave = false;
        this._waveTimer = 0;
        this._spawnedInWave = 0;
        this._currentWaveIndex++;
        this.onWaveCompleted.trigger();
        this._timer = 0;

        if (this._currentWaveIndex < this.waves.length) {
          console.log(`Starting Wave ${this._currentWaveIndex + 1}`);
        } else {
          console.log("All waves completed");
          Game.instance.CurrentGameState = GameState.Win;
        }
      }
      return;
    }

    this._timer += deltaTime;

    if (this._timer >= currentWaveData.delayPerEnemy) {
      if (this.spawnEnemy(currentWaveData)) {
        this._timer = 0;
        this._spawnedInWave++;

        if (this._spawnedInWave >= currentWaveData.amount) {
          this._isWaitingNextWave = true;
          console.log(
            `Wave ${this._currentWaveIndex + 1} completed. Waiting ${this.waveDelay}s...`,
          );
        }
      }
    }
  }

  spawnEnemy(waveData: IWaveEnemy): boolean {
    if (!waveData.enemies || waveData.enemies.length === 0) return false;

    // Random position in circle
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.radius;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    // "y nhỏ hơn minY thì bỏ qua"
    if (y < this.minY) {
      return false;
    }

    const randomIndex = Math.floor(Math.random() * waveData.enemies.length);
    const enemyPrefab = waveData.enemies[randomIndex];

    if (!enemyPrefab) return false;

    const enemy = instantiate(enemyPrefab);
    let hpScale = this._currentWaveIndex == 0 ? 0.2 : 1;
    console.log("hpScale: " + hpScale + " , " + this._currentWaveIndex);
    enemy.parent = this.node;
    enemy.setPosition(x, y, 0);
    enemy.getComponent(Enemy).init(hpScale);
    return true;
  }

  public getTotalWaveEnemies(): IWaveEnemy[] {
    return this.waves;
  }

  public getWaveDelay(): number {
    return this.waveDelay;
  }
}

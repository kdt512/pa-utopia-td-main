import { _decorator, Component, Node, Vec2, Vec3, Color } from "cc";
import { Signal } from "../eventSystem/Signal";
import { PlayerStats } from "./PlayerStats";
import { StatsType } from "./CharacterDataInterface";
import { FxManager } from "./FxManager";
import { Currency } from "./Currency";
import { ParticleSpawnSystem, SpawnRequest } from "./ParticleSpawnSystem";
import { Game, GameState } from "../Core/Game";

const { ccclass, property } = _decorator;

export interface IHealth {
  maxHealth: number;
  currentHealth: number;
}
@ccclass("Health")
export class Health extends Component {
  private maxHealth: number = 0;
  private currentHealth: number = 0;

  public onHealthChanged: Signal<IHealth> = new Signal<IHealth>();
  private playerStats: PlayerStats = null!;

  private baseHealth: number = 0;

  protected onLoad(): void {
    this.playerStats = this.node.getComponent(PlayerStats);
    if (this.playerStats !== null) {
      this.playerStats.onUpgradeStats.on(this.onUpgradeStats, this);
    }
  }

  public setup(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.currentHealth = this.maxHealth;

    this.onHealthChanged.trigger({
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
    });

    if (this.playerStats === null) return;

    const stat = this.playerStats.getStats(StatsType.HEALTH);
    if (!stat) return;

    this.maxHealth = stat.value;
    this.currentHealth = this.maxHealth;

    this.onHealthChanged.trigger({
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
    });
  }

  public takeDamage(damage: number): void {
    this.currentHealth -= damage;
    FxManager.instance.createDameLabel(this.node.worldPosition, damage);

    if (this.currentHealth <= 0) {
      this.currentHealth = 0;

      if (this.playerStats === null) {
        FxManager.instance.createFx(this.node.worldPosition);
        Currency.instance.rewardKillEnemy();
      } else {
        Game.instance.CurrentGameState = GameState.Lose;
      }

      this.node.destroy();
    } else {
    }

    this.onHealthChanged.trigger({
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
    });
  }

  private onUpgradeStats(type: StatsType): void {
    const stat = this.playerStats.getStats(type);
    if (!stat) return;

    switch (type) {
      case StatsType.HEALTH:
        this.maxHealth = this.baseHealth + stat.value;
        this.currentHealth = this.maxHealth;

        this.onHealthChanged.trigger({
          maxHealth: this.maxHealth,
          currentHealth: this.currentHealth,
        });
        break;
    }
  }
}

import { _decorator, Component, Vec3, director } from "cc";
import { Enemy } from "./Enemy";
import { Player } from "./Player";
const { ccclass, property } = _decorator;

@ccclass("FireCircle")
export class FireCircle extends Component {
  @property damage: number = 5;
  @property damageRadius: number = 95;
  @property tickInterval: number = 1;

  private tickTimer: number = 0;

  update(deltaTime: number) {
    this.tickTimer += deltaTime;
    if (this.tickTimer < this.tickInterval) return;
    this.tickTimer = 0;

    const player = Player.Instance;
    const scene = director.getScene();
    if (!player || !player.node || !player.node.isValid || !scene) return;

    const center = player.node.worldPosition;
    const enemies = scene.getComponentsInChildren(Enemy);

    for (const enemy of enemies) {
      if (!enemy.node || !enemy.node.isValid) continue;
      if (Vec3.distance(center, enemy.node.worldPosition) <= this.damageRadius) {
        enemy.takeDamage(this.damage);
      }
    }
  }
}

import {
  _decorator,
  Color,
  Component,
  MeshRenderer,
  Node,
  RigidBody,
  Collider,
  ICollisionEvent,
  Vec3,
} from "cc";
import { Enemy } from "./Enemy";
const { ccclass, property } = _decorator;

@ccclass("ProjectileLazer")
export class ProjectileLazer extends Component {
  @property(RigidBody)
  private rb: RigidBody = null!;

  private damage: number = 0;
  private visualRenderer: MeshRenderer = null!;

  start() {
    const collider = this.getComponent(Collider);
    if (collider) {
      // Đăng ký sự kiện va chạm
      collider.on("onTriggerEnter", this.onCollisionEnter, this);
    }
  }

  public setTarget(target: Node, damage: number) {
    this.damage = damage;
  }

  public setColor(color: Color) {
    // Không lấy trong start(): setColor có thể được gọi ngay sau instantiate(),
    // trước khi lifecycle start() của node này kịp chạy.
    if (!this.visualRenderer) {
      this.visualRenderer = this.getComponentInChildren(MeshRenderer);
    }
    this.visualRenderer?.material?.setProperty("mainColor", color);
  }

  update(dt: number) {

  }

  private onCollisionEnter(event: ICollisionEvent) {
    console.log(event.otherCollider.node);
    const otherNode = event.otherCollider.node;

    // Kiểm tra va chạm với Enemy
    const enemy = otherNode.getComponent(Enemy);
    if (enemy) {
      enemy.takeDamage(100);
      // Hủy projectile
      // this.node.destroy();
    }
  }

  protected onDestroy(): void {
    const collider = this.getComponent(Collider);
    if (collider) {
      collider.off("onCollisionEnter", this.onCollisionEnter, this);
    }
  }
}

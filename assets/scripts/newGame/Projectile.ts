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

@ccclass("Projectile")
export class Projectile extends Component {
  @property(RigidBody)
  private rb: RigidBody = null!;

  @property
  private speed: number = 10;
  private target: Node = null!;
  private damage: number = 0;
  private _isDestroying: boolean = false;
  private visualRenderer: MeshRenderer = null!;

  start() {
    const collider = this.getComponent(Collider);
    if (collider) {
      // Đăng ký sự kiện va chạm
      collider.on("onTriggerEnter", this.onCollisionEnter, this);
    }
  }

  public setTarget(target: Node, damage: number) {
    this.target = target;
    this.damage = damage;
  }

  public setColor(color: Color) {
    // Không lấy trong start(): setColor có thể được gọi ngay sau instantiate(),
    // trước khi lifecycle start() của node này kịp chạy.
    if (!this.visualRenderer) {
      this.visualRenderer = this.getComponentInChildren(MeshRenderer);
    }
    this.visualRenderer?.material?.setProperty("mainColor", color);
    console.log("Projectile color set to:", color.toString());
    console.log(this.visualRenderer?.material);
  }

  update(dt: number) {
    if (this.target && this.target.isValid) {
      const currentPos = this.node.worldPosition;
      const targetPos = this.target.worldPosition;

      // Tính hướng di chuyển
      const direction = new Vec3();
      Vec3.subtract(direction, targetPos, currentPos);

      // Tính góc xoay cho 2D (trục Z)
      // atan2 trả về radian, cần đổi sang degree
      const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;
      this.node.setRotationFromEuler(0, 0, angle + 90);

      // Chuẩn hóa vector hướng để tính vận tốc
      direction.normalize();

      const velocity = new Vec3();
      Vec3.multiplyScalar(velocity, direction, this.speed);

      this.rb.setLinearVelocity(velocity);
    } else if (!this._isDestroying) {
      this._isDestroying = true;
      this.scheduleOnce(() => {
        if (this.node && this.node.isValid) {
          this.node.destroy();
        }
      }, 0.1);
    }
  }

  private onCollisionEnter(event: ICollisionEvent) {
    const otherNode = event.otherCollider.node;

    // Kiểm tra va chạm với Enemy
    const enemy = otherNode.getComponent(Enemy);
    if (enemy) {
      console.log("Hit enemy:", otherNode.name);
      // TODO: Gây sát thương cho enemy
      enemy.takeDamage(this.damage);
      // Hủy projectile
      this.node.destroy();
    }
  }

  protected onDestroy(): void {
    const collider = this.getComponent(Collider);
    if (collider) {
      collider.off("onCollisionEnter", this.onCollisionEnter, this);
    }
  }
}

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
  Texture2D,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("ProjectileLazer")
export class ProjectileLazer extends Component {
  @property(RigidBody)
  private rb: RigidBody = null!;

  @property({
    type: Texture2D,
    tooltip:
      "Ảnh (texture) hiển thị trên tia laser - gán vào mainTexture của material lúc chạy",
  })
  private texture: Texture2D | null = null;

  private visualRenderer: MeshRenderer = null!;
  private target: Node = null!;

  start() {
    const collider = this.getComponent(Collider);
    if (collider) {
      // Đăng ký sự kiện va chạm
      collider.on("onTriggerEnter", this.onCollisionEnter, this);
    }

    this.visualRenderer = this.getComponentInChildren(MeshRenderer);
    if (this.visualRenderer && this.texture) {
      const material = this.visualRenderer.material;
      // Effect builtin-unlit chỉ sample texture khi macro USE_TEXTURE bật -
      // set property mainTexture thôi chưa đủ, phải bật macro này thì shader mới đọc texture.
      material?.recompileShaders({ USE_TEXTURE: true });
      material?.setProperty("mainTexture", this.texture);
    }
  }

  public setTarget(target: Node) {
    this.target = target;
  }

  public setColor(color: Color) {
    if (!this.visualRenderer) {
      this.visualRenderer = this.getComponentInChildren(MeshRenderer);
    }
    this.visualRenderer?.material?.setProperty("mainColor", color);
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
      this.node.setRotationFromEuler(0, 0, angle - 90);

      // Chuẩn hóa vector hướng để tính vận tốc
      direction.normalize();

      const velocity = new Vec3();
      // Vec3.multiplyScalar(velocity, direction, this.speed);

      this.rb.setLinearVelocity(velocity);
    }
    // if (!this._isDestroying) {
    //   this._isDestroying = true;
    //   this.scheduleOnce(() => {
    //     if (this.node && this.node.isValid) {
    //       this.node.destroy();
    //     }
    //   }, 0.1);
    // }
  }

  private onCollisionEnter(_event: ICollisionEvent) {
    // Damage đã được Attack.performLazerAttack() gây tức thời (hitscan) lúc bắn,
    // nên ở đây không gây damage nữa để tránh bị trúng đòn 2 lần.
  }

  protected onDestroy(): void {
    const collider = this.getComponent(Collider);
    if (collider) {
      collider.off("onCollisionEnter", this.onCollisionEnter, this);
    }
  }
}

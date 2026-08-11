import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Vec3,
  director,
  tween,
  Tween,
  PhysicsSystem,
  EPhysicsDrawFlags,
} from "cc";
import { Projectile } from "./Projectile";
import { Enemy } from "./Enemy";
import { Health } from "./Health";
import { Player } from "./Player";
import { PlayerStats } from "./PlayerStats";
import { PlayerSkin } from "./PlayerSkin";
import { StatsType } from "./CharacterDataInterface";
import { ProjectileLazer } from "./ProjectileLazer";

const { ccclass, property } = _decorator;

@ccclass("Attack")
export class Attack extends Component {
  @property(Prefab)
  private projectilePrefab: Prefab | null = null;

  @property(Prefab)
  private projectileLazerPrefab: Prefab | null = null;

  @property(Node) private firePoint: Node = null!;

  @property(PlayerSkin) private playerSkin: PlayerSkin | null = null;

  @property({
    tooltip:
      "Bật hiển thị debug vật lý (wireframe collider + AABB + constraint) để soi lỗi rotation/collider của laser",
  })
  private showPhysicsDebug: boolean = false;

  @property({
    tooltip:
      "Bề rộng vùng ảnh hưởng quanh đường bắn của laser - enemy nào lọt vào đây đều bị diệt",
  })
  private laserBeamWidth: number = 60;

  @property({
    tooltip:
      "Sát thương laser gây cho mọi enemy trên đường bắn (đủ lớn để diệt ngay tại chỗ)",
  })
  private laserKillDamage: number = 99999;

  private damage: number = 0;
  private attackRange: number = 0;
  private attackSpeed: number = 0;

  private attackTimer: number = 0;
  private currentTarget: Node | null = null;
  private currentLaserNode: Node | null = null;

  private player: Player = null!;

  private playerStats: PlayerStats = null!;

  protected start(): void {
    // Vẽ wireframe collider + AABB + constraint để soi lỗi rotation/collider của laser.
    // Cần bật "Geometry Renderer" trong Project Settings > Feature Cropping,
    // nếu không phần vẽ debug sẽ không hiện dù bật cờ này.
    PhysicsSystem.instance.debugDrawFlags = this.showPhysicsDebug
      ? EPhysicsDrawFlags.WIRE_FRAME | EPhysicsDrawFlags.AABB | EPhysicsDrawFlags.CONSTRAINT
      : EPhysicsDrawFlags.NONE;

    this.playerStats = this.node.getComponent(PlayerStats);
    if (this.playerStats !== null) {
      this.playerStats.onUpgradeStats.on(this.onUpgradeStats, this);
    }
  }

  public setPlayer(player: Player): void {
    this.player = player;
  }

  public getLaserPrefab(): Prefab | null {
    return this.projectileLazerPrefab;
  }

  public getFirePoint(): Node {
    return this.firePoint;
  }

  public setup(damage: number, attackRange: number, attackSpeed: number): void {
    this.damage = damage;
    this.attackRange = attackRange;
    this.attackSpeed = attackSpeed;
  }

  protected update(dt: number): void {
    if (this.attackSpeed <= 0) return;

    this.attackTimer += dt;
    const cooldown = 1 / this.attackSpeed;

    // Nếu chưa có target hoặc target chết/ra ngoài tầm -> tìm target mới
    if (!this.isValidTarget(this.currentTarget)) {
      this.currentTarget = this.findNearestTarget();
    }

    // Tấn công
    if (this.currentTarget && this.attackTimer >= cooldown) {
      this.fire();
      this.attackTimer = 0;
    }
  }

  private fire(): void {
    if (!this.currentTarget) return;

    if (this.projectilePrefab) {
      this.performRangeAttack();
    } else {
      this.performMeleeAttack();
    }
  }

  private performRangeAttack(): void {
    if (!this.projectilePrefab || !this.currentTarget) return;

    // Xoay trục Y hướng về target
    const direction = new Vec3();
    Vec3.subtract(
      direction,
      this.currentTarget.worldPosition,
      this.node.worldPosition,
    );
    const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;
    this.node.setRotationFromEuler(0, 0, angle - 90);

    const projectileNode = instantiate(this.projectilePrefab);

    // Đặt projectile vào scene để không bị xoay/scale theo parent
    const scene = director.getScene();
    if (scene) {
      scene.addChild(projectileNode);
    } else {
      this.node.addChild(projectileNode);
    }

    // Đặt vị trí xuất phát từ nhân vật
    projectileNode.setWorldPosition(this.firePoint.worldPosition);

    const projectile = projectileNode.getComponent(Projectile);
    if (projectile) {
      // Giả sử setTarget nhận target và damage
      projectile.setTarget(this.currentTarget, this.damage);

      if (this.playerSkin) {
        // projectile.setColor(this.playerSkin.getCurrentColor());
      }
    }
  }

  /**
   * Laser: trúng đích tức thời (hitscan), không có thời gian bay như đạn thường.
   * Không scale theo khoảng cách - giữ nguyên kích thước gốc do prefab tự quyết định,
   * chỉ đặt vị trí + xoay đúng hướng bắn từ nòng súng.
   * Tự tìm target riêng (enemy gần nhất trong toàn scene), KHÔNG bị giới hạn bởi
   * attackRange như attack thường - luôn bắn được miễn còn enemy trên màn hình.
   */
  public performLazerAttack(): void {
    if (!this.projectileLazerPrefab || this.currentLaserNode) return;

    const target = this.findNearestEnemyAnyRange();
    if (!target) return;

    const origin = this.node.worldPosition.clone();
    const direction = new Vec3();
    Vec3.subtract(direction, target.worldPosition, origin);
    if (direction.lengthSqr() === 0) return;
    direction.normalize();

    const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;

    // Diệt tức thời TẤT CẢ enemy nằm trên đường bắn (trong bề rộng laserBeamWidth),
    // không chỉ 1 con - không phụ thuộc va chạm vật lý vì laser đứng yên tại nòng súng.
    this.damageEnemiesOnBeam(origin, direction);

    const laserNode = instantiate(this.projectileLazerPrefab);
    this.currentLaserNode = laserNode;
    laserNode.getComponent(ProjectileLazer).setTarget(target);

    const scene = director.getScene();
    if (scene) {
      scene.addChild(laserNode);
    } else {
      this.node.addChild(laserNode);
    }

    laserNode.setWorldPosition(this.firePoint.worldPosition);
    laserNode.setRotationFromEuler(0, 0, angle - 90);
   
    const baseScale = laserNode.scale.clone();
    laserNode.setScale(0, baseScale.y, baseScale.z);

    tween(laserNode)
      .to(0.2, { scale: baseScale }, { easing: "quadOut" })
      .delay(0.15)
      .to(0.2, { scale: new Vec3(0, baseScale.y, baseScale.z) }, { easing: "quadIn" })
      .call(() => {
        laserNode.destroy();
        this.currentLaserNode = null;
      })
      .start();
  }

  private performMeleeAttack(): void {
    if (!this.currentTarget) return;

    const health = this.currentTarget.getComponent(Health);
    if (health) {
      health.takeDamage(this.damage);
    }
  }

  private isValidTarget(target: Node | null): boolean {
    if (!target || !target.isValid) return false;

    // Kiểm tra khoảng cách
    const dist = Vec3.distance(this.node.worldPosition, target.worldPosition);
    return dist <= this.attackRange;
  }

  private findNearestTarget(): Node | null {
    if (this.player) {
      // Player tìm Enemy
      // TODO: Tối ưu bằng cách dùng EnemyManager thay vì tìm kiếm toàn bộ scene
      const scene = director.getScene();
      if (!scene) return null;

      const enemies = scene.getComponentsInChildren(Enemy);

      let nearest: Node | null = null;
      let minDistance = this.attackRange; // Chỉ tìm trong tầm đánh

      const currentPos = this.node.worldPosition;

      for (const enemy of enemies) {
        if (enemy.node && enemy.node.isValid) {
          const dist = Vec3.distance(currentPos, enemy.node.worldPosition);
          if (dist <= minDistance) {
            minDistance = dist;
            nearest = enemy.node;
          }
        }
      }
      return nearest;
    } else {
      // Enemy tìm Player
      const player = Player.Instance;
      if (player && player.node && player.node.isValid) {
        const dist = Vec3.distance(
          this.node.worldPosition,
          player.node.worldPosition,
        );
        if (dist <= this.attackRange) {
          return player.node;
        }
      }
      return null;
    }
  }

  /** Tìm enemy gần nhất trong toàn scene, không giới hạn bởi attackRange - dùng riêng cho laser. */
  private findNearestEnemyAnyRange(): Node | null {
    const scene = director.getScene();
    if (!scene) return null;

    const enemies = scene.getComponentsInChildren(Enemy);
    let nearest: Node | null = null;
    let minDistance = Infinity;
    const currentPos = this.node.worldPosition;

    for (const enemy of enemies) {
      if (enemy.node && enemy.node.isValid) {
        const dist = Vec3.distance(currentPos, enemy.node.worldPosition);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = enemy.node;
        }
      }
    }
    return nearest;
  }

  /**
   * Diệt tức thời mọi enemy nằm trên đường bắn: chiếu vị trí từng enemy lên tia
   * (origin -> direction), enemy nào ở phía trước (t >= 0) và cách đường thẳng đó
   * không quá laserBeamWidth thì bị trúng đạn, bất kể enemy đó ở gần hay xa.
   */
  private damageEnemiesOnBeam(origin: Vec3, direction: Vec3): void {
    const scene = director.getScene();
    if (!scene) return;

    const enemies = scene.getComponentsInChildren(Enemy);
    const toEnemy = new Vec3();
    const perp = new Vec3();

    for (const enemy of enemies) {
      if (!enemy.node || !enemy.node.isValid) continue;

      Vec3.subtract(toEnemy, enemy.node.worldPosition, origin);
      const t = Vec3.dot(toEnemy, direction);
      if (t < 0) continue;

      Vec3.scaleAndAdd(perp, toEnemy, direction, -t);
      if (perp.length() <= this.laserBeamWidth) {
        enemy.takeDamage(this.laserKillDamage);
      }
    }
  }

  private onUpgradeStats(type: StatsType): void {
    const stat = this.playerStats.getStats(type);
    if (!stat) return;

    switch (type) {
      case StatsType.DAMAGE:
        this.damage += stat.valuePerLevel;
        break;
      case StatsType.ATTACK_RANGE:
        this.attackRange += stat.valuePerLevel;
        break;
      case StatsType.ATTACK_SPEED:
        this.attackSpeed += stat.valuePerLevel * 10;
        break;
    }
  }
}

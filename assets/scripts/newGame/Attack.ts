import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Vec3,
  director,
} from "cc";
import { Projectile } from "./Projectile";
import { Enemy } from "./Enemy";
import { Health } from "./Health";
import { Player } from "./Player";
import { PlayerStats } from "./PlayerStats";
import { PlayerSkin } from "./PlayerSkin";
import { StatsType } from "./CharacterDataInterface";

const { ccclass, property } = _decorator;

@ccclass("Attack")
export class Attack extends Component {
  @property(Prefab)
  private projectilePrefab: Prefab | null = null;

  @property(Prefab)
  private projectileLazerPrefab: Prefab | null = null;

  @property(Node) private firePoint: Node = null!;

  @property(PlayerSkin) private playerSkin: PlayerSkin | null = null;

  private damage: number = 0;
  private attackRange: number = 0;
  private attackSpeed: number = 0;

  private attackTimer: number = 0;
  private currentTarget: Node | null = null;
  private currentLaserNode: Node | null = null;

  private player: Player = null!;

  private playerStats: PlayerStats = null!;

  protected start(): void {
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
    if (!this.projectileLazerPrefab) return;

    const target = this.findNearestEnemyAnyRange();
    if (!target) return;

    const direction = new Vec3();
    Vec3.subtract(direction, target.worldPosition, this.node.worldPosition);
    if (direction.lengthSqr() === 0) return;

    const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;
    this.node.setRotationFromEuler(0, 0, angle - 90);

    // Gây damage ngay lập tức - laser không cần thời gian bay tới target
    const health = target.getComponent(Health);
    health?.takeDamage(this.damage);

    // Huỷ tia laser cũ (nếu còn) trước khi tạo tia mới - tránh nhiều tia chồng lên
    // nhau cùng lúc (mỗi tia hướng hơi khác nhau do target di chuyển) trông như bị cong.
    if (this.currentLaserNode && this.currentLaserNode.isValid) {
      this.currentLaserNode.destroy();
    }

    const laserNode = instantiate(this.projectileLazerPrefab);
    this.currentLaserNode = laserNode;

    const scene = director.getScene();
    if (scene) {
      scene.addChild(laserNode);
    } else {
      this.node.addChild(laserNode);
    }

    // QUAN TRỌNG: prefab projectileLazerPrefab phải có pivot (gốc node) nằm ở
    // đầu "đuôi" của tia (phía súng), mesh chỉ trải dài về 1 hướng (+Y cục bộ) -
    // không để mesh nằm giữa (tâm), nếu không tia sẽ cắt ngang qua nòng súng.
    // Sửa trong editor: mở prefab, chọn node con chứa mesh, dịch Position.y của nó
    // sao cho mép mesh chạm đúng gốc (0,0,0) của node cha, thay vì để tâm ở (0,0,0).
    laserNode.setWorldPosition(this.firePoint.worldPosition);
    laserNode.setRotationFromEuler(0, 0, angle - 90);

    // Không setTarget() nên tắt hẳn component Projectile - nếu không nó sẽ tự huỷ
    // node sau 0.1s do nghĩ "không có target" (logic có sẵn trong Projectile.update()),
    // đè lên thời gian sống mà mình tự quản lý bên dưới.
    const laserProjectile = laserNode.getComponent(Projectile);
    if (laserProjectile) laserProjectile.enabled = false;

    // Laser chỉ loé lên tức thời rồi biến mất, không tồn tại lâu như đạn thường
    this.scheduleOnce(() => {
      if (laserNode && laserNode.isValid) laserNode.destroy();
      if (this.currentLaserNode === laserNode) this.currentLaserNode = null;
    }, 1);
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

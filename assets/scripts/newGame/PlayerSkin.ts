import { _decorator, Color, Component, MeshRenderer, Texture2D } from "cc";
import { PlayerStats } from "./PlayerStats";
import { StatsType } from "./CharacterDataInterface";
const { ccclass, property } = _decorator;

@ccclass("PlayerSkin")
export class PlayerSkin extends Component {
  @property(PlayerStats) private playerStats: PlayerStats = null;

  // Level DAMAGE tối thiểu để mở từng tier skin, tương ứng theo index với skinTextures.
  @property([Number]) private levelThresholds: number[] = [
    1, 5, 10, 15, 20, 25,
  ];

  // Kéo Layer 2.png .. Layer 7.png vào đây theo đúng thứ tự tier (thấp -> cao).
  @property([Texture2D]) private skinTextures: Texture2D[] = [];

  // Màu ứng với từng tier (cùng index với skinTextures), dùng để tint đạn bắn ra.
  @property([Color]) private skinColors: Color[] = [];

  private meshRenderer: MeshRenderer = null;
  private currentColor: Color = Color.WHITE;
  private quadAspect: number = null;

  protected onLoad(): void {
    this.meshRenderer = this.getComponent(MeshRenderer);
    this.quadAspect = this.readQuadAspect();
  }

  // Đọc AABB thật của mesh Quad (không phụ thuộc texture nào) để biết đúng tỉ lệ khung hình,
  // vì texture luôn bị kéo giãn vừa khít quad bất kể tỉ lệ ảnh gốc.
  private readQuadAspect(): number | null {
    const min = this.meshRenderer?.mesh?.struct?.minPosition;
    const max = this.meshRenderer?.mesh?.struct?.maxPosition;
    if (!min || !max) return null;

    const width = max.x - min.x;
    const height = max.y - min.y;
    if (!width || !height) return null;

    return width / height;
  }

  protected start(): void {
    if (this.playerStats) {
      this.playerStats.onUpgradeStats.on(this.onUpgradeStats, this);
    }

    this.applySkinForLevel(
      this.playerStats?.getStats(StatsType.DAMAGE)?.level ?? 1,
    );
  }

  private onUpgradeStats(type: StatsType): void {
    if (type !== StatsType.DAMAGE) return;

    const level = this.playerStats.getStats(StatsType.DAMAGE)?.level ?? 1;
    console.log(`PlayerSkin: DAMAGE level upgraded to ${level}`);
    this.applySkinForLevel(level);
  }

  private applySkinForLevel(level: number): void {
    let tierIndex = 0;
    for (let i = 0; i < this.levelThresholds.length; i++) {
      if (level >= this.levelThresholds[i]) {
        tierIndex = i;
      }
    }

    const texture = this.skinTextures[tierIndex];
    if (!texture || !this.meshRenderer.material) return;

    this.meshRenderer.material.setProperty("mainTexture", texture);
    this.fixAspectRatio(texture);

    if (this.skinColors[tierIndex]) {
      this.currentColor = this.skinColors[tierIndex];
    }
  }

  public getCurrentColor(): Color {
    return this.currentColor;
  }

  // Texture luôn bị kéo giãn vừa khít khung quad, bất kể tỉ lệ ảnh gốc là gì.
  // Nên phải bù scale.x theo đúng tỉ lệ thật của quad (quadAspect), không phải theo
  // tỉ lệ của 1 texture khác (nếu không vẫn còn méo, chỉ đỡ hơn).
  private fixAspectRatio(texture: Texture2D): void {
    if (!texture.height) return;

    const aspect = texture.width / texture.height;

    if (this.quadAspect) {
      this.node.setScale(aspect / this.quadAspect, 1, 1);
      return;
    }

    // Fallback nếu không đọc được AABB của mesh: dùng skinTextures[0] làm tham chiếu.
    const baseTexture = this.skinTextures[0];
    if (!baseTexture || !baseTexture.height) return;

    const baseAspect = baseTexture.width / baseTexture.height;
    this.node.setScale(aspect / baseAspect, 1, 1);
  }
}

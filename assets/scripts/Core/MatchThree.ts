import {
  _decorator,
  Component,
  Node,
  Graphics,
  UITransform,
  UIOpacity,
  Color,
  Vec3,
  tween,
  Tween,
  EventTouch,
  director,
  Prefab,
  instantiate,
  SpriteFrame,
  Sprite,
} from "cc";
import { Player } from "../newGame/Player";
import { Enemy } from "../newGame/Enemy";
import { Projectile } from "../newGame/Projectile";
import { Game, GameState } from "./Game";
import { GameAudioAdapter } from "./GameAudioAdapter";
import { AudioPlayer } from "./AudioPlayer";
const { ccclass, property } = _decorator;

interface SelectedCell {
  row: number;
  col: number;
}

/**
 * Simple 5x4 match-3 board. Tap a gem then tap an adjacent gem to swap.
 * Every time a match resolves (including cascades), a laser beam fires once.
 * Attach this component to a UI node under a Canvas so touch input works.
 */
@ccclass("MatchThree")
export class MatchThree extends Component {
  @property({ tooltip: "Số cột của bảng" })
  cols: number = 5;

  @property({ tooltip: "Số hàng của bảng" })
  rows: number = 4;

  @property({ tooltip: "Kích thước mỗi ô (px)" })
  cellSize: number = 96;

  @property({ tooltip: "Khoảng cách giữa các ô" })
  spacing: number = 8;

  @property({
    type: Node,
    tooltip: "Node chứa lưới gem, để trống sẽ dùng chính node này",
  })
  gridRoot: Node | null = null;

  @property({
    tooltip: "Sát thương tia laser gây cho enemy (đủ lớn để diệt luôn)",
  })
  laserDamage: number = 99999;

  @property({ tooltip: "Bề rộng vùng ảnh hưởng quanh đường bắn của tia laser" })
  laserBeamWidth: number = 60;

  @property({
    tooltip:
      "Số lần match thành công cho phép trước khi hiện tap-to-store (mặc định 8, lần thứ 9 sẽ ra CTA)",
  })
  matchesBeforeStore: number = 8;

  @property({
    type: Node,
    tooltip:
      "Panel tap-to-store (vd node Download) sẽ được active khi đạt đủ số lần match",
  })
  storePanel: Node | null = null;

  @property({
    tooltip:
      "Hiện icon tay hướng dẫn vuốt giữa 2 gem ăn được, tự tắt khi user chạm lần đầu",
  })
  tutorialEnabled: boolean = true;

  @property({
    type: Node,
    tooltip:
      "Prefab icon tay tutorial của bạn (vd assets/media/prefabs/UI/tutorial.prefab)",
  })
  tutorialHandPrefab: Node | null = null;

  @property({
    type: Vec3,
    tooltip:
      "Offset canh chỉnh vị trí tay so với tâm ô gem (tuỳ theo prefab tay của bạn)",
  })
  tutorialHandOffset: Vec3 = new Vec3(0, 60, 0);

  @property({
    type: [SpriteFrame],
    tooltip: "Ảnh gem theo từng loại (index khớp với INITIAL_LAYOUT)",
  })
  gemSpr: SpriteFrame[] = [];

  @property(GameAudioAdapter) public gameAudioAdapter: GameAudioAdapter = null;
  @property(AudioPlayer) public audioPlayer: AudioPlayer = null;

  /** Bàn khởi đầu cố định, mô phỏng theo ảnh ref (5 cột x 4 hàng). */
  private static readonly INITIAL_LAYOUT: number[][] = [
    [0, 1, 2, 1, 3],
    [0, 4, 2, 1, 5],
    [6, 4, 5, 2, 1],
    [4, 5, 0, 3, 5],
  ];

  private board: number[][] = [];
  private gemNodes: (Node | null)[][] = [];
  private selected: SelectedCell | null = null;
  private touchStartCell: SelectedCell | null = null;
  private touchStartPos: Vec3 | null = null;
  private isBusy = false;
  private gunPosition: Vec3 = new Vec3();
  private successfulMatchCount = 0;
  private hasTriggeredStore = false;
  private tutorialHandNode: Node | null = null;
  private tutorialStopped = false;

  start() {
    this.buildGrid();
    this.resetBoardIfNoMoves();
    this.startTutorialHint();
  }

  onDestroy() {
    this.gridRoot?.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.gridRoot?.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.gridRoot?.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.stopTutorialHint();
  }

  private buildGrid() {
    const container = this.gridRoot ?? this.node;
    this.gridRoot = container;

    const step = this.cellSize + this.spacing;
    const uiTransform =
      container.getComponent(UITransform) ??
      container.addComponent(UITransform);
    uiTransform.setContentSize(this.cols * step, this.rows * step);

    this.board = [];
    this.gemNodes = [];
    for (let r = 0; r < this.rows; r++) {
      this.board[r] = [];
      this.gemNodes[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const color = this.getInitialColor(r, c);
        this.board[r][c] = color;
        this.gemNodes[r][c] = this.createGemNode(r, c, color);
      }
    }

    this.createGunVisual();
    container.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    container.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    container.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  /** Tạo một khẩu súng cố định bên dưới bàn, làm điểm xuất phát của tia laser trong minigame. */
  private createGunVisual() {
    const step = this.cellSize + this.spacing;
    const halfHeight = (this.rows * step) / 2;
    this.gunPosition = new Vec3(0, -halfHeight - step * 0.6, 0);

    const gunNode = new Node("LaserGun");
    gunNode.layer = this.gridRoot!.layer;
    gunNode.addComponent(UITransform).setContentSize(step * 0.6, step * 0.6);

    const g = gunNode.addComponent(Graphics);
    const half = step * 0.25;
    g.fillColor = new Color(90, 95, 110, 255);
    g.moveTo(-half, -half * 0.6);
    g.lineTo(half, -half * 0.6);
    g.lineTo(0, half);
    g.close();
    g.fill();

    gunNode.setPosition(this.gunPosition);
    this.gridRoot!.addChild(gunNode);
  }

  private getInitialColor(row: number, col: number): number {
    const fixedRow = MatchThree.INITIAL_LAYOUT[row];
    if (fixedRow && fixedRow[col] !== undefined) {
      return fixedRow[col];
    }
    return this.randomColorAvoidingMatch(row, col);
  }

  private randomColorAvoidingMatch(row: number, col: number): number {
    let color: number;
    do {
      color = Math.floor(Math.random() * this.gemSpr.length);
    } while (
      (col >= 2 &&
        this.board[row][col - 1] === color &&
        this.board[row][col - 2] === color) ||
      (row >= 2 &&
        this.board[row - 1][col] === color &&
        this.board[row - 2][col] === color)
    );
    return color;
  }

  private cellPosition(row: number, col: number): Vec3 {
    const step = this.cellSize + this.spacing;
    const x = (col - (this.cols - 1) / 2) * step;
    const y = ((this.rows - 1) / 2 - row) * step;
    return new Vec3(x, y, 0);
  }

  private createGemNode(
    row: number,
    col: number,
    color: number,
    spawnAbove = false,
  ): Node {
    const node = new Node(`Gem_${row}_${col}`);
    node.layer = this.gridRoot!.layer;
    const ui = node.addComponent(UITransform);
    ui.setContentSize(this.cellSize, this.cellSize);

    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.gemSpr[color] ?? null;

    this.gridRoot!.addChild(node);

    const pos = this.cellPosition(row, col);
    if (spawnAbove) {
      node.setPosition(
        pos.x,
        pos.y + (this.rows + 1) * (this.cellSize + this.spacing),
        0,
      );
    } else {
      node.setPosition(pos);
    }
    return node;
  }

  private getLocalTouchPos(event: EventTouch): Vec3 {
    const container = this.gridRoot!;
    const uiTransform = container.getComponent(UITransform)!;
    const uiLocation = event.getUILocation();
    return uiTransform.convertToNodeSpaceAR(
      new Vec3(uiLocation.x, uiLocation.y, 0),
    );
  }

  private localPosToCell(local: Vec3): SelectedCell | null {
    const step = this.cellSize + this.spacing;
    const col = Math.round(local.x / step + (this.cols - 1) / 2);
    const row = Math.round((this.rows - 1) / 2 - local.y / step);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return { row, col };
  }

  private onTouchStart(event: EventTouch) {
    this.stopTutorialHint();

    this.touchStartCell = null;
    this.touchStartPos = null;
    if (this.isBusy) return;

    const local = this.getLocalTouchPos(event);
    const cell = this.localPosToCell(local);
    if (!cell) return;

    this.touchStartCell = cell;
    this.touchStartPos = local;
  }

  private onTouchEnd(event: EventTouch) {
    const startCell = this.touchStartCell;
    const startPos = this.touchStartPos;
    this.touchStartCell = null;
    this.touchStartPos = null;
    if (this.isBusy || !startCell || !startPos) return;

    const local = this.getLocalTouchPos(event);
    const dx = local.x - startPos.x;
    const dy = local.y - startPos.y;
    const swipeThreshold = this.cellSize * 0.35;

    if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
      // Vuốt: xác định hướng chiếm ưu thế rồi swap sang ô liền kề theo hướng đó.
      let targetRow = startCell.row;
      let targetCol = startCell.col;
      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? -1 : 1;
      }

      this.deselect();
      if (
        targetRow >= 0 &&
        targetRow < this.rows &&
        targetCol >= 0 &&
        targetCol < this.cols
      ) {
        this.trySwap(startCell.row, startCell.col, targetRow, targetCol);
      }
    } else {
      this.handleCellTap(startCell.row, startCell.col);
    }
  }

  private handleCellTap(row: number, col: number) {
    if (!this.selected) {
      this.select(row, col);
      return;
    }

    const prev = this.selected;
    if (prev.row === row && prev.col === col) {
      this.deselect();
      return;
    }

    const isAdjacent =
      Math.abs(prev.row - row) + Math.abs(prev.col - col) === 1;
    this.deselect();
    if (isAdjacent) {
      this.trySwap(prev.row, prev.col, row, col);
    } else {
      this.select(row, col);
    }
  }

  private select(row: number, col: number) {
    this.selected = { row, col };
    const node = this.gemNodes[row][col];
    if (node)
      tween(node)
        .to(0.1, { scale: new Vec3(1.15, 1.15, 1) })
        .start();
  }

  private deselect() {
    if (!this.selected) return;
    const node = this.gemNodes[this.selected.row][this.selected.col];
    if (node)
      tween(node)
        .to(0.1, { scale: new Vec3(1, 1, 1) })
        .start();
    this.selected = null;
  }

  private tweenTo(node: Node, pos: Vec3): Promise<void> {
    return new Promise((resolve) => {
      tween(node)
        .to(0.18, { position: pos }, { easing: "quadOut" })
        .call(() => resolve())
        .start();
    });
  }

  private async trySwap(r1: number, c1: number, r2: number, c2: number) {
    if (this.hasTriggeredStore) return;

    this.isBusy = true;
    await this.swapNodes(r1, c1, r2, c2);

    const matches = this.findMatches();
    if (matches.size === 0) {
      await this.swapNodes(r1, c1, r2, c2);
      this.isBusy = false;
      return;
    }
    this.audioPlayer.playSound(this.gameAudioAdapter.matchSound);
    this.successfulMatchCount++;
    if (this.successfulMatchCount > this.matchesBeforeStore) {
      this.triggerTapToStore();
      this.isBusy = false;
      return;
    }

    await this.resolveLoop();
    this.isBusy = false;
  }

  /** Lần match thành công thứ (matchesBeforeStore + 1): dừng gameplay và bắn CTA tap-to-store. */
  private triggerTapToStore() {
    this.hasTriggeredStore = true;
    if (this.storePanel) this.storePanel.active = true;
    Game.instance?.GameCallCTA();
    if (Game.instance) Game.instance.CurrentGameState = GameState.Win;
  }

  private async swapNodes(r1: number, c1: number, r2: number, c2: number) {
    const tmpColor = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = tmpColor;

    const tmpNode = this.gemNodes[r1][c1];
    this.gemNodes[r1][c1] = this.gemNodes[r2][c2];
    this.gemNodes[r2][c2] = tmpNode;

    const posA = this.cellPosition(r1, c1);
    const posB = this.cellPosition(r2, c2);
    const nodeA = this.gemNodes[r1][c1];
    const nodeB = this.gemNodes[r2][c2];

    const anims: Promise<void>[] = [];
    if (nodeA) anims.push(this.tweenTo(nodeA, posA));
    if (nodeB) anims.push(this.tweenTo(nodeB, posB));
    await Promise.all(anims);
  }

  private findMatches(): Set<string> {
    const matched = new Set<string>();

    for (let r = 0; r < this.rows; r++) {
      let runStart = 0;
      for (let c = 1; c <= this.cols; c++) {
        const prevColor = this.board[r][c - 1];
        const curColor = c < this.cols ? this.board[r][c] : -2;
        if (curColor !== prevColor) {
          if (c - runStart >= 3) {
            for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
          }
          runStart = c;
        }
      }
    }

    for (let c = 0; c < this.cols; c++) {
      let runStart = 0;
      for (let r = 1; r <= this.rows; r++) {
        const prevColor = this.board[r - 1][c];
        const curColor = r < this.rows ? this.board[r][c] : -2;
        if (curColor !== prevColor) {
          if (r - runStart >= 3) {
            for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
          }
          runStart = r;
        }
      }
    }

    return matched;
  }

  private async resolveLoop() {
    for (;;) {
      const matches = this.findMatches();
      if (matches.size === 0) break;

      //   this.flashMatchBoard(matches);
      this.fireLaserAtEnemies();
      await this.clearMatches(matches);
      await this.collapseAndRefill();
    }

    await this.resetBoardIfNoMoves();
  }

  /** Sau khi bàn ổn định, nếu không còn nước đi hợp lệ nào thì xáo lại toàn bộ bàn. */
  private async resetBoardIfNoMoves() {
    if (this.hasPossibleMove()) return;

    this.isBusy = true;
    await this.reshuffleBoard();
    this.isBusy = false;
  }

  private hasPossibleMove(): boolean {
    return this.findHintMove() !== null;
  }

  /** Tìm 1 cặp ô liền kề mà nếu swap sẽ tạo match, dùng cho cả reshuffle-check lẫn icon tay tutorial. */
  private findHintMove(): { from: SelectedCell; to: SelectedCell } | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols) {
          this.swapBoardValues(r, c, r, c + 1);
          const found = this.findMatches().size > 0;
          this.swapBoardValues(r, c, r, c + 1);
          if (found)
            return { from: { row: r, col: c }, to: { row: r, col: c + 1 } };
        }
        if (r + 1 < this.rows) {
          this.swapBoardValues(r, c, r + 1, c);
          const found = this.findMatches().size > 0;
          this.swapBoardValues(r, c, r + 1, c);
          if (found)
            return { from: { row: r, col: c }, to: { row: r + 1, col: c } };
        }
      }
    }
    return null;
  }

  private swapBoardValues(r1: number, c1: number, r2: number, c2: number) {
    const tmp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = tmp;
  }

  private async reshuffleBoard() {
    const clearAnims: Promise<void>[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const node = this.gemNodes[r][c];
        if (!node) continue;
        clearAnims.push(
          new Promise((resolve) => {
            tween(node)
              .to(0.15, { scale: new Vec3(0, 0, 0) }, { easing: "backIn" })
              .call(() => {
                node.removeFromParent();
                node.destroy();
                resolve();
              })
              .start();
          }),
        );
      }
    }
    await Promise.all(clearAnims);

    let attempts = 0;
    do {
      this.board = [];
      for (let r = 0; r < this.rows; r++) {
        this.board[r] = [];
        for (let c = 0; c < this.cols; c++) {
          this.board[r][c] = this.randomColorAvoidingMatch(r, c);
        }
      }
      attempts++;
    } while (!this.hasPossibleMove() && attempts < 20);

    const spawnAnims: Promise<void>[] = [];
    this.gemNodes = [];
    for (let r = 0; r < this.rows; r++) {
      this.gemNodes[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const node = this.createGemNode(r, c, this.board[r][c], true);
        this.gemNodes[r][c] = node;
        spawnAnims.push(this.tweenTo(node, this.cellPosition(r, c)));
      }
    }
    await Promise.all(spawnAnims);
  }

  private clearMatches(matches: Set<string>): Promise<void> {
    const anims: Promise<void>[] = [];
    matches.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const node = this.gemNodes[r][c];
      this.board[r][c] = -1;
      this.gemNodes[r][c] = null;
      if (!node) return;

      anims.push(
        new Promise((resolve) => {
          tween(node)
            .to(0.16, { scale: new Vec3(0, 0, 0) }, { easing: "backIn" })
            .call(() => {
              node.removeFromParent();
              node.destroy();
              resolve();
            })
            .start();
        }),
      );
    });
    return Promise.all(anims).then(() => {});
  }

  private async collapseAndRefill() {
    const anims: Promise<void>[] = [];

    for (let c = 0; c < this.cols; c++) {
      const remaining: { node: Node; color: number }[] = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.board[r][c] !== -1) {
          remaining.push({
            node: this.gemNodes[r][c]!,
            color: this.board[r][c],
          });
        }
      }

      for (let i = 0; i < remaining.length; i++) {
        const targetRow = this.rows - 1 - i;
        this.board[targetRow][c] = remaining[i].color;
        this.gemNodes[targetRow][c] = remaining[i].node;
        anims.push(
          this.tweenTo(remaining[i].node, this.cellPosition(targetRow, c)),
        );
      }

      const missing = this.rows - remaining.length;
      for (let i = 0; i < missing; i++) {
        const targetRow = missing - 1 - i;
        const color = Math.floor(Math.random() * this.gemSpr.length);
        this.board[targetRow][c] = color;
        const node = this.createGemNode(targetRow, c, color, true);
        this.gemNodes[targetRow][c] = node;
        anims.push(this.tweenTo(node, this.cellPosition(targetRow, c)));
      }
    }

    await Promise.all(anims);
  }

  private drawBeam(
    g: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    g.clear();
    g.lineWidth = 16;
    g.strokeColor = new Color(255, 40, 40, 255);
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();

    g.lineWidth = 5;
    g.strokeColor = new Color(255, 230, 230, 255);
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  }

  /**
   * Bắn tia laser thật từ vị trí Player, diệt mọi Enemy nằm trên đường bắn.
   * Nhắm theo enemy gần nhất để luôn trúng ít nhất 1 mục tiêu; các enemy khác
   * nằm trong bề rộng `laserBeamWidth` quanh cùng đường thẳng cũng bị trúng đạn.
   */
  /**
   * Bắn tia laser thật từ Player, diệt mọi Enemy nằm trên đường bắn.
   * Mỗi enemy trúng đạn được bắn bằng 1 bản instantiate riêng của projectileLazerPrefab
   * (component Attack.ts), bay tới đúng enemy đó và gây damage qua va chạm thật -
   * không vẽ Graphics nữa.
   */
  private fireLaserAtEnemies() {
    const player = Player.Instance;
    const scene = director.getScene();
    if (!player || !player.node || !player.node.isValid || !scene) return;
    this.audioPlayer.playSound(this.gameAudioAdapter.lazer);

    const attack = player.attack;
    attack?.performLazerAttack();
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) =>
      this.scheduleOnce(() => resolve(), seconds),
    );
  }

  private tweenOpacity(
    opacity: UIOpacity,
    target: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      tween(opacity)
        .to(duration, { opacity: target })
        .call(() => resolve())
        .start();
    });
  }

  private tweenPosition(
    node: Node,
    pos: Vec3,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      tween(node)
        .to(duration, { position: pos }, { easing: "quadInOut" })
        .call(() => resolve())
        .start();
    });
  }

  /** Vòng lặp icon tay: minh hoạ 1 nước đi hợp lệ, lặp lại tới khi user chạm lần đầu. */
  private async startTutorialHint() {
    if (!this.tutorialEnabled) return;

    await this.delay(0.4);
    while (!this.tutorialStopped && this.node.isValid) {
      if (this.isBusy) {
        await this.delay(0.2);
        continue;
      }

      const hint = this.findHintMove();
      if (!hint) {
        await this.delay(0.4);
        continue;
      }

      await this.playHandHint(hint.from, hint.to);
      if (this.tutorialStopped) break;
      await this.delay(0.6);
    }

    this.destroyTutorialHand();
  }

  private stopTutorialHint() {
    if (this.tutorialStopped) return;
    this.tutorialStopped = true;
    this.destroyTutorialHand();
  }

  private destroyTutorialHand() {
    if (!this.tutorialHandNode) return;
    Tween.stopAllByTarget(this.tutorialHandNode);
    const opacity = this.tutorialHandNode.getComponent(UIOpacity);
    if (opacity) Tween.stopAllByTarget(opacity);
    this.tutorialHandNode.removeFromParent();
    this.tutorialHandNode.destroy();
    this.tutorialHandNode = null;
  }

  /** Dựng icon tay từ prefab do bạn cung cấp (tutorialHandPrefab), tái sử dụng nếu đã tồn tại. */
  private ensureTutorialHand(): Node | null {
    if (this.tutorialHandNode && this.tutorialHandNode.isValid)
      return this.tutorialHandNode;
    if (!this.tutorialHandPrefab) return null;

    const node = this.tutorialHandPrefab;
    node.layer = this.gridRoot!.layer;
    if (!node.getComponent(UIOpacity)) node.addComponent(UIOpacity);
    this.gridRoot!.addChild(node);
    this.tutorialHandNode = node;
    return node;
  }

  /** Icon tay: hiện tại A (tự "tap" theo animation có sẵn của prefab) -> trượt sang B -> tap -> ẩn đi. */
  private async playHandHint(from: SelectedCell, to: SelectedCell) {
    const node = this.ensureTutorialHand();
    if (!node) return; // chưa gán tutorialHandPrefab trong inspector

    node.setSiblingIndex(this.gridRoot!.children.length - 1);
    const opacity = node.getComponent(UIOpacity)!;

    Tween.stopAllByTarget(node);
    Tween.stopAllByTarget(opacity);

    const posFrom = this.cellPosition(from.row, from.col).add(
      this.tutorialHandOffset,
    );
    const posTo = this.cellPosition(to.row, to.col)
      .add(this.tutorialHandOffset)
      .add(new Vec3(0, -50, 0));

    node.active = true;
    node.setPosition(posFrom.add(new Vec3(0, -50, 0)));
    opacity.opacity = 0;

    await this.tweenOpacity(opacity, 255, 0.2);
    if (this.tutorialStopped) return;

    await this.delay(0.9); // để tay "tap" 1 nhịp tại A theo animation có sẵn của prefab
    if (this.tutorialStopped) return;

    await this.tweenPosition(node, posTo, 0.45);
    if (this.tutorialStopped) return;

    await this.delay(0.9); // "tap" tại B
    if (this.tutorialStopped) return;

    await this.tweenOpacity(opacity, 0, 0.25);
  }
}

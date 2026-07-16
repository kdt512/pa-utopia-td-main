import {
  _decorator,
  Component,
  instantiate,
  Node,
  Prefab,
  Vec3,
  Camera,
  Label,
} from "cc";
import { Sparkle } from "./Sparkle";
const { ccclass, property } = _decorator;

@ccclass("FxManager")
export class FxManager extends Component {
  @property(Prefab) private fxCompPrefab: Prefab = null;
  @property(Camera) private mainCamera: Camera = null;
  @property(Prefab) private sparklePrefab: Prefab = null;
  @property(Prefab) private upgradePrefab: Prefab = null;
  @property(Prefab) private dmgLabelPrefab: Prefab = null;

  @property(Node) private sparkleParent: Node = null;

  @property(Node) private fireCircle: Node = null;
  @property(Node) private thunderCircle: Node = null;
  @property(Node) private subPlayer: Node = null;

  public static instance: FxManager = null;

  protected start(): void {
    FxManager.instance = this;
  }

  public createFx(position: Vec3): void {
    if (!this.mainCamera) {
      console.error("Main Camera is not assigned in FxManager");
      return;
    }

    console.log("create fx");

    const fxComp = instantiate(this.fxCompPrefab);
    this.node.addChild(fxComp);

    const uiPos = new Vec3();
    this.mainCamera.convertToUINode(position, this.node, uiPos);
    fxComp.setPosition(uiPos);

    const sparkle = instantiate(this.sparklePrefab);
    sparkle.parent = this.sparkleParent;
    sparkle.setPosition(position);
    sparkle.getComponent(Sparkle).play();
  }

  public createDameLabel(position: Vec3, value: number) {
    if (!this.mainCamera) {
      console.error("Main Camera is not assigned in FxManager");
      return;
    }

    const fxComp = instantiate(this.dmgLabelPrefab);
    this.node.addChild(fxComp);
    fxComp.getComponentInChildren(Label).string = "-" + value;

    const uiPos = new Vec3();
    this.mainCamera.convertToUINode(position, this.node, uiPos);
    fxComp.setPosition(uiPos);
  }

  public creatFxUpgrade(position: Vec3): void {
    if (!this.mainCamera) {
      console.error("Main Camera is not assigned in FxManager");
      return;
    }
    const fx = instantiate(this.upgradePrefab);
    this.node.addChild(fx);

    const uiPos = new Vec3();
    this.mainCamera.convertToUINode(position, this.node, uiPos);
    fx.setPosition(new Vec3(uiPos.x, uiPos.y - 50, uiPos.z));
  }

  showFire(position: Vec3): void {
    if (!this.mainCamera) {
      console.error("Main Camera is not assigned in FxManager");
      return;
    }

    const uiPos = new Vec3();
    this.mainCamera.convertToUINode(position, this.fireCircle.parent, uiPos);
    this.fireCircle.setPosition(uiPos);
    this.fireCircle.active = true;
  }

  showThunderBold(position: Vec3): void {
    if (!this.mainCamera) {
      console.error("Main Camera is not assigned in FxManager");
      return;
    }
    this.fireCircle.active = false;

    const uiPos = new Vec3();
    this.mainCamera.convertToUINode(position, this.thunderCircle.parent, uiPos);

    this.thunderCircle.setPosition(uiPos);
    this.thunderCircle.active = true;
  }

  showSubPlayer() {
    this.subPlayer.active = true;
  }
}

import { _decorator, Component, instantiate, Node, Prefab, Vec3, Camera } from 'cc';
import { Sparkle } from './Sparkle';
const { ccclass, property } = _decorator;

@ccclass('FxManager')
export class FxManager extends Component {
    @property(Prefab) private fxCompPrefab: Prefab = null;
    @property(Camera) private mainCamera: Camera = null;
    @property(Prefab) private sparklePrefab: Prefab = null;
    @property(Prefab) private upgradePrefab: Prefab = null;
    @property(Node) private sparkleParent: Node = null;

    public static instance: FxManager = null;

    protected start(): void {
        FxManager.instance = this;
    }

    public createFx(position: Vec3): void {
        if (!this.mainCamera) {
            console.error("Main Camera is not assigned in FxManager");
            return;
        }

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

    public creatFxUpgrade(position:Vec3): void {
        if (!this.mainCamera) {
            console.error("Main Camera is not assigned in FxManager");
            return;
        }
        const fx = instantiate(this.upgradePrefab);
        this.node.addChild(fx);

        const uiPos = new Vec3();
        this.mainCamera.convertToUINode(position, this.node, uiPos);
        fx.setPosition(uiPos);
    }
}



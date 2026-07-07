import { _decorator, Component, instantiate, Node, Prefab, tween, Vec3 } from 'cc';
import { UITransform } from 'cc';
import { AnimationFixCar } from './AnimationFixCar';
import { TargetCar } from './TargetCar';
import { Game, GameState } from '../Core/Game';
const { ccclass, property } = _decorator;

@ccclass('AnimationWrench')
export class AnimationWrench extends Component {

    @property(Node) private centerNode: Node = null;
    @property(Node) private carNode: Node = null;
    @property(Prefab) private wrenchPrefab: Prefab = null;
    @property(AnimationFixCar) private animationFixCar: AnimationFixCar = null;
    @property(TargetCar) private targetCar: TargetCar = null;

    private arrType: number[] = [0, 9, 2, 5, 0];
    private typeIndex: number = 0;

    private index: number = 0;

    public playAnimation(pos: Vec3, type: number): void {
        const wrenchNode = instantiate(this.wrenchPrefab);
        wrenchNode.setParent(this.centerNode);
        wrenchNode.setWorldPosition(pos);
        wrenchNode.setScale(Vec3.ZERO);

        const center = this.node.getComponent(UITransform).convertToNodeSpaceAR(this.centerNode.worldPosition.clone());
        tween(wrenchNode)
            .to(0.1, { scale: new Vec3(1, 1, 1), position: center }, { easing: 'quadOut' })
            .call(() => {
                const car = this.node.getComponent(UITransform).convertToNodeSpaceAR(this.carNode.worldPosition.clone());
                // wrenchNode.getComponent(Wrech).particle.active = true;
                tween(wrenchNode)
                    .delay(.1)
                    .to(0.1, { position: car, eulerAngles: new Vec3(0, 0, -270) }, { easing: 'quadIn' })

                    .call(() => {
                        if (wrenchNode.isValid) {
                            wrenchNode.destroy();
                        }
                        this.counterCar(type);
                        this.animationFixCar.playAnimation();

                    })
                    .start();
            })
            .start();

    }

    private counterCar(type: number): void {
        // Từ index >= 5: bỏ qua type, luôn tăng index, mốc 7 chạy animation, đến 10 thì log
        if (this.index > 5) {
            this.index++;

            if (this.index === 8) {
                this.animationFixCar.playAnimationNewCar(3);
                this.targetCar.showTarget(3);
                this.typeIndex++;
                Game.instance.CurrentGameState = GameState.Win;
                Game.instance.GameFlow.callCTA();
            }

            return;
        }

        // Dưới 5: vẫn yêu cầu đúng type mới tính tiến độ
        if (this.arrType[this.typeIndex] !== type) {
            if (this.index >= 0) {
                // console.log("index", this.index);
            }
            return;
        }

        this.index++;
        this.targetCar.updateTarget(this.typeIndex);

        if (this.index === 2) {
            this.animationFixCar.playAnimationNewCar(1);
            this.targetCar.showTarget(1);
            this.typeIndex++;
            this.animationFixCar.playAnimation();
            Game.instance.audioPlayer.playEffectSound(Game.instance.gameAudioAdapter.engineSound);

        }
        else if (this.index === 5) {
            this.animationFixCar.playAnimationNewCar(2);
            this.targetCar.showTarget(2);
            this.typeIndex++;
            this.animationFixCar.playAnimation();
            Game.instance.audioPlayer.playEffectSound(Game.instance.gameAudioAdapter.engineSound);
        }
    }
}



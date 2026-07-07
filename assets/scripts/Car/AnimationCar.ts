import { _decorator, Component, instantiate, Node, Prefab, Vec3, tween, Camera, UITransform } from 'cc';
import { Car } from './Car';
import { ParkingLot } from './ParkingLot';
import { AnimationUI } from './AnimationUI';
import { Game } from '../Core/Game';
import { AnimationWrench } from './AnimationWrench';
const { ccclass, property } = _decorator;


export interface AnimationCarEvent {
    arrPos: Vec3[];
    type: number
}

@ccclass('AnimationCar')
export class AnimationCar extends Component {

    @property(Camera) private camera: Camera = null;
    @property(Camera) private uiCamera: Camera = null;
    @property(Prefab) private carPrefab: Prefab = null;
    @property(ParkingLot) private parkingLot: ParkingLot = null;
    @property(AnimationUI) private animationUI: AnimationUI = null;
    // @property(AnimationWrench) private animationWrench: AnimationWrench = null;

    protected start(): void {
        this.parkingLot.onMatch.on(this.onMatch, this);
    }

    private onMatch(event: AnimationCarEvent): void {
        if (event.arrPos.length < 3) return;

        const arrCar = event.arrPos.map(pos => {
            const car = instantiate(this.carPrefab);
            car.setParent(this.node);
            car.setWorldPosition(pos);
            car.getComponent(Car).setType(event.type);
            return car;
        });

        // Align Z-axis for all 3 cars based on the middle one
        const centerZ = arrCar[1].worldPosition.z;
        arrCar.forEach(carNode => {
            const pos = carNode.worldPosition;
            carNode.setWorldPosition(pos.x, pos.y, centerZ);
        });

        const mergePos = arrCar[1].worldPosition.clone();
        mergePos.y += 2; // Điểm hợp nhất cũng nâng lên
        const riseDuration = 0.2;
        const anticipationDuration = 0.15;
        const mergeDuration = 0.3;

        arrCar.forEach((carNode, index) => {
            const startPos = carNode.worldPosition.clone();
            const risePos = new Vec3(startPos.x, startPos.y + 2, startPos.z);

            // Calculate the "away" position for anticipation
            const awayPos = risePos.clone();
            const overshootAmount = .5; // Reduced from 1.5

            if (index === 0) {
                // Left car moves further left along X-axis
                awayPos.x -= overshootAmount;
            } else if (index === 2) {
                // Right car moves further right along X-axis
                awayPos.x += overshootAmount;
            }
            // Middle car (index 1) stays in place for anticipation

            tween(carNode)
                .to(riseDuration, { worldPosition: risePos })
                .to(anticipationDuration, { worldPosition: awayPos }, { easing: 'sineOut' })
                .to(mergeDuration, { worldPosition: mergePos }, { easing: 'backIn' })
                .call(() => {
                    if (carNode.isValid) {
                        carNode.destroy();
                    }

                    // Only trigger UI animation for one of the cars to avoid duplicates
                    if (index === 1) {
                        // 3D world -> screen (3D camera)
                        const screenPos = new Vec3();
                        this.camera.worldToScreen(mergePos, screenPos);
                        // screen -> UI world (UI camera)
                        const uiWorldPos = new Vec3(screenPos.x, screenPos.y, 0);
                        this.uiCamera.screenToWorld(uiWorldPos, uiWorldPos);
                        // UI world -> UI local (parent)
                        const parentUI = this.animationUI.node.parent.getComponent(UITransform);
                        const finalUiPos = parentUI.convertToNodeSpaceAR(uiWorldPos);
                        this.animationUI.playAnimation(finalUiPos);
                        // this.animationWrench.playAnimation(uiWorldPos, event.type);
                    }

                    Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.mergeSound);
                })
                .start();
        });
    }
}



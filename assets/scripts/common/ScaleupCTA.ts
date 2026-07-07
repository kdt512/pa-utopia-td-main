import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { LightFx } from './LightFx';
const { ccclass, property } = _decorator;

@ccclass('ScaleupCTA')
export class ScaleupCTA extends Component {
    @property(Node)
    private ctaNode: Node = null;

    @property
    private scaleAmount: number = 1.1;

    @property
    private duration: number = 0.5;

    @property
    private useBackEasing: boolean = true;

    @property(LightFx)
    private lightFx: LightFx = null;

    start() {


        this.playScaleAnimation();
    }

    private playScaleAnimation() {
        if (!this.ctaNode) return;

        // Stop any existing animations
        tween(this.ctaNode).stop();

        // Create infinite scale animation
        tween(this.ctaNode)
            .repeatForever(
                tween()
                    .call(() => {
                        if (this.lightFx) {
                            this.lightFx.playFxLight(this.duration);
                        }
                    })
                    .to(this.duration,
                        { scale: new Vec3(this.scaleAmount, this.scaleAmount, this.scaleAmount) },
                        { easing: this.useBackEasing ? 'backOut' : 'sineOut' })
                    .to(this.duration,
                        { scale: new Vec3(1, 1, 1) },
                        { easing: this.useBackEasing ? 'backIn' : 'sineIn' })
            )
            .start();

    }

    onDestroy() {
        // Stop animation when component is destroyed
        if (this.ctaNode) {
            tween(this.ctaNode).stop();
        }
    }
}



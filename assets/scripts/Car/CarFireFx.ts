import { _decorator, Component, Node, ParticleSystem, random, tween, Vec3 } from 'cc';
import { Game, GameState } from '../Core/Game';
const { ccclass, property } = _decorator;

@ccclass('CarFireFx')
export class CarFireFx extends Component {
    @property(ParticleSystem) private particleSystem: ParticleSystem = null;
    @property(Node) private popupHelp: Node = null;

    private timer: number = 0;
    private timerMax: number = 10;

    private isPlayHelpSound: boolean = false;

    protected onLoad(): void {
        this.popupHelp.setScale(0, 0, 0);
    }
    protected start(): void {
        this.scheduleOnce(() => {
            tween(this.popupHelp)
                .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backInOut' })
                .call(() => {
                    this.particleSystem.play();
                    this.isPlayHelpSound = true;
                    this.timer = 0;

                    Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.helpSound);
                })
                .start();
        }, 4);


        tween(this.node)
            .delay(2.5)
            .call(() => {
                Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.trafficSound1);
            })
            .delay(3.5)
            .call(() => {
                Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.trafficSound2);
            })
            .delay(5)
            .call(() => {
                Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.trafficSound1);
            })

            .start();
    }

    protected update(dt: number): void {
        if (Game.instance.CurrentGameState === GameState.GamePlay) {
            if(!this.isPlayHelpSound) return;
            this.timer += dt;
            if (this.timer >= this.timerMax) {
                this.timer = random() * 3;
                Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.helpSound);
                // console.log("play help sound");
            }
        }
    }

}



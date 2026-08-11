import { _decorator, Component, Node, tween, Tween, Vec3 } from "cc";
const { ccclass, property, menu } = _decorator;

/**
 * Jelly mobility effect (Cocos Creator 3.x)
 * @author Tangeri (ifaswind)
 * @version 20201014 (ported to 3.x)
 * @see JellyTween.ts https://gitee.com/ifaswind/eazax-ccc/blob/master/components/tweens/JellyTween.ts
 */
@ccclass("JellyTween")
@menu("base/JellyTween")
export class JellyTween extends Component {
  // @property({ tooltip: 'Frequency (number of bounces)' })
  public frequency: number = 4;

  // @property({ tooltip: 'Decay index' })
  private decay: number = 2;

  @property({ tooltip: "Downstream (press scale)" })
  public pressScale: number = 0.2;

  @property({ tooltip: "Effect (total time)" })
  public totalTime: number = 1;

  @property({ tooltip: "Playback interval" })
  public interval: number = 2;

  @property({ tooltip: "Autoplay" })
  public playOnLoad: boolean = true;

  /** Original scale value (Vec3 in 3.x) */
  private originalScale: Vec3 = new Vec3(1, 1, 1);

  private tweenRef: Tween<Node> | null = null;

  protected start() {
    // Record the original scale
    this.originalScale.set(this.node.scale);
    // Play
    if (this.playOnLoad) this.play();
  }

  /**
   * Play
   * @param repeatTimes repeat times
   */
  public play(repeatTimes?: number) {
    // repeat times
    const times =
      repeatTimes != undefined && repeatTimes > 0 ? repeatTimes : 10e8;
    // durations
    const pressTime = this.totalTime * 0.2; // Press (squash)
    const scaleBackTime = this.totalTime * 0.15; // Back to original size
    const bouncingTime = this.totalTime * 0.65; // Bouncing duration
    // amplitude
    const amplitude = this.pressScale / scaleBackTime;

    const os = this.originalScale;
    const pressedScale = new Vec3(
      os.x + this.pressScale,
      os.y - this.pressScale,
      os.z,
    );
    const normalScale = os.clone();

    // Play
    this.tweenRef = tween(this.node)
      .repeat(
        times,
        tween<Node>()
          .to(pressTime, { scale: pressedScale }, { easing: "sineOut" })
          .to(scaleBackTime, { scale: normalScale })
          .to(
            bouncingTime,
            {},
            {
              onUpdate: (
                target: Node | undefined,
                ratio: number | undefined,
              ) => {
                if (!target || ratio == undefined) return;
                const diff = this.getDifference(amplitude, ratio);
                target.setScale(os.x - diff, os.y + diff, os.z);
              },
            },
          )
          .delay(this.interval),
      )
      .start();
  }

  /**
   * Stop
   */
  public stop() {
    if (this.tweenRef) {
      this.tweenRef.stop();
      this.tweenRef = null;
    }
    this.node.setScale(this.originalScale);
  }

  /**
   * Get elastic amplitude at target time
   * @param amplitude Amplitude
   * @param time Normalized time (0-1)
   */
  private getDifference(amplitude: number, time: number): number {
    // Angular velocity (ω = 2nπ)
    const angularVelocity = this.frequency * Math.PI * 2;
    return (
      amplitude *
      (Math.sin(time * angularVelocity) /
        Math.exp(this.decay * time) /
        angularVelocity)
    );
  }
}

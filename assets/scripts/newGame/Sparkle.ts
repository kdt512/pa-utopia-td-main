import { _decorator, CCFloat, CCInteger, Component, Node, Prefab, instantiate, tween, Tween, Vec3, Color, MeshRenderer, AudioClip } from 'cc';
import { Game } from '../Core/Game';
const { ccclass, property } = _decorator;

@ccclass('Sparkle')
export class Sparkle extends Component {
    @property(Prefab) private particlePrefab: Prefab = null;
    @property(CCFloat) private maxRange: number = 100;
    @property(CCFloat) private minRange: number = 20;
    @property(CCInteger) private amount: number = 50;
    @property(CCFloat) private timer: number = 2;
    @property(CCFloat) private delayTime: number = 0.1;
    @property(CCFloat) private waitingTime: number = 0.5;
    @property(CCFloat) private gravity: number = 5.0; // units per second
    @property(CCFloat) private minLength: number = 20;
    @property(CCFloat) private maxLength: number = 50;

    @property(Color) private arrColors: Color[] = [];

    @property(AudioClip) private audioClips: AudioClip[] = [];

    protected start(): void {
        this.play();
    }

    public play() :void {
        // console.log('play');
        if (!this.particlePrefab) return;

        let randomAudioClip = this.audioClips[Math.floor(Math.random() * this.audioClips.length)];
        Game.instance.audioPlayer.playSound(randomAudioClip);

        let randomColor = Color.WHITE;
        if (this.arrColors.length > 0) {
             const colorIndex = Math.floor(Math.random() * this.arrColors.length);
             randomColor = this.arrColors[colorIndex];
        }

        for (let i = 0; i < this.amount; i++) {
            const particle = instantiate(this.particlePrefab);
            particle.parent = this.node;
            particle.setPosition(0, 0, 0);
            particle.setScale(0.5, 0.5, 0.5);

            // Random angle in radians
            const angle = Math.random() * Math.PI * 2;
            
            // Random distance between range (inner radius) and radius (outer radius)
            // Ensure distance is at least 'range' away from center
            const distance = this.minRange + (Math.random() * (this.maxRange - this.minRange));
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            // Rotation to face direction (angle in degrees)
            const angleDeg = angle * 180 / Math.PI;
            particle.angle = angleDeg;

            // Visual trail effect
            const visual = particle.getChildByName('visual');
            if (visual) {
                // Set Color
                const meshRenderer = visual.getComponent(MeshRenderer);
                if (meshRenderer) {
                    meshRenderer.material.setProperty('mainColor', randomColor);
                }
                
                visual.setPosition(0, 0, 0);
                visual.setScale(0.1, 0.5, 1);
                
                // Stretch along X axis (direction of movement), shrink Y
                tween(visual)
                    .delay(this.delayTime)
                    .to(this.timer * 0.2, { scale: new Vec3(3, 0.5, 1) }, { easing: 'sineOut'}) // Stretch fast
                    .to(this.timer * 0.8, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn'})   // Shrink slow
                    .start();
            }

            tween(particle)
                .to(this.timer, { position: new Vec3(x, y, 0) }, { easing: 'sineOut' })
                .call(() => {
                    if (visual) {
                        Tween.stopAllByTarget(visual);
                        visual.setScale(.4, .4, .5);
                    }
                })
                .delay(this.waitingTime)
                .call(() => {
                    // Fall down
                    // Random fall distance
                    const fallDistance = this.minLength + Math.random() * (this.maxLength - this.minLength);
                    const fallTime = fallDistance / this.gravity;
                    
                    // Rotate to face down (approximately)
                    // You might want a separate tween for rotation if it should look smooth
                    tween(particle)
                        .to(0.1, { angle: -90 })
                        .start();

                    // Flicker effect during fall
                    if (visual && Math.random() < 0.5) { // 50% chance to flicker
                        const flickerStartDelay = 0.5 + Math.random() * 0.5; // Random delay before flicker starts (0.5 - 1.0)
                        
                        tween(particle)
                            .delay(flickerStartDelay)
                            .call(() => {
                                const flicker = () => {
                                    if (!visual.isValid || !particle.isValid) return;
                                    const randomDelay = 0.2 + Math.random() * 0.3; // Random flicker speed (0.2s - 0.5s)
                                    
                                    // Use tween on particle to ensure it runs even if visual is inactive
                                    tween(particle)
                                        .delay(randomDelay)
                                        .call(() => { 
                                            if (visual.isValid) {
                                                visual.active = !visual.active; 
                                                flicker();
                                            }
                                        })
                                        .start();
                                };
                                flicker();
                            })
                            .start();
                    }

                    tween(particle)
                        .by(fallTime, { position: new Vec3(0, -fallDistance, 0) }, { easing: 'quadIn' })
                        .call(() => {
                            particle.destroy();
                        })
                        .start();
                })
                .start();
        }
    }
}

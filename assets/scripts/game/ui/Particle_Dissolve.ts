import { _decorator, Component, Node, ParticleSystem2D, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Particle_Dissolve')
export class Particle_Dissolve extends Component {
    @property([ParticleSystem2D]) private particleSystems: ParticleSystem2D[] = [];

    public playAnimation(): void {
        this.particleSystems.forEach(particle => {
            particle.resetSystem();
        });

        tween(this.node)
        .delay(1)
        .call(() => {
            this.node.destroy();
        })
        .start();
    }

    

}



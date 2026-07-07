import { _decorator, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { Particle_Dissolve } from '../game/ui/Particle_Dissolve';
const { ccclass, property } = _decorator;

@ccclass('AnimationUI')
export class AnimationUI extends Component {
    @property(Prefab) private particleNode: Prefab = null;

    public playAnimation(pos: Vec3): void {
        const particle = instantiate(this.particleNode);
        this.node.addChild(particle);
        particle.setPosition(pos);
        particle.getComponent(Particle_Dissolve).playAnimation();
    }
}



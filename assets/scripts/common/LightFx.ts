import { _decorator, CCInteger, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LightFx')
export class LightFx extends Component {
    @property(Node) pos1: Node;
    @property(Node) pos2: Node;

    @property(Node) containLight: Node;

    public playFxLight(duration: number = 0.5) {
        this.containLight.setPosition(this.pos1.getPosition());
        tween(this.containLight)
            .to(duration, { position: this.pos2.getPosition() })
            .start();
    }
}



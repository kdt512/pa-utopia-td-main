import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('circlepipline')
export class circlepipline extends Component {
    private amount: number = 8;

    protected start(): void {
        this.node.children.forEach((child, index) => {
            child.setRotationFromEuler(0, 0, this.amount * -index);
        });
    }
}



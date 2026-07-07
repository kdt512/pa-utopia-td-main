import { _decorator, Component, Node, tween } from 'cc';
import { TargetUI } from './TargetUI';
const { ccclass, property } = _decorator;

@ccclass('TargetCar')
export class TargetCar extends Component {
    @property(Node) private arrNode: Node[] = [];

    protected start(): void {
        this.showTarget(0);
    }

    public updateTarget(index: number): void {
        this.arrNode[index].getComponent(TargetUI).updateValue(3);
    }

    public showTarget(index: number): void {
        tween(this.node)
            .delay(1)
            .call(() => {
                for (let i = 0; i < this.arrNode.length; i++) {
                    this.arrNode[i].active = i === index;
                }
            })
            .start();
    }


}



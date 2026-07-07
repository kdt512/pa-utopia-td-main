import { _decorator, Color, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CellDebug')
export class CellDebug extends Component {
    @property(Node) private dot: Node = null;
    @property(Node) private obstacle: Node = null;

    protected onLoad(): void {
        this.dot.active = false;
        this.obstacle.active = false;
    }
    public showDot() {
        this.dot.active = true;
    }

    public showObstacle() {
        this.obstacle.active = true;
    }
}



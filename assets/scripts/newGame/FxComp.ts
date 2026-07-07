import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FxComp')
export class FxComp extends Component {
    

    protected start(): void {
        this.scheduleOnce(() => {
            this.node.destroy();
        }, .5);
    }
}



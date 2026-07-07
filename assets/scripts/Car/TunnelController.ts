import { _decorator, CCInteger, Component, Node, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TunnelController')
export class TunnelController extends Component {
    @property(Vec2) private createCarPosition: Vec2 = new Vec2(0, 0);
    @property(CCInteger) private countCar: number = 20;

    public getCreateCarPosition(): Vec2 {
        return this.createCarPosition;
    }

    public decreaseCountCar(): void {
        this.countCar--;
    }

    public getCountCar(): number {
        return this.countCar;
    }


}



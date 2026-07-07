import { _decorator, Color, Component, Node, tween, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

export interface AnimationFixCarData {
    car: Node;
    tire: Node;
}

@ccclass('AnimationFixCar')
export class AnimationFixCar extends Component {
    @property(Node) public carParent: Node = null;
    @property(Node) public tireParent: Node = null;

    private arrData: AnimationFixCarData[] = [];

   

    protected start(): void {
        for (let i = 0; i < this.carParent.children.length; i++) {
            const car = this.carParent.children[i];
            const tire = this.tireParent.children[i];
            this.arrData.push({ car, tire });
        }
    }

    public playAnimation(): void {
        tween(this.carParent)
            .to(0.3, {
                eulerAngles: new Vec3(0, 0, -1.5)
            }, { easing: 'quadOut' })
            .to(0.2, {

                eulerAngles: new Vec3(0, 0, 0)
            }, { easing: 'quadIn' })
            .start();
    }

    public playAnimationNewCar(index: number): void {
        const data1 = this.arrData[index - 1];
        const data2 = this.arrData[index];

        const uitransformCar2 = data2.car.getComponent(UITransform);
        const uitransformTire2 = data2.tire.getComponent(UITransform);

        data2.car.active = true;
        data2.tire.active = true;

        const carTarget = uitransformCar2.width;
        const tireTarget = uitransformTire2.width;

        uitransformCar2.width = 0;
        uitransformTire2.width = 0;


        tween(uitransformCar2)
            .to(1, { width: carTarget }, { easing: 'quadOut' })
            .call(() => {
                data1.car.active = false;
            })
            .start();
        tween(uitransformTire2)
            .to(1, { width: tireTarget }, { easing: 'quadOut' })
            .call(() => {
                data1.tire.active = false;
            })
            .start();



    }
}



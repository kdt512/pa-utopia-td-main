import { _decorator, CCInteger, Component, Node } from 'cc';
import { Signal } from '../eventSystem/Signal';
import { CarController } from './CarController';
import { CarMovement } from './CarMovement';

const { ccclass, property } = _decorator;


@ccclass('Car')
export class Car extends Component {

    @property(CCInteger) public type: number = 0;
    @property(Node) private visual: Node = null;
    @property(Node) private smoke: Node = null;
    public onTap = new Signal<Car>();
    private controller: CarController = null;
    private mover: CarMovement = null;


    protected onLoad(): void {
        this.mover = this.node.getComponent(CarMovement);
    }

    public setController(controller: CarController): void {
        this.controller = controller;
    }

    public getMovement(): CarMovement | null {
        return this.mover;
    }

    public onTapped(): void {
        this.onTap.trigger(this);
        if (this.controller) {
            this.controller.requestPark(this);
        }
    }

    public get Mover(): CarMovement | null {
        return this.mover;
    }

    public setType(type: number): void {
        this.type = type;
        for (let i = 0; i < this.visual.children.length; i++) {
            this.visual.children[i].active = i === type;
        }
    }

    protected lateUpdate(dt: number): void {
        if (this.mover.getIsMoving()) {
            this.smoke.active = true;
        } else {
            this.smoke.active = false;
        }
    }

}



import { _decorator, Component, Node, Vec3 } from 'cc';
import { Car } from './Car';
const { ccclass, property } = _decorator;

@ccclass('ParkSlot')
export class ParkSlot extends Component {
    @property(Node) private stopNode: Node = null;
    @property(Node) private carNode: Node = null;

    private car: Car = null;
    private isComing = false;

    private isBlocked = false;

    public getIsBlocked(): boolean {
        return this.isBlocked;
    }

    public setIsBlocked(blocked: boolean): void {
        this.isBlocked = blocked;
    }

    public setCar(car: Car): void {
        this.car = car;
        this.isComing = true;
    }

    public assignCar(car: Car): void {
        this.car = car;
        this.isComing = true; // Set isComing để mark slot đã được assign
    }

    public reserve(): void {
        this.isComing = true;
    }

    public clearCar(): void {
        this.car = null;
        this.isComing = false;
    }

    public getCar(): Car | null {
        return this.car;
    }

    public isFree(): boolean {
        return this.car == null && !this.isComing && !this.isBlocked;
    }

    public hasCarComing(): boolean {
        return this.isComing;
    }

    public getStopPos(): Vec3 {
        return this.stopNode.worldPosition.clone();
    }

    public getCarPos(): Vec3 {
        return this.carNode.worldPosition.clone();
    }

    public carHasReached(): void {
        this.isComing = false;
    }
}



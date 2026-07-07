import { _decorator, Component, Node } from 'cc';
import { AnimationFixCar } from './AnimationFixCar';
import { TargetCar } from './TargetCar';
const { ccclass, property } = _decorator;

@ccclass('CounterCar')
export class CounterCar extends Component {
    @property(AnimationFixCar) private animationFixCar: AnimationFixCar = null;
    @property(TargetCar) private targetCar: TargetCar = null;

    private counter: number = 0;
}



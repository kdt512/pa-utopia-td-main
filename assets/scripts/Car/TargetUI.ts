import { _decorator, CCInteger, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TargetUI')
export class TargetUI extends Component {
    @property(CCInteger) private value: number = 0;
    @property(Label) private label: Label = null;

    public updateValue(value: number): void {
        this.value -= value;
        this.label.string = `x ${this.value.toString()}`;
    }
}



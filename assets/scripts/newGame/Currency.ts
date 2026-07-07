import { _decorator, CCInteger, Component, JsonAsset, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Currency')
export class Currency extends Component {
    private value: number = 0;
    @property(Label) private valueLabel: Label = null;
    @property(JsonAsset) data:JsonAsset = null;

    public static instance: Currency = null;

    onLoad(): void {
        this.value = this.data?.json.init ?? 100;
        this.updateValueLabel();
        Currency.instance = this;
    }

    public getCurrency(): number {
        return this.value;
    }

    public useCurrency(value: number): void {
        this.addCurrency(-value);
        this.updateValueLabel();
    }

    public addCurrency(value: number): void {
        this.value = Math.max(this.value + value, 0);
        this.updateValueLabel();
    }

    public rewardKillEnemy(){
        this.addCurrency(this.data?.json.reward ?? 10);
    }

    private updateValueLabel(): void {
        this.valueLabel.string = `${this.value}`;
    }
}



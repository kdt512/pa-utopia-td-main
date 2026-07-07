import { _decorator, Component, Label, Node, Size, tween, UITransform, Vec3 } from 'cc';
import { Health, IHealth } from './Health';
const { ccclass, property } = _decorator;

@ccclass('ProgressBarHP')
export class ProgressBarHP extends Component {
    @property(Label) private label: Label = null!;
    @property(Node) private bar: Node = null!;
    @property(Health) private health: Health = null!;
    private maxWidth: number = 300;
    private contentSize: Size = null!;
    private uiTransform: UITransform = null!;
    

    protected onLoad(): void {
        this.uiTransform = this.bar.getComponent(UITransform)!;
        this.contentSize = this.uiTransform.contentSize.clone();
        this.maxWidth = this.contentSize.width;

        this.health.onHealthChanged.on(this.updateVisual,this);

        // Set width ban đầu về 0
        this.uiTransform.setContentSize(0, this.contentSize.height);

        // Tween width từ 0 lên maxWidth
        tween(this.uiTransform)
            .to(1, { contentSize: new Size(this.maxWidth, this.contentSize.height) })
            .start();

        
    }

    private updateVisual(health: IHealth): void {
        this.uiTransform.setContentSize(health.currentHealth / health.maxHealth * this.maxWidth, this.contentSize.height);
        this.label.string = `${health.currentHealth} / ${health.maxHealth}`;
    }

    
}



import { _decorator, Component, Node } from 'cc';
import { UIButton } from '../eventSystem/UIButton';
const { ccclass, property } = _decorator;

@ccclass('TabView')
export class TabView extends Component {
    @property(UIButton) private tabButtons: UIButton[] = [];
    @property(Node) private tabContents: Node[] = [];

    protected start(): void {
        this.tabButtons.forEach(button => {
            button.InteractedEvent.on(this.onTabButtonInteracted, this);
        });
    }

    private onTabButtonInteracted(button: UIButton): void {
        const index = this.tabButtons.indexOf(button);
        

        for (let i = 0; i < this.tabButtons.length; i++) {
            this.tabContents[i].active = i === index;
        }

        console.log(index);
    }
}





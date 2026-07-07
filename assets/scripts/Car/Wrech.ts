import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Wrech')
export class Wrech extends Component {
    @property(Node) public particle: Node = null;
}



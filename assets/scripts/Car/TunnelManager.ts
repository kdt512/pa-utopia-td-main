import { _decorator, Component, Node } from 'cc';
import { TunnelController } from './TunnelController';
const { ccclass, property } = _decorator;

@ccclass('TunnelManager')
export class TunnelManager extends Component {
    private arrTunnel: TunnelController[] = [];
}



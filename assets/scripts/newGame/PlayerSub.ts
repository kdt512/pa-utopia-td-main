import { _decorator } from "cc";
import { Attack } from "./Attack";
import {
  CharacterDataInterface
} from "./CharacterDataInterface";
import { Health } from "./Health";
import { Player } from "./Player";
const { ccclass, property } = _decorator;

@ccclass("PlayerSub")
export class PlayerSub extends Player {

  onLoad(): void {
    this.attack = this.node.getComponent(Attack);
    this.health = this.node.getComponent(Health);

    this.charData = this.data.json.find(
      (item: CharacterDataInterface) => item.type === this.type,
    );
  }

  protected start(): void {
    this.config();
  }

  private config(): void {
    if (this.charData == null) return;

    console.log(this.charData);
    this.attack.setup(
      this.charData.damage/2,
      this.charData.attackRange,
      this.charData.attackSpeed,
    );
    this.attack.setPlayer(Player.Instance);
    this.health.setup(this.charData.health);
  }
}

import { _decorator, Component, Enum, JsonAsset, Node } from "cc";
import { Attack } from "./Attack";
import {
  CharacterDataInterface,
  CharacterType,
} from "./CharacterDataInterface";
import { Health } from "./Health";
const { ccclass, property } = _decorator;

@ccclass("Player")
export class Player extends Component {
  @property(JsonAsset) data: JsonAsset = null!;
  @property({ type: Enum(CharacterType) })  type: CharacterType =
    CharacterType.PLAYER;

  private static instance: Player = null;
  attack: Attack = null!;
  health: Health = null!;
  charData: CharacterDataInterface = null;

  onLoad(): void {
    Player.instance = this;
    this.attack = this.node.getComponent(Attack);
    this.health = this.node.getComponent(Health);

    this.charData = this.data.json.find(
      (item: CharacterDataInterface) => item.type === this.type,
    );
  }

  protected start(): void {
    this.configureCharacter();
  }

  private configureCharacter(): void {
    if (this.charData == null) return;

    console.log(this.charData);
    this.attack.setup(
      this.charData.damage,
      this.charData.attackRange,
      this.charData.attackSpeed,
    );
    this.attack.setPlayer(this);
    this.health.setup(this.charData.health);
  }

  public static get Instance(): Player {
    return Player.instance;
  }
}

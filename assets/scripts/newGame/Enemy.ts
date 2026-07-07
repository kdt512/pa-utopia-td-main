import { _decorator, Component, Enum, JsonAsset, Node, Vec3 } from 'cc';
import { Player } from './Player';
import { Health } from './Health';
import { CharacterDataInterface, CharacterType } from './CharacterDataInterface';
import { Attack } from './Attack';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {

    @property(JsonAsset) private data: JsonAsset = null!;
    @property({type: (Enum(CharacterType))}) private type: CharacterType = CharacterType.ENEMY;

    @property
    private threshold: number = 20;
    @property
    private speed: number = 10;


    private target: Player | null = null;
    private health: Health = null!;
    private attack: Attack = null!;
    private charData: CharacterDataInterface = null;    

    protected start(): void {
        this.target = Player.Instance;
        this.health = this.node.getComponent(Health);
        this.attack = this.node.getComponent(Attack);

        this.charData = this.data.json.find((item: CharacterDataInterface) => item.type ===this.type);
        this.configureCharacter();
    }

    private configureCharacter(): void {
        if(this.charData == null)  return;


        this.health.setup(this.charData.health);
        this.attack.setup(this.charData.damage, this.charData.attackRange, this.charData.attackSpeed);
        this.speed = this.charData.speed;
    }


    protected update(dt: number): void {
        if (!this.target || !this.target.node) return;

        const currentPos = this.node.position;
        const targetPos = this.target.node.position;

        // Calculate distance
        const distance = Vec3.distance(currentPos, targetPos);

        if (distance > this.threshold) {
            // Move towards target
            const direction = new Vec3();
            Vec3.subtract(direction, targetPos, currentPos);
            direction.normalize();

            const movement = new Vec3();
            Vec3.multiplyScalar(movement, direction, this.speed * dt);

            const newPos = new Vec3();
            Vec3.add(newPos, currentPos, movement);

            this.node.setPosition(newPos);
        }
    }

    public takeDamage(damage: number): void {
        this.health.takeDamage(damage);
    }
}



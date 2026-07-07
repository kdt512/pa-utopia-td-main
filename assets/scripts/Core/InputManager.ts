import { _decorator, Camera, Component, Node, input, Input, EventTouch, EventMouse, geometry, PhysicsSystem } from 'cc';
import { Car } from '../Car/Car';
import { Game, GameState } from './Game';
const { ccclass, property } = _decorator;

@ccclass('InputManager')
export class InputManager extends Component {
    @property(Camera) private camera: Camera = null!;
    private ray: geometry.Ray = new geometry.Ray();
    private selectedCar: Car | null = null;
    @property(Node) private tutorialNode: Node = null;

    private counter: number = 0;

    private timer: number = 0;
    private timerMax: number = 60;

    private firstTap: boolean = false;

    protected onEnable(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private onTouchStart(event: EventTouch): void {
        if (!this.camera) return;

        if (Game.instance.CurrentGameState === GameState.Win || Game.instance.CurrentGameState === GameState.Lose) return;

        const loc = event.getLocation();

        this.handlePointer(loc.x, loc.y);

        if (this.tutorialNode) {
            this.tutorialNode.active = false;
        }

        if (this.counter < 32) {
            this.counter++;
        }
        else {
            Game.instance.CurrentGameState = GameState.Win;
            Game.instance.GameFlow.callCTA();
        }

        if (!this.firstTap) {
            this.firstTap = true;
            this.timer = 0;
        }
    }

    protected update(dt: number): void {
        if (Game.instance.CurrentGameState === GameState.GamePlay) {
            if (this.firstTap) {
                this.timer += dt;
                if (this.timer >= this.timerMax) {
                    this.timer = 0;
                    this.endGame();
                }
            }
        }
    }

    private endGame(): void {
        Game.instance.CurrentGameState = GameState.Lose;
        // Game.instance.GameFlow.callCTA();
    }

    private onMouseDown(event: EventMouse): void {
        if (!this.camera) return;
        const loc = event.getLocation();
        this.handlePointer(loc.x, loc.y);
    }

    private handlePointer(screenX: number, screenY: number): void {
        this.camera.screenPointToRay(screenX, screenY, this.ray);

        if (PhysicsSystem.instance.raycastClosest(this.ray)) {
            const hit = PhysicsSystem.instance.raycastClosestResult;
            const car = this.findCarComponent(hit.collider.node);
            if (car) {
                this.selectedCar = car;
                console.log(`Tapped car: ${car.node.name}`);
                car.onTapped();
                Game.instance.audioPlayer.playSound(Game.instance.gameAudioAdapter.tapSound);
                return;
            }
        }

        this.selectedCar = null;
    }

    private findCarComponent(startNode: Node): Car | null {
        let current: Node | null = startNode;
        while (current) {
            const comp = current.getComponent(Car);
            if (comp) return comp;
            current = current.parent;
        }
        return null;
    }
}



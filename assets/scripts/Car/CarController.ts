import { _decorator, CCInteger, Component, instantiate, Prefab, Vec2, Node, Vec3 } from 'cc';
import { LevelGrid } from '../grids/LevelGrid';
import { ParkingLot } from './ParkingLot';
import { Car } from './Car';
import { Pathfinding } from '../grids/Pathfinding';
import { Game, GameState } from '../Core/Game';
import { TunnelController } from './TunnelController';
const { ccclass, property } = _decorator;

@ccclass('CarController')
export class CarController extends Component {
    @property(Prefab) private carPrefab: Prefab = null;
    @property(CCInteger) private arrType: number[] = [];
    @property(Vec2) private arrCarPosition: Vec2[] = [];
    @property(Vec2) private arrObstaclePosition: Vec2[] = [];
    @property(Node) private tunnelParent: Node = null;


    private levelGrid: LevelGrid = null;
    private parking: ParkingLot = null;

    private arrCar: Car[] = [];

    private tunnelControllers: TunnelController[] = [];

    public init(levelGrid: LevelGrid, parking: ParkingLot): void {
        this.levelGrid = levelGrid;
        this.parking = parking;
        this.parking.onCarDestroy.on(this.onCarDestroy, this);
        this.createCar();

        if (this.tunnelParent) {
            this.tunnelControllers = this.tunnelParent.getComponentsInChildren(TunnelController);
        }
    }

    private onCarDestroy(car: Car): void {
        this.arrCar = this.arrCar.filter(c => c !== car);
        if (this.arrCar.length === 0) {
            Game.instance.CurrentGameState = GameState.Win;
        }
    }

    public getArrCar(): Car[] {
        return this.arrCar;
    }

    public createCar(): void {
        for (let i = 0; i < this.arrCarPosition.length; i++) {
            const carNode = instantiate(this.carPrefab);
            const worldPos = this.levelGrid.getWorldPosition(this.arrCarPosition[i].x, this.arrCarPosition[i].y);
            carNode.setParent(this.node);
            carNode.setPosition(worldPos);
            const car = carNode.getComponent(Car);
            car.setController(this);
            car.setType(this.arrType[i]);
            this.arrCar.push(car);
        }

        if (Pathfinding.Instance) {
            for (const pos of this.arrCarPosition) {
                Pathfinding.Instance.setObstacle(pos.x, pos.y, true);
            }
            for (const pos of this.arrObstaclePosition) {
                Pathfinding.Instance.setObstacle(pos.x, pos.y, true);
            }
        }
    }

    public requestPark(car: Car): void {
        if (!this.parking) return;

        if (Pathfinding.Instance) {
            const gridPos = Pathfinding.Instance.getGrid().getXY(car.node.worldPosition);
            Pathfinding.Instance.setObstacle(gridPos.x, gridPos.y, false);
        }

        const parkingSlot = this.parking.requestParkCar(car);

        if (parkingSlot === null) {
            return;
        }

        if (this.tunnelControllers) {
            for (const tunnelController of this.tunnelControllers) {
                const gridPos = Pathfinding.Instance.getGrid().getXY(car.node.worldPosition);
                if (tunnelController.getCreateCarPosition().x === gridPos.x && tunnelController.getCreateCarPosition().y === gridPos.y) {
                    if (tunnelController.getCountCar() > 0) {
                        // console.log(tunnelController.getCountCar());
                        this.createCarInTunnel(car.node.worldPosition, new Vec2(gridPos.x, gridPos.y));
                        tunnelController.decreaseCountCar();
                        // console.log(tunnelController.getCountCar());
                    }
                }
            }
        }
    }

    private createCarInTunnel(pos: Vec3, gridPos: Vec2): void {
        const carNode = instantiate(this.carPrefab);
        carNode.setParent(this.node);
        carNode.setPosition(pos);

        const arrCarType = [0, 9, 6, 5, 2];
        const randomType = arrCarType[Math.floor(Math.random() * arrCarType.length)];

        const car = carNode.getComponent(Car);
        car.setController(this);
        car.setType(randomType);
        this.arrCar.push(car);

        // console.log("create car in tunnel");

        Pathfinding.Instance.setObstacle(gridPos.x, gridPos.y, true);
    }
}



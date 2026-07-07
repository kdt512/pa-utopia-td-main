import { _decorator, Component, Node } from 'cc';
import { CarController } from '../Car/CarController';
import { LevelGrid } from '../grids/LevelGrid';
import { ParkingLot } from '../Car/ParkingLot';
const { ccclass, property } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    @property(LevelGrid) private levelGrid: LevelGrid = null!;
    @property(CarController) private carController: CarController = null!;
    @property(ParkingLot) private parking: ParkingLot = null!;


    public init(): void {
        this.levelGrid.init();
        this.parking.init();
        this.carController.init(this.levelGrid, this.parking);
    }

    public gameTick(dt: number): void { }


    public get Parking(): ParkingLot {
        return this.parking;
    }


}



import { _decorator, CCInteger, Color, Component, GraphicsComponent, instantiate, Node, path, Prefab, Vec3 } from 'cc';
import { Grid } from './Grid';
import { Cell } from './Cell';
import { Pathfinding } from './Pathfinding';
import { PathNode } from './PathNode';
import { CellDebug } from './CellDebug';
const { ccclass, property } = _decorator;

@ccclass('LevelGrid')
export class LevelGrid extends Component {
    @property(CCInteger) private width: number = 10;
    @property(CCInteger) private height: number = 10;
    @property(CCInteger) private cellsize: number = 2;
    @property(Prefab) private cellPrefab: Prefab = null;
    @property(Pathfinding) private pathfinding: Pathfinding = null;

    private isDebug: boolean = true;

    private grid: Grid<Cell>;

    private arrNodeDebug: Node[] = [];
    
    public init(): void {

        this.grid = new Grid(this.width, this.height, this.cellsize, this.node.worldPosition, (grid, x, y) => new Cell(grid, x, y));

        // if (this.cellPrefab) {
        //     for (let x = 0; x < this.width; x++) {
        //         for (let y = 0; y < this.height; y++) {

        //             const cellNode = instantiate(this.cellPrefab);
        //             cellNode.setParent(this.node);
        //             cellNode.setPosition(new Vec3(x, 0, y).multiplyScalar(this.cellsize).add(this.node.worldPosition));

        //             const index = y * this.width + x;
        //             this.arrNodeDebug[index] = cellNode;
        //         }
        //     }
        // }

        this.pathfinding.init(this.width, this.height, this.cellsize);

        // this.setObstacle();
        // this.findPath();
    }

    public findPath() {
        var arrnode = this.pathfinding.findPath(3, 0, this.width - 1, this.height - 1);
        if (arrnode && arrnode.length > 0) {

            for (let i = 0; i < arrnode.length; i++) {
                const pathNode = arrnode[i];
                const index = pathNode.getY() * this.width + pathNode.getX();
                const debugNode = this.arrNodeDebug[index].getComponent(CellDebug);
                debugNode.showDot();
            }
        }
    }

    private setObstacle() {
        this.pathfinding.setObstacle(4, 4, true);
        this.pathfinding.setObstacle(4, 5, true);
        this.pathfinding.setObstacle(5, 4, true);
        this.pathfinding.setObstacle(5, 5, true);

        const arrObstacle = [
            [4, 4],
            [4, 5],
            [5, 4],
            [5, 5]
        ];

        for (let i = 0; i < arrObstacle.length; i++) {
            const obstacle = arrObstacle[i];
            this.pathfinding.setObstacle(obstacle[0], obstacle[1], true);
            const index = obstacle[1] * this.width + obstacle[0];
            const debugNode = this.arrNodeDebug[index].getComponent(CellDebug);
            debugNode.showObstacle();
        }
    }

    public getWorldPosition(x: number, y: number): Vec3 {
        return this.grid.getWorldPosition(x, y);
    }
}



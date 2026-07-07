import { _decorator, Component, Node } from 'cc';
import { CellBase } from './CellBase';
import { Grid } from './Grid';
const { ccclass, property } = _decorator;

@ccclass('PathNode')
export class PathNode extends CellBase {

    private gCost: number = 0;
    private hCost: number = 0;
    private fCost: number = 0;

    private isWalkable: boolean = true;
    private cameFromNode: PathNode | null = null;

    private _x: number = 0;
    private _y: number = 0;

    constructor(grid: Grid<PathNode>, x: number, y: number) {
        super(grid, x, y);
        this._x = x;
        this._y = y;
        this.isWalkable = true;
    }

    public getGCost(): number {
        return this.gCost;
    }

    public setGCost(value: number): void {
        this.gCost = value;
        this.calculateFCost();
    }

    public getHCost(): number {
        return this.hCost;
    }

    public setHCost(value: number): void {
        this.hCost = value;
        this.calculateFCost();
    }

    public getFCost(): number {
        return this.fCost;
    }

    private calculateFCost(): void {
        this.fCost = this.gCost + this.hCost;
    }

    public getIsWalkable(): boolean {
        return this.isWalkable;
    }

    public setIsWalkable(walkable: boolean): void {
        this.isWalkable = walkable;
    }

    public getCameFromNode(): PathNode | null {
        return this.cameFromNode;
    }

    public setCameFromNode(node: PathNode | null): void {
        this.cameFromNode = node;
    }

    public getX(): number {
        return this._x;
    }

    public getY(): number {
        return this._y;
    }

    public getNeighbors(grid: Grid<PathNode>): PathNode[] {
        const neighbors: PathNode[] = [];
        const x = this._x;
        const y = this._y;

        // 4 hướng: top, right, bottom, left
        const directions = [
            { dx: 0, dy: 1 },   // top
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: -1 },  // bottom
            { dx: -1, dy: 0 }   // left
        ];

        for (const dir of directions) {
            const neighborX = x + dir.dx;
            const neighborY = y + dir.dy;
            const neighbor = grid.getGridObject(neighborX, neighborY);
            if (neighbor && neighbor.getIsWalkable()) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }
}



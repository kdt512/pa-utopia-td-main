import { _decorator, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Grid')
export class Grid<T> {
    private cols: number;
    private rows: number;
    private cellsize: number;
    private originPosition: Vec3;

    private grid: T[][] = []; // grid[y][x] - y chạy dọc theo trục Z

    public onGridObjectChanged?: (x: number, y: number) => void;

    constructor(cols: number, rows: number, cellsize: number, originPosition: Vec3, createGridObject: (grid: Grid<T>, x: number, y: number) => T) {
        this.cols = cols;
        this.rows = rows;
        this.cellsize = cellsize;
        this.originPosition = originPosition;

    

        this.grid = [];
        for (let y = 0; y < rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < cols; x++) {
                this.grid[y][x] = createGridObject(this, x, y);
            }
        }

    }

    public getWidth(): number {
        return this.cols;
    }

    public getHeight(): number {
        return this.rows;
    }

    public getCellSize(): number {
        return this.cellsize;
    }

    public getWorldPosition(x: number, y: number): Vec3 {
        return new Vec3(x * this.cellsize + this.originPosition.x, this.originPosition.y, y * this.cellsize + this.originPosition.z);
    }

    public getXY(worldPosition: Vec3): { x: number, y: number } {
        const x = Math.floor((worldPosition.x - this.originPosition.x) / this.cellsize);
        const y = Math.floor((worldPosition.z - this.originPosition.z) / this.cellsize);
        return { x, y };
    }

    public setGridObject(x: number, y: number, value: T): void {
        if (x >= 0 && y >= 0 && x < this.cols && y < this.rows) {
            this.grid[y][x] = value;
            this.triggerGridObjectChanged(x, y);
        }
    }

    public triggerGridObjectChanged(x: number, y: number): void {
        if (this.onGridObjectChanged) {
            this.onGridObjectChanged(x, y);
        }
    }

    public setGridObjectWorldPosition(worldPosition: Vec3, value: T): void {
        const { x, y } = this.getXY(worldPosition);
        this.setGridObject(x, y, value);
    }

    public getGridObject(x: number, y: number): T | null {
        if (x >= 0 && y >= 0 && x < this.cols && y < this.rows) {
            return this.grid[y][x];
        } else {
            return null;
        }
    }

    public getGridObjectWorldPosition(worldPosition: Vec3): T | null {
        const { x, y } = this.getXY(worldPosition);
        return this.getGridObject(x, y);
    }
}



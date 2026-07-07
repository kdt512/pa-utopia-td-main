import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Grid } from './Grid';

@ccclass('CellBase')
export class CellBase {
    protected x: number;
    protected y: number;

    protected grid: Grid<CellBase>;

    constructor(grid: Grid<CellBase>, x: number, y: number) {
        this.grid = grid;
        this.x = x;
        this.y = y;
    }

    public toString(): string {
        return `CellBase: ${this.x}, ${this.y}`;
    }
}



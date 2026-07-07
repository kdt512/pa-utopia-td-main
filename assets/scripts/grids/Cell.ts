import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { Grid } from './Grid';
import { CellBase } from './CellBase';

@ccclass('Cell')
export class Cell extends CellBase {

    constructor(grid: Grid<Cell>, x: number, y: number) {
        super(grid, x, y);
    }
}

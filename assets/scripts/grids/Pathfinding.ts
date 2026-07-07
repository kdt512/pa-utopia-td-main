import { _decorator, Component, Node, Vec3 } from 'cc';
import { PathNode } from './PathNode';
import { Grid } from './Grid';
const { ccclass, property } = _decorator;

@ccclass('Pathfinding')
export class Pathfinding extends Component {

    public static Instance: Pathfinding = null;

    private width: number = 10;
    private height: number = 10;
    private cellsize: number = 2;

    private grid: Grid<PathNode>;

    public init(width: number, height: number, cellsize: number): void {

        Pathfinding.Instance = this;

        this.width = width;
        this.height = height;
        this.cellsize = cellsize;

        this.grid = new Grid(this.width, this.height, this.cellsize, this.node.worldPosition, (grid, x, y) => new PathNode(grid, x, y));
    }

    // Manhattan distance heuristic cho 4 hướng
    private calculateHeuristic(startX: number, startY: number, endX: number, endY: number): number {
        return Math.abs(startX - endX) + Math.abs(startY - endY);
    }

    // Thuật toán A* chính
    public findPath(startX: number, startY: number, endX: number, endY: number): PathNode[] | null {
        const startNode = this.grid.getGridObject(startX, startY);
        const endNode = this.grid.getGridObject(endX, endY);

        if (!startNode || !endNode || !startNode.getIsWalkable() || !endNode.getIsWalkable()) {
            return null; // Không thể tìm đường
        }

        // Reset các node
        this.resetGrid();

        const openSet: PathNode[] = [];
        const closedSet: PathNode[] = [];

        // Khởi tạo start node
        startNode.setGCost(0);
        startNode.setHCost(this.calculateHeuristic(startX, startY, endX, endY));
        openSet.push(startNode);

        while (openSet.length > 0) {
            // Tìm node có FCost thấp nhất trong openSet
            let currentNode = openSet[0];
            let currentIndex = 0;

            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].getFCost() < currentNode.getFCost() ||
                    (openSet[i].getFCost() === currentNode.getFCost() && openSet[i].getHCost() < currentNode.getHCost())) {
                    currentNode = openSet[i];
                    currentIndex = i;
                }
            }

            // Di chuyển currentNode từ openSet sang closedSet
            openSet.splice(currentIndex, 1);
            closedSet.push(currentNode);

            // Nếu tìm thấy đích
            if (currentNode === endNode) {
                return this.reconstructPath(endNode);
            }

            // Kiểm tra các neighbor
            const neighbors = currentNode.getNeighbors(this.grid);
            for (const neighbor of neighbors) {
                if (closedSet.indexOf(neighbor) !== -1) {
                    continue; // Đã xử lý
                }

                const tentativeGCost = currentNode.getGCost() + 1; // Cost giữa các ô là 1

                if (openSet.indexOf(neighbor) === -1) {
                    openSet.push(neighbor);
                } else if (tentativeGCost >= neighbor.getGCost()) {
                    continue; // Path không tốt hơn
                }

                // Path tốt hơn, cập nhật
                neighbor.setCameFromNode(currentNode);
                neighbor.setGCost(tentativeGCost);
                neighbor.setHCost(this.calculateHeuristic(neighbor.getX(), neighbor.getY(), endX, endY));
            }
        }

        return null; // Không tìm thấy đường
    }

    // Reset grid cho lần tìm kiếm mới
    private resetGrid(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const node = this.grid.getGridObject(x, y);
                if (node) {
                    node.setGCost(0);
                    node.setHCost(0);
                    node.setCameFromNode(null);
                }
            }
        }
    }

    // Tái tạo đường đi từ end node
    private reconstructPath(endNode: PathNode): PathNode[] {
        const path: PathNode[] = [];
        let currentNode: PathNode | null = endNode;

        while (currentNode !== null) {
            path.unshift(currentNode); // Thêm vào đầu mảng
            currentNode = currentNode.getCameFromNode();
        }

        return path;
    }

    // Tìm đường đi theo vị trí world
    public findPathWorld(startWorldPos: Vec3, endWorldPos: Vec3): PathNode[] | null {
        const startXY = this.grid.getXY(startWorldPos);
        const endXY = this.grid.getXY(endWorldPos);
        return this.findPath(startXY.x, startXY.y, endXY.x, endXY.y);
    }

    // Lấy grid để truy cập trực tiếp
    public getGrid(): Grid<PathNode> {
        return this.grid;
    }

    // Set obstacle tại vị trí
    public setObstacle(x: number, y: number, isObstacle: boolean): void {
        const node = this.grid.getGridObject(x, y);
        if (node) {
            node.setIsWalkable(!isObstacle);
        }
    }

    // Set obstacle tại vị trí world
    public setObstacleWorld(worldPos: Vec3, isObstacle: boolean): void {
        const xy = this.grid.getXY(worldPos);
        this.setObstacle(xy.x, xy.y, isObstacle);
    }
}



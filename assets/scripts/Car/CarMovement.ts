import { _decorator, CCFloat, Component, Node, Vec2, Vec3 } from 'cc';
import { Pathfinding } from '../grids/Pathfinding';
import { PathNode } from '../grids/PathNode';
import { Signal } from '../eventSystem/Signal';
const { ccclass, property } = _decorator;

@ccclass('CarMovement')
export class CarMovement extends Component {

    @property(CCFloat) private speed: number = 3;
    @property(CCFloat) private reachThreshold: number = 0.1; // Khoảng cách để coi là đã đến điểm đích
    @property(CCFloat) private rotationSpeed: number = 360; // Tốc độ xoay (degrees per second)
    @property private smoothRotation: boolean = true; // Có xoay mượt mà không

    private pathPoints: Vec3[] = []; // Mảng các điểm cần di chuyển đến (trong mặt phẳng XZ)
    private currentTargetIndex: number = 0; // Index của điểm hiện tại đang di chuyển đến
    private isMoving: boolean = false; // Có đang di chuyển không
    private currentPath: PathNode[] = []; // Lưu trữ path hiện tại từ A* pathfinding
    private targetRotation: number = 0; // Góc xoay mục tiêu (degrees)

    public onMoveComplete = new Signal();

    protected update(dt: number): void {
        if (this.isMoving && this.pathPoints.length > 0) {
            this.moveAlongPath(dt);
        }
    }

    // Chuyển đổi PathNode[] thành Vec3[]
    private convertPathToVec3Array(path: PathNode[]): Vec3[] {
        const vec3Array: Vec3[] = [];

        for (const pathNode of path) {
            // Lấy vị trí world từ Pathfinding grid
            if (Pathfinding.Instance) {
                const worldPos = Pathfinding.Instance.getGrid().getWorldPosition(
                    pathNode.getX(),
                    pathNode.getY()
                );
                vec3Array.push(worldPos);
            }
        }

        return vec3Array;
    }

    // Di chuyển đến vị trí chỉ định bằng tọa độ grid
    public moveToGridPosition(startX: number, startY: number, endX: number, endY: number): boolean {
        if (!Pathfinding.Instance) {
            
            return false;
        }

        // Tìm đường đi
        const path = Pathfinding.Instance.findPath(startX, startY, endX, endY);

        if (!path || path.length === 0) {
            
            return false;
        }

        
        this.currentPath = path;

        // Chuyển đổi thành Vec3 array
        this.pathPoints = this.convertPathToVec3Array(path);

        // Rất quan trọng: Nếu có đường đi, loại bỏ điểm bắt đầu vì xe đã ở đó.
        // Điều này ngăn xe quay đầu lại để đến tâm của ô grid hiện tại.
        if (this.pathPoints.length > 1) {
            this.pathPoints.shift(); // Xóa phần tử đầu tiên
        }

        // Bắt đầu di chuyển
        this.currentTargetIndex = 0;
        this.isMoving = true;

        // console.log("Starting movement to " + this.pathPoints.length + " waypoints");
        return true;
    }

    // Di chuyển đến vị trí world
    public moveToWorldPosition(targetPos: Vec3): boolean {
        if (!Pathfinding.Instance) {
            console.warn("Pathfinding instance not found!");
            return false;
        }

        // Chuyển đổi vị trí hiện tại thành grid coordinates
        const currentGridPos = Pathfinding.Instance.getGrid().getXY(this.node.worldPosition);
        const targetGridPos = Pathfinding.Instance.getGrid().getXY(targetPos);

        return this.moveToGridPosition(currentGridPos.x, currentGridPos.y, targetGridPos.x, targetGridPos.y);
    }

    public canMoveToWorldPosition(targetPos: Vec3): boolean {
        if (!Pathfinding.Instance) {
            return false;
        }
        const currentGridPos = Pathfinding.Instance.getGrid().getXY(this.node.worldPosition);
        const targetGridPos = Pathfinding.Instance.getGrid().getXY(targetPos);

        const path = Pathfinding.Instance.findPath(currentGridPos.x, currentGridPos.y, targetGridPos.x, targetGridPos.y);

        return path != null && path.length > 0;
    }

    // Di chuyển theo path đã có
    public moveAlongPath(dt: number): void {
        if (this.currentTargetIndex >= this.pathPoints.length) {
            // Đã hoàn thành đường đi
            this.isMoving = false;
            // console.log("Movement completed!");
            this.onMovementComplete();
           
            return;
        }

        const targetPos = this.pathPoints[this.currentTargetIndex];
        const currentPos = this.node.worldPosition;

        // Tính vector hướng
        const direction = targetPos.clone().subtract(currentPos);

        // Chuẩn hóa vector hướng (chỉ theo trục X và Z trong mặt phẳng XZ)
        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);

        if (distance < this.reachThreshold) {
            // Đã đến điểm đích, chuyển sang điểm tiếp theo
            this.currentTargetIndex++;
            // console.log("Reached waypoint " + this.currentTargetIndex + "/" + this.pathPoints.length);
            return;
        }

        // Tính hướng di chuyển (chỉ X và Z, bỏ qua Y)
        const moveDirection = new Vec3(direction.x, 0, direction.z);
        moveDirection.normalize();

        // Di chuyển
        const moveDistance = this.speed * dt;
        const moveVector = moveDirection.clone().multiplyScalar(moveDistance);

        // Cập nhật vị trí (chỉ thay đổi X và Z, giữ nguyên Y)
        this.node.setWorldPosition(
            currentPos.x + moveVector.x,
            currentPos.y, // Giữ nguyên Y (chiều cao)
            currentPos.z + moveVector.z
        );

        // Xoay node theo hướng di chuyển (trong mặt phẳng XZ)
        if (moveVector.length() > 0.001) {
            if (this.smoothRotation) {
                this.rotateTowardsDirection(moveDirection, dt);
            } else {
                this.rotateImmediately(moveDirection);
            }
        }
    }

    // Dừng di chuyển
    public stopMovement(): void {
        this.isMoving = false;
        this.currentTargetIndex = 0;
        this.pathPoints = [];
        this.targetRotation = this.node.eulerAngles.y; // Lưu góc hiện tại
    }

    // Kiểm tra có đang di chuyển không
    public isCurrentlyMoving(): boolean {
        return this.isMoving;
    }

    // Lấy điểm đích hiện tại
    public getCurrentTarget(): Vec3 | null {
        if (this.currentTargetIndex < this.pathPoints.length) {
            return this.pathPoints[this.currentTargetIndex];
        }
        return null;
    }

    // Lấy tất cả điểm trong path
    public getPathPoints(): Vec3[] {
        return this.pathPoints.slice(); // Trả về copy
    }

    // Lấy tiến trình di chuyển (0-1)
    public getMovementProgress(): number {
        if (this.pathPoints.length === 0) return 0;
        return this.currentTargetIndex / (this.pathPoints.length - 1);
    }

    // Callback khi hoàn thành di chuyển
    protected onMovementComplete(): void {
        // console.log("Car movement completed!");
        // Có thể override để thêm logic tùy chỉnh
        this.onMoveComplete.trigger();
    }

    // Hàm cũ để tương thích
    public moveto(pos: Vec3) {
        this.moveToWorldPosition(pos);
    }

    // Test function để di chuyển từ (4,0) đến (9,9)
    public testMovement(): void {
        this.moveToGridPosition(4, 0, 9, 9);
    }

    // Xoay node mượt mà theo hướng di chuyển
    private rotateTowardsDirection(direction: Vec3, dt: number): void {
        if (direction.length() < 0.001) return;

        // Tính góc mục tiêu từ hướng di chuyển
        const targetAngle = Math.atan2(direction.x, direction.z) * (180 / Math.PI);

        // Lấy góc hiện tại
        const currentAngle = this.node.eulerAngles.y;

        // Tính chênh lệch góc (normalized to -180 to 180)
        let angleDifference = targetAngle - currentAngle;
        while (angleDifference > 180) angleDifference -= 360;
        while (angleDifference < -180) angleDifference += 360;

        // Giới hạn tốc độ xoay
        const maxRotationThisFrame = this.rotationSpeed * dt;
        if (Math.abs(angleDifference) > maxRotationThisFrame) {
            angleDifference = Math.sign(angleDifference) * maxRotationThisFrame;
        }

        // Áp dụng xoay
        const newAngle = currentAngle + angleDifference;
        const eulerAngles = this.node.eulerAngles.clone();
        eulerAngles.y = newAngle;
        this.node.eulerAngles = eulerAngles;
    }

    // Xoay tức thời đến hướng cụ thể (không smoothing)
    private rotateImmediately(direction: Vec3): void {
        if (direction.length() < 0.001) return;

        const targetAngle = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
        const eulerAngles = this.node.eulerAngles.clone();
        eulerAngles.y = targetAngle;
        this.node.eulerAngles = eulerAngles;
    }

    // Set tốc độ xoay
    public setRotationSpeed(speed: number): void {
        this.rotationSpeed = Math.max(0, speed);
    }

    // Get tốc độ xoay hiện tại
    public getRotationSpeed(): number {
        return this.rotationSpeed;
    }

    // Set chế độ xoay mượt mà
    public setSmoothRotation(enabled: boolean): void {
        this.smoothRotation = enabled;
    }

    // Get chế độ xoay mượt mà hiện tại
    public getSmoothRotation(): boolean {
        return this.smoothRotation;
    }

    public getIsMoving(): boolean {
        return this.isMoving;
    }

    // Xoay tức thời đến hướng di chuyển hiện tại
    public snapToCurrentDirection(): void {
        if (this.currentTargetIndex < this.pathPoints.length) {
            const currentPos = this.node.worldPosition;
            const targetPos = this.pathPoints[this.currentTargetIndex];
            const direction = targetPos.clone().subtract(currentPos);
            if (direction.length() > 0.001) {
                this.rotateImmediately(direction.normalize());
            }
        }
    }
}



import { _decorator, Component, Node, Quat, Vec3, tween } from 'cc';
import { ParkSlot } from './ParkSlot';
import { Car } from './Car';
import { Signal } from '../eventSystem/Signal';
import { AnimationCarEvent } from './AnimationCar';
import { Game, GameState } from '../Core/Game';
const { ccclass, property } = _decorator;

export interface ParkingLotEvent {
    targetPos: Vec3;
    car: Car;
}

@ccclass('ParkingLot')
export class ParkingLot extends Component {
    @property(Node) private arrParkingLot: Node[] = [];

    private arrPark: ParkSlot[] = [];
    // Counter for concurrent car shifts
    private activeShiftCount = 0;
    private onAllShiftsCompleteCallbacks: Array<() => void> = [];
    private moveCompleteHandlers: WeakMap<Car, (data?: void) => void> = new WeakMap();
    private arrCar: ParkingLotEvent[] = [];

    public onMatch = new Signal<AnimationCarEvent>();

    public onTapFailSound = new Signal<void>();
    public onCarStartSound = new Signal<void>();

    public onCarDestroy = new Signal<Car>();

    public init(): void {
        this.arrPark = this.arrParkingLot.map(parkingLot => parkingLot.getComponent(ParkSlot));
        // When any car gets destroyed elsewhere, compact the lot if possible
        this.onCarDestroy.on(this.onCarDestroyed, this);

        this.arrPark[0].setIsBlocked(true);
        this.arrPark[1].setIsBlocked(true);
        this.arrPark[5].setIsBlocked(true);
        this.arrPark[6].setIsBlocked(true);
    }

    public findFreeSlot(): ParkSlot | null {
        for (let i = 0; i < this.arrPark.length; i++) {
            const slot = this.arrPark[i];
            if (slot && slot.isFree()) return slot;
        }
        return null;
    }

    public assignCarToFreeSlot(car: Car): ParkSlot | null {
        // Nếu xe đã có slot thì giữ nguyên
        const existing = this.getSlotOfCar(car);
        if (existing) return existing;

        const free = this.findFreeSlot();
        if (!free) return null;
        free.setCar(car);
        car.Mover.onMoveComplete.on(() => {
            this.gotoCarPos(free, car);
        }, this);
        return free;
    }

    public getSlotOfCar(car: Car): ParkSlot | null {
        for (let i = 0; i < this.arrPark.length; i++) {
            const slot = this.arrPark[i];
            if (slot && slot.getCar() === car) return slot;
        }
        return null;
    }

    private gotoCarPos(parkSlot: ParkSlot, car: Car): void {
        // Slot đã được assign trong requestParkCar(), không cần làm gì thêm
        const targetPos = parkSlot.getCarPos();
        const startPos = car.node.worldPosition.clone();
        const moveDir = targetPos.clone().subtract(startPos);

        // Tính góc quay theo trục Y dựa trên hướng di chuyển XZ
        const targetAngleY = Math.atan2(moveDir.x, moveDir.z) * (180 / Math.PI);

        // Chuẩn bị quaternion bắt đầu/kết thúc
        const startRot = car.node.rotation.clone();
        const endRot = new Quat();
        Quat.fromEuler(endRot, 0, targetAngleY, 0);

        // Thời gian thực hiện đồng thời (cố định 0.1s)
        const duration = 0.08;

        const state = { t: 0 } as { t: number };
        const tmpQuat = new Quat();
        const tmpPos = new Vec3();

        tween(state)
            .to(duration, { t: 1 }, {
                onUpdate: (obj: { t: number }) => {
                    if (car.node.isValid) {
                        // Xoay đồng thời
                        Quat.slerp(tmpQuat, startRot, endRot, obj.t);
                        car.node.setRotation(tmpQuat);
                        // Di chuyển đồng thời
                        Vec3.lerp(tmpPos, startPos, targetPos, obj.t);
                        car.node.setWorldPosition(tmpPos);
                    }
                }
            })
            .call(() => {
                // Snap về chính xác và reset rotation
                car.node.setWorldPosition(targetPos);
                const resetRot = new Quat(); // identity (0,0,0,1)
                car.node.setRotation(resetRot);
                parkSlot.carHasReached();

                const index = this.arrCar.findIndex(e => e.car === car);
                if (index > -1) {
                    this.arrCar.splice(index, 1);
                    this.onCarDestroy.trigger(car);
                }
                // console.log(`Car removed. Current moving cars: ${this.arrCar.length}`);

                // Nếu có xe đang dời chỗ, đợi xong rồi mới check
                if (this.activeShiftCount > 0) {
                    this.onAllShiftsComplete(() => {
                        this.checkMatch();
                        this.checkLoseIfIdle();
                        // Check lose sau khi đã check match và shift hoàn thành
                        this.checkLoseCondition();
                    });
                } else {
                    this.checkMatch();
                    this.checkLoseIfIdle();
                    // Check lose sau khi đã check match
                    this.checkLoseCondition();
                }
            })
            .start();
    }

    private checkMatch(): void {
        const parkedCars = new Map<number, ParkSlot[]>();
        let matchFound = false;

        // 1. Gom các xe đã đỗ theo 'type' (chỉ tính các slot không bị blocked)
        for (const slot of this.arrPark) {
            const car = slot.getCar();
            if (car && !slot.hasCarComing() && !slot.getIsBlocked()) {
                if (!parkedCars.has(car.type)) {
                    parkedCars.set(car.type, []);
                }
                parkedCars.get(car.type).push(slot);
            }
        }

        // 2. Tìm và xử lý các nhóm có 3 xe
        for (const [type, slots] of parkedCars) {
            if (slots.length >= 3) {
                matchFound = true;
                // console.log(`Matching 3 cars of type: ${type}`);
                const arrPos = slots.map(slot => slot.node.worldPosition.clone());
                this.onMatch.trigger({ arrPos, type });
                for (let i = 0; i < 3; i++) {
                    const slot = slots[i];
                    const car = slot.getCar();
                    if (car && car.node.isValid) {
                        car.node.active = false; // Ẩn thay vì destroy
                    }
                    slot.clearCar();
                }
            }
        }

        if (matchFound) {
            this.rearrangeCars();
        } else {
            // Sau khi ổn định và không còn match, kiểm tra Lose nếu bãi full
            this.checkLoseIfIdle();
        }
    }

    private rearrangeCars(): void {
        let emptySlotIndex = -1;

        for (let i = 0; i < this.arrPark.length; i++) {
            if (this.arrPark[i].getCar() === null && !this.arrPark[i].getIsBlocked()) {
                emptySlotIndex = i;
                break;
            }
        }

        if (emptySlotIndex === -1) {
            return; // No empty slots
        }

        for (let i = emptySlotIndex + 1; i < this.arrPark.length; i++) {
            const carToMove = this.arrPark[i].getCar();
            if (carToMove && !this.arrPark[i].hasCarComing() && !this.arrPark[i].getIsBlocked()) {
                const targetSlot = this.arrPark[emptySlotIndex];

                targetSlot.setCar(carToMove);
                this.arrPark[i].clearCar();

                this.shiftCar(targetSlot, carToMove);

                emptySlotIndex++;
            }
        }

        // After all rearrange shifts finish, re-check match for cascading
        this.onAllShiftsComplete(() => { this.checkMatch(); this.checkLoseIfIdle(); });
    }

    public requestParkCar(tappedCar: Car): ParkSlot | null {
        const existing = this.getSlotOfCar(tappedCar);
        if (existing) {
            this.onTapFailSound.trigger();
            // console.log("Car is already parked.");
            return existing;
        }

        const mover = tappedCar.Mover;
        if (!mover) return null;

        const targetIndex = this.findInsertionIndex(tappedCar.type);
        if (targetIndex < 0 || targetIndex >= this.arrPark.length) {
            // console.error(`Parking lot is full or invalid index for car type ${tappedCar.type}. Index: ${targetIndex}`);
            this.checkLoseCondition();
            return null;
        }

        // Xác định slot đích và kiểm tra đường đi TRƯỚC KHI thay đổi trạng thái bãi đỗ
        const preliminaryTargetSlot = this.arrPark[targetIndex];
        const stopPos = preliminaryTargetSlot.getStopPos();
        if (!mover.canMoveToWorldPosition(stopPos)) {
            console.warn(`Car (type ${tappedCar.type}) cannot find a path to the target slot. Parking request denied.`);
            this.onTapFailSound.trigger();
            return null; // Từ chối đỗ xe nếu không có đường
        }

        if (!this.arrPark[targetIndex].isFree()) {
            const success = this.shiftCarsToCreateSpace(targetIndex);
            if (!success) {
                // console.error("Failed to create space, parking lot is effectively full.");
                this.checkLoseCondition();
                return null;
            }
        }

        const targetSlot = this.arrPark[targetIndex];
        // Assign car để ngăn xe khác chọn slot này, nhưng chưa block
        targetSlot.assignCar(tappedCar);

        // Đảm bảo chỉ gắn 1 handler cho mỗi car (tránh leak/lặp)
        const existingHandler = this.moveCompleteHandlers.get(tappedCar);
        if (existingHandler) {
            mover.onMoveComplete.off(existingHandler);
            this.moveCompleteHandlers.delete(tappedCar);
        }

        const handler = () => {
            // one-shot
            mover.onMoveComplete.off(handler);
            this.moveCompleteHandlers.delete(tappedCar);
            this.gotoCarPos(targetSlot, tappedCar);
        };
        this.moveCompleteHandlers.set(tappedCar, handler);
        mover.onMoveComplete.on(handler, this);

        // Ra lệnh cho xe di chuyển
        mover.moveToWorldPosition(stopPos);

        this.onCarStartSound.trigger();

        const parkEvent: ParkingLotEvent = {
            targetPos: targetSlot.getCarPos(),
            car: tappedCar
        };
        this.arrCar.push(parkEvent);
        // console.log(`Car added. Current moving cars: ${this.arrCar.length}`);
        return targetSlot;
    }

    private findInsertionIndex(carType: number): number {
        let lastSameTypeIndex = -1;

        for (let i = 0; i < this.arrPark.length; i++) {
            const slot = this.arrPark[i];
            const car = slot.getCar();
            if (car && car.type === carType) {
                lastSameTypeIndex = i;
            }
        }

        if (lastSameTypeIndex !== -1) {
            // Đảm bảo vị trí tiếp theo không bị blocked
            const nextIndex = lastSameTypeIndex + 1;
            if (nextIndex < this.arrPark.length && !this.arrPark[nextIndex].getIsBlocked()) {
                return nextIndex;
            }
            // Nếu vị trí tiếp theo bị blocked, tìm vị trí free tiếp theo
            for (let i = nextIndex; i < this.arrPark.length; i++) {
                if (this.arrPark[i].isFree()) {
                    return i;
                }
            }
        }

        for (let i = 0; i < this.arrPark.length; i++) {
            if (this.arrPark[i].isFree()) {
                return i;
            }
        }

        return -1;
    }

    private shiftCarsToCreateSpace(startingIndex: number): boolean {
        let firstEmptyIndex = -1;
        for (let i = startingIndex; i < this.arrPark.length; i++) {
            if (this.arrPark[i].isFree()) {
                firstEmptyIndex = i;
                break;
            }
        }

        if (firstEmptyIndex === -1) return false;

        for (let i = firstEmptyIndex - 1; i >= startingIndex; i--) {
            const carToMove = this.arrPark[i].getCar();
            if (carToMove) {
                const targetSlot = this.arrPark[i + 1];

                const movingCarEvent = this.arrCar.find(e => e.car === carToMove);
                if (movingCarEvent) {
                    // Xe đang di chuyển: Cập nhật đích đến và ra lệnh lại
                    // console.log(`Rerouting moving car (type ${carToMove.type}) to a new slot.`);
                    movingCarEvent.targetPos = targetSlot.getCarPos();
                    targetSlot.setCar(carToMove);
                    this.arrPark[i].clearCar();

                    const mover = carToMove.Mover;
                    const oldHandler = this.moveCompleteHandlers.get(carToMove);
                    if (oldHandler) {
                        mover.onMoveComplete.off(oldHandler);
                    }

                    const newHandler = () => {
                        mover.onMoveComplete.off(newHandler);
                        this.moveCompleteHandlers.delete(carToMove);
                        this.gotoCarPos(targetSlot, carToMove);
                    };
                    this.moveCompleteHandlers.set(carToMove, newHandler);
                    mover.onMoveComplete.on(newHandler, this);

                    const newStopPos = targetSlot.getStopPos();
                    mover.moveToWorldPosition(newStopPos);
                } else {
                    // Xe đang đứng yên: Dùng cơ chế shift cũ
                    targetSlot.setCar(carToMove);
                    this.arrPark[i].clearCar();
                    this.shiftCar(targetSlot, carToMove);
                }
            }
        }

        return true;
    }

    private shiftCar(slot: ParkSlot, car: Car): void {
        this.activeShiftCount++;

        const targetPos = slot.getCarPos();
        const startPos = car.node.worldPosition.clone();

        const duration = 0.08;
        const state = { t: 0 } as { t: number };
        const tmpPos = new Vec3();

        tween(state)
            .to(duration, { t: 1 }, {
                onUpdate: (obj: { t: number }) => {
                    Vec3.lerp(tmpPos, startPos, targetPos, obj.t);
                    car.node.setWorldPosition(tmpPos);
                }
            })
            .call(() => {
                car.node.setWorldPosition(targetPos);
                slot.carHasReached();
                this.activeShiftCount--;
                if (this.activeShiftCount === 0) {
                    this.executeAndClearShiftCallbacks();
                }
            })
            .start();
    }

    private onAllShiftsComplete(cb: () => void): void {
        if (this.activeShiftCount === 0) {
            cb();
            return;
        }
        this.onAllShiftsCompleteCallbacks.push(cb);
    }

    private executeAndClearShiftCallbacks(): void {
        const cbs = this.onAllShiftsCompleteCallbacks.slice();
        this.onAllShiftsCompleteCallbacks.length = 0;
        for (const cb of cbs) {
            cb();
        }
    }

    private onCarDestroyed(car: Car): void {
        // If there is at least one empty slot (không tính blocked), rearrange remaining cars forward
        for (let i = 0; i < this.arrPark.length; i++) {
            if (this.arrPark[i].isFree()) {
                this.rearrangeCars();
                return;
            }
        }
    }

    private checkLoseCondition(): void {
        let free = 0;
        let blocked = 0;
        let coming = 0;
        let occupied = 0;
        for (let i = 0; i < this.arrPark.length; i++) {
            const slot = this.arrPark[i];
            if (slot.getIsBlocked()) {
                blocked++;
            } else if (slot.hasCarComing()) {
                coming++;
            } else if (slot.getCar() != null) {
                occupied++;
            } else {
                free++;
            }
        }
        // console.log(`ParkingLot status - Free: ${free}, Occupied: ${occupied}, Coming: ${coming}, Blocked: ${blocked}, Moving cars: ${this.arrCar.length}`);

        // Chỉ thua khi không còn slot available nào (free + coming = 0, không tính blocked)
        const available = free + coming;
        if (available === 0) {
            // console.log("LOSE TRIGGERED: No available slots (free + coming = 0)");
            Game.instance.CurrentGameState = GameState.Lose;
        }
    }

    private checkLoseIfIdle(): void {
        // Chỉ check khi không còn xe đang di chuyển và không còn dời xe
        if (this.activeShiftCount > 0 || this.arrCar.length > 0) return;
        this.checkLoseCondition();
    }
}



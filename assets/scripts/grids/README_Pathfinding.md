# A* Pathfinding System

Hệ thống tìm đường A* được triển khai với khả năng di chuyển 4 hướng (trên, phải, dưới, trái).

## Cấu trúc

### PathNode
- Kế thừa từ `CellBase`
- Chứa các thuộc tính cho thuật toán A*:
  - `gCost`: Chi phí từ điểm bắt đầu
  - `hCost`: Chi phí heuristic đến đích
  - `fCost`: Tổng chi phí (gCost + hCost)
  - `isWalkable`: Có thể di chuyển qua hay không
  - `cameFromNode`: Node cha trong đường đi

### Pathfinding
- Component chính quản lý thuật toán A*
- Sử dụng Grid<PathNode> để lưu trữ các node

## Cách sử dụng

### 1. Khởi tạo
```typescript
const pathfinding = new Pathfinding();
pathfinding.init(width, height, cellSize);
```

### 2. Tìm đường đi
```typescript
// Theo tọa độ grid
const path = pathfinding.findPath(startX, startY, endX, endY);

// Theo vị trí world
const path = pathfinding.findPathWorld(startWorldPos, endWorldPos);
```

### 3. Thiết lập chướng ngại vật
```typescript
// Theo tọa độ grid
pathfinding.setObstacle(x, y, true); // true = chướng ngại vật

// Theo vị trí world
pathfinding.setObstacleWorld(worldPos, true);
```

### 4. Lấy thông tin grid
```typescript
const grid = pathfinding.getGrid();
const node = grid.getGridObject(x, y);
```

## Ví dụ chi tiết

Xem file `PathfindingExample.ts` để có ví dụ hoàn chỉnh về cách sử dụng.

## Thuật toán A*

### Heuristic
Sử dụng Manhattan distance cho 4 hướng:
```
hCost = |x1 - x2| + |y1 - y2|
```

### Cost
- Chi phí di chuyển giữa các ô kề nhau: 1
- GCost: Tổng chi phí từ điểm bắt đầu
- FCost: GCost + HCost

### Các bước
1. Thêm start node vào open set
2. Lặp cho đến khi open set rỗng:
   - Lấy node có FCost thấp nhất từ open set
   - Di chuyển node đó sang closed set
   - Nếu node đó là đích → tái tạo đường đi
   - Kiểm tra các neighbor (4 hướng)
   - Cập nhật cost nếu tìm thấy đường tốt hơn

## Tính năng

- ✅ Di chuyển 4 hướng (không có đường chéo)
- ✅ Tự động tránh chướng ngại vật
- ✅ Tìm đường tối ưu
- ✅ Hỗ trợ cả tọa độ grid và world position
- ✅ Có thể reset grid cho lần tìm kiếm mới

## Lưu ý

- Grid được khởi tạo với tất cả ô đều có thể di chuyển
- Sử dụng `setObstacle()` để đánh dấu chướng ngại vật
- Thuật toán đảm bảo tìm được đường đi ngắn nhất (nếu có)

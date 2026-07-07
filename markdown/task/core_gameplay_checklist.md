# Checklist Triển Khai Gameplay Cốt Lõi - Number Match

**Lưu ý:** Tất cả các class xử lý game sẽ được đặt trong thư mục `assets/scripts/gameNumMatch/`.

Dựa trên tài liệu thiết kế kỹ thuật, đây là các bước chi tiết để triển khai gameplay.

---

## **Giai đoạn 1: Xây dựng Logic Cốt lõi (Model)**

**TÌNH TRẠNG: HOÀN THÀNH**

### **1.1. Thiết lập cấu trúc `BoardLogic.ts`**
- [x] Tạo file `assets/scripts/gameNumMatch/BoardLogic.ts`.
- [x] Khai báo lớp `BoardLogic` (không kế thừa `Component`).
- [x] Định nghĩa các thuộc tính (properties):
    - [x] `grid: number[][]`
    - [x] `rows: number`
    - [x] `cols: number`
    - [x] `selectedCell: {row: number, col: number} | null`

### **1.2. Khởi tạo và điền dữ liệu**
- [x] Implement hàm `constructor(cols: number, rows: number)` để khởi tạo `grid` với kích thước cho trước.
- [x] Implement hàm `populate(layout: number[])` để điền dữ liệu từ layout có sẵn vào `grid`.

### **1.3. Xử lý Tương tác `selectCell`**
- [x] Định nghĩa cấu trúc `MatchResult` trong một file riêng (ví dụ: `types.ts`).
- [x] Implement hàm `selectCell(row: number, col: number): MatchResult`.
- [x] **Luồng xử lý trong `selectCell`:**
    - [x] Nếu chưa có `selectedCell`, lưu ô vừa chọn và trả về `{ status: 'SELECTED' }`.
    - [x] Nếu click lại vào `selectedCell`, hủy chọn và trả về `{ status: 'DESELECTED' }`.
    - [x] Nếu đã có `selectedCell`, kiểm tra tính hợp lệ của cặp (cùng số hoặc tổng bằng 10). Nếu không, trả về `{ status: 'INVALID_PAIR' }`.
    - [x] Nếu hợp lệ, gọi thuật toán tìm đường đi (mục 1.4).

### **1.4. Thuật toán Tìm đường đi (Pathfinding)**
- [x] Implement một hàm private `findPath(start: {row, col}, end: {row, col}): {row, col}[] | null`.
- [x] Sử dụng thuật toán **BFS (Breadth-First Search)** tùy chỉnh.
- [x] Mỗi phần tử trong hàng đợi cần lưu: `{ pos: {row, col}, direction: 'h' | 'v', turns: number }`.
- [x] Giới hạn số lần rẽ (`turns`) không quá 2.
- [x] Thuật toán chỉ đi qua các ô trống (`grid[r][c] <= 0`).
- [x] Nếu tìm thấy đường đi, trả về một mảng các điểm trên đường đi đó.
- [x] Tích hợp `findPath` vào `selectCell`:
    - [x] Nếu `findPath` trả về `null`, `selectCell` trả về `{ status: 'NO_PATH' }`.

### **1.5. Xử lý Ghép cặp Thành công**
- [x] Khi `findPath` tìm thấy đường, hoàn thiện luồng `SUCCESS` trong `selectCell`:
    - [x] Đánh dấu 2 ô trong `grid` là đã xóa (ví dụ: gán giá trị `-1`).
    - [x] Tính điểm nhận được.
    - [x] Gọi hàm xử lý xóa hàng (mục 1.6).
    - [x] Reset `selectedCell` về `null`.
    - [x] Trả về `MatchResult { status: 'SUCCESS', pair: [...], path: [...], scoreGained: ..., clearedRows: [...] }`.

### **1.6. Xử lý Xóa hàng**
- [x] Implement một hàm private `checkAndClearRows(rowsToCheck: number[]): number[]`.
- [x] Hàm này lặp qua các hàng được chỉ định.
- [x] Nếu một hàng chỉ chứa các ô có giá trị `<= 0`, nó được coi là hàng trống.
- [x] Xóa các hàng trống khỏi `grid` (sử dụng `splice`).
- [x] Trả về một mảng chứa chỉ số của các hàng đã bị xóa.

### **1.7. Các tính năng phụ trợ**
- [x] Implement hàm `addNumbers(numbers: number[])` để thêm các số mới vào cuối `grid`.
- [x] Implement hàm `findHint(): [{row, col}, {row, col}] | null` để tìm một cặp ghép được.

### **1.8. Hệ thống Sự kiện**
- [x] Tích hợp một hệ thống sự kiện đơn giản (ví dụ: `EventEmitter`).
- [x] Khi điểm thay đổi, phát sự kiện `SCORE_UPDATED` với điểm số mới.
- [x] Khi hàng bị xóa, phát sự kiện `ROWS_REMOVED` với danh sách hàng đã xóa.

---

## **Giai đoạn 2: Hiển thị và Tương tác (View & Controller)**

**TÌNH TRẠNG: GẦN HOÀN THÀNH (Cần setup trong Editor)**

### **2.1. Prefab Ô số (`CellView`)**
- [ ] Tạo một Prefab cho ô số (`Cell`). *(Cần thực hiện trong Cocos Editor)*
- [x] Tạo script `CellView.ts` và gắn vào Prefab.
- [x] Script `CellView` chứa:
    - [x] `row: number`, `col: number`.
    - [x] Hàm `init(row, col, number, boardView)` để thiết lập.
    - [x] Logic xử lý sự kiện `Node.EventType.TOUCH_END` để gọi `boardView.onCellClick(this)`.
    - [x] Các hàm để thay đổi hiển thị: `showSelected(selected: boolean)`, `playClearAnimation()`.

### **2.2. Quản lý Bàn chơi (`BoardView`)**
- [ ] Tạo script `BoardView.ts` và gắn vào một Node trên Scene. *(Cần thực hiện trong Cocos Editor)*
- [x] **Properties:**
    - [x] `@property(Prefab) cellPrefab`.
    - [x] `@property(Node) gridRoot` (Node cha để chứa các `Cell`).
    - [x] `logic: BoardLogic`.
- [x] **Methods:**
    - [x] `onLoad()`: Khởi tạo `logic`, tải level data, gọi `drawBoard()`.
    - [x] `drawBoard()`:
        - [x] Xóa hết các `Cell` cũ trong `gridRoot`.
        - [x] Lặp qua `logic.getGridState()`.
        - [x] Với mỗi ô có số, `instantiate` một `cellPrefab` và gọi hàm `init()` của `CellView`.
    - [x] `onCellClick(cell: CellView)`:
        - [x] Lấy `row`, `col` từ `cell`.
        - [x] Gọi `logic.selectCell(row, col)`.
        - [x] Gọi các hàm xử lý hiển thị tương ứng với `MatchResult` trả về.

### **2.3. Xử lý Kết quả và Hiệu ứng**
- [x] Trong `BoardView`, tạo các hàm để xử lý `MatchResult`:
    - [x] `handleSelection(result: MatchResult)`: Cập nhật trạng thái `selected` cho `CellView`.
    - [x] `handleInvalid()`: Chạy animation lắc đầu hoặc đổi màu cho `CellView`.
    - [x] `handleSuccess(result: MatchResult)`:
        - [x] Chạy animation nối đường dựa trên `result.path`.
        - [x] Gọi `playClearAnimation()` trên các `CellView` tương ứng.
        - [ ] Phát âm thanh. *(Cần tích hợp SoundManager)*

### **2.4. Animation Xóa hàng và Dồn hàng**
- [x] Trong `BoardView`, lắng nghe sự kiện `ROWS_REMOVED` từ `logic`.
- [x] Implement hàm `playRowCollapseAnimation(removedRows: number[])`.
- [ ] Hàm này sẽ di chuyển các Node hàng phía trên của hàng đã xóa xuống vị trí mới. *(Cần animation thực tế)*
- [x] Sau khi animation kết thúc, gọi lại `drawBoard()` để đảm bảo giao diện đồng bộ 100% với logic.

---

## **Giai đoạn 3: Tích hợp Hệ thống Phụ trợ**

Mục tiêu: Hoàn thiện game với UI, âm thanh và quản lý màn chơi.

### **3.1. Quản lý UI (`UIManager`)**
- [ ] Tạo script `UIManager.ts`.
- [ ] Lắng nghe sự kiện `SCORE_UPDATED` từ `BoardLogic`.
- [ ] Cập nhật `Label` hiển thị điểm số.
- [ ] Thêm các nút chức năng (Gợi ý, Thêm số) và gọi các hàm tương ứng trên `BoardView` hoặc `BoardLogic`.

### **3.2. Quản lý Âm thanh (`SoundManager`)**
- [ ] Tạo script `SoundManager.ts`.
- [ ] Trong `BoardView`, tại các điểm xử lý kết quả (`handleSuccess`, `handleInvalid`...), gọi các hàm của `SoundManager` để phát âm thanh tương ứng.

### **3.3. Tải Dữ liệu Màn chơi**
- [ ] Tạo các file JSON chứa layout của các màn chơi.
- [ ] Trong `BoardView` hoặc một `GameManager`, implement logic để tải file JSON này.
- [ ] Truyền dữ liệu layout đã tải vào hàm `logic.populate()`.
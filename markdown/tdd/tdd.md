### **Tài liệu Thiết kế Kỹ thuật (Technical Design Document)**

**Tên tính năng**: Hệ thống Gameplay và Quản lý Bàn chơi (Core Gameplay & Board Management)

**Ngày tạo**: 26/08/2025

**Phiên bản**: 1.0

---

### **1. Tổng quan (Overview)**

Tài liệu này mô tả thiết kế kỹ thuật cho hệ thống gameplay cốt lõi của game Number Match. Hệ thống này chịu trách nhiệm cho tất cả các logic liên quan đến bàn chơi: từ việc khởi tạo, quản lý trạng thái các ô số, xử lý tương tác của người chơi, kiểm tra logic ghép cặp, cho đến việc tính điểm và cập nhật bàn chơi.

Mục tiêu chính là xây dựng một hệ thống linh hoạt, dễ bảo trì và tách biệt rõ ràng giữa logic và phần hiển thị (view).

### **2. Kiến trúc hệ thống (System Architecture)**

Để đảm bảo tính linh hoạt và dễ kiểm thử, hệ thống sẽ được xây dựng theo mô hình **Model-View-Controller (MVC)** được đơn giản hóa, tách biệt rõ ràng giữa Logic (Model) và Giao diện (View).

*   **`BoardLogic.ts` (Model):**
    *   Là một lớp TypeScript thuần túy, không kế thừa từ `Component` của Cocos.
    *   Chứa toàn bộ trạng thái của bàn chơi (ví dụ: một mảng hai chiều `grid[][]` lưu các con số).
    *   Chịu trách nhiệm xử lý tất cả các quy tắc của game: kiểm tra một cặp có hợp lệ không, tìm đường đi giữa hai ô, xóa ô, xóa hàng, tính điểm.
    *   Không chứa bất kỳ thông tin nào về Node, Sprite, hay Animation của Cocos Creator.

*   **`BoardView.ts` (View/Controller):**
    *   Là một `Component` trong Cocos Creator, được gắn vào một Node trên Scene.
    *   Giữ một tham chiếu đến một thực thể (instance) của `BoardLogic`.
    *   **Nhiệm vụ:**
        1.  **Hiển thị:** Đọc trạng thái từ `BoardLogic` (ví dụ: `logic.getGrid()`) và "vẽ" bàn chơi bằng cách tạo/cập nhật các Node/Prefab cho từng ô số.
        2.  **Xử lý Input:** Bắt sự kiện click từ người dùng trên các ô số và gọi các phương thức tương ứng của `BoardLogic` (ví dụ: `logic.selectCell(row, col)`).
        3.  **Cập nhật View:** Nhận kết quả trả về từ `BoardLogic` (ví dụ: "ghép cặp thành công") và kích hoạt các hiệu ứng hình ảnh (chạy animation, tạo hiệu ứng hạt, phát âm thanh).

*   **`CellView.ts` (Cell Prefab):**
    *   Là một `Component` được gắn vào Prefab của một ô số.
    *   Chịu trách nhiệm hiển thị trạng thái của riêng nó (ví dụ: đang được chọn, đang được gợi ý) và gửi thông tin vị trí (hàng, cột) của nó lên `BoardView` khi được click.

*   **Hệ thống Sự kiện (Event/Messaging System):**
    *   Để giảm sự phụ thuộc trực tiếp, `BoardLogic` sẽ giao tiếp với các hệ thống khác (như UI Manager, Sound Manager) thông qua một hệ thống sự kiện chung.
    *   Ví dụ: Khi điểm số thay đổi, `BoardLogic` sẽ phát ra một sự kiện `SCORE_UPDATED` với điểm số mới. `UIManager` sẽ lắng nghe sự kiện này và cập nhật text hiển thị.

### **3. Thiết kế chi tiết các thành phần (Component Design)**

#### **3.1. Lớp `BoardLogic.ts`**

*   **Thuộc tính (Properties):**
    *   `grid: number[][]`: Mảng 2 chiều lưu giá trị của từng ô. `0` là ô trống, `< 0` là ô đã bị xóa, `> 0` là ô có số.
    *   `rows: number`: Số hàng.
    *   `cols: number`: Số cột.
    *   `selectedCell: {row: number, col: number} | null`: Lưu trữ ô đang được chọn.

*   **Phương thức (Public API):**
    *   `constructor(cols: number, rows: number)`: Khởi tạo bàn chơi với kích thước cho trước.
    *   `populate(layout: number[])`: Điền dữ liệu số vào `grid` từ một mảng layout.
    *   `selectCell(row: number, col: number): MatchResult`: Phương thức chính xử lý tương tác. Nhận vào vị trí ô được click, trả về một đối tượng `MatchResult` mô tả kết quả của hành động.
    *   `addNumbers(numbers: number[])`: Thêm các số mới vào cuối bàn chơi (tính năng "Plus").
    *   `findHint(): [{row, col}, {row, col}] | null`: Tìm một cặp có thể ghép để gợi ý cho người chơi.
    *   `getGridState(): number[][]`: Trả về một bản sao của `grid` để `BoardView` có thể đọc và hiển thị.

#### **3.2. Component `BoardView.ts`**

*   **Thuộc tính (Properties):**
    *   `@property(Prefab) cellPrefab`: Prefab cho một ô số.
    *   `@property(Node) gridRoot`: Node cha chứa tất cả các ô số.
    *   `logic: BoardLogic`: Tham chiếu đến lớp logic.

*   **Phương thức (Methods):**
    *   `onLoad()`: Khởi tạo `logic`, tải dữ liệu màn chơi, gọi `drawBoard()`.
    *   `drawBoard()`: Dọn dẹp bàn chơi cũ, lặp qua `logic.getGridState()` và `instantiate` các `cellPrefab` vào `gridRoot`.
    *   `onCellClick(cell: CellView)`: Được gọi bởi `CellView` khi người dùng click. Lấy `row`, `col` từ `cell` và gọi `logic.selectCell(row, col)`. Sau đó xử lý `MatchResult` trả về.
    *   `playMatchAnimation(cell1Pos, cell2Pos, path)`: Chạy animation xóa ô, vẽ đường nối, tạo hiệu ứng...
    *   `onScoreUpdated(newScore)`: Lắng nghe sự kiện và cập nhật UI.

#### **3.3. Cấu trúc dữ liệu `MatchResult`**

Đây là đối tượng do `BoardLogic` trả về sau mỗi lần `selectCell`, giúp `BoardView` biết cần phải làm gì tiếp theo.

```typescript
type MatchResult = {
  status: 'SELECTED' | 'DESELECTED' | 'INVALID_PAIR' | 'NO_PATH' | 'SUCCESS';
  pair?: [{row, col}, {row, col}]; // Cặp ô đã ghép thành công
  path?: {row, col}[];             // Đường đi giữa hai ô
  clearedRows?: number[];         // Các hàng đã bị xóa
  scoreGained?: number;           // Điểm nhận được
}
```

### **4. Thuật toán cốt lõi (Core Algorithms)**

*   **Tìm đường đi (Pathfinding):**
    *   **Quy tắc:** Hai ô có thể nối với nhau nếu đường đi giữa chúng là một đường thẳng hoặc có tối đa 2 khúc cua (hình chữ L hoặc chữ U), và đường đi đó không chứa ô số nào khác (chỉ đi qua ô trống).
    *   **Giải pháp đề xuất:** Sử dụng thuật toán Tìm kiếm theo chiều rộng (Breadth-First Search - BFS) được tùy chỉnh.
        *   Bắt đầu từ ô thứ nhất.
        *   Mỗi bước trong hàng đợi (queue) của BFS sẽ lưu `(vị trí, hướng đi, số lần đổi hướng)`.
        *   Giới hạn số lần đổi hướng không quá 2.
        *   Nếu tìm thấy ô thứ hai, trả về đường đi. Nếu hàng đợi rỗng mà chưa tìm thấy, tức là không có đường đi hợp lệ.

*   **Xóa hàng (Row Deletion):**
    *   Sau khi một cặp được xóa, kiểm tra các hàng chứa hai ô đó.
    *   Lặp qua hàng, nếu tất cả các ô trong hàng đều có giá trị là `0` hoặc `< 0` (đã bị xóa), thì hàng đó được coi là trống.
    *   Xóa hàng đó khỏi mảng `grid` và cập nhật lại chỉ số `row` của tất cả các hàng bên dưới nó.
    *   Phát ra sự kiện `ROWS_REMOVED` để `BoardView` có thể chạy animation dồn các hàng lên.

### **5. Luồng dữ liệu (Data Flow)**

**Ví dụ luồng xử lý một lượt ghép cặp thành công:**

1.  Người dùng click vào ô số A.
2.  `CellView` (A) -> `BoardView.onCellClick(cellA)`.
3.  `BoardView` -> `logic.selectCell(rowA, colA)`.
4.  `BoardLogic` lưu ô A là `selectedCell`, trả về `MatchResult { status: 'SELECTED' }`.
5.  `BoardView` nhận kết quả, chạy animation "chọn" cho ô A.
6.  Người dùng click vào ô số B.
7.  `CellView` (B) -> `BoardView.onCellClick(cellB)`.
8.  `BoardView` -> `logic.selectCell(rowB, colB)`.
9.  `BoardLogic`:
    *   Kiểm tra `isPair(selectedCell, cellB)` -> Hợp lệ.
    *   Chạy `findPath(selectedCell, cellB)` -> Tìm thấy đường đi.
    *   Cập nhật `grid` (đánh dấu ô A, B là đã xóa).
    *   Kiểm tra và xử lý xóa hàng.
    *   Tính điểm.
    *   Trả về `MatchResult { status: 'SUCCESS', pair: [...], path: [...], ... }`.
10. `BoardView` nhận kết quả `SUCCESS`:
    *   Chạy animation nối đường, xóa ô A và B.
    *   Nếu có `clearedRows`, chạy animation dồn hàng.
11. `BoardLogic` phát sự kiện `SCORE_UPDATED`.
12. `UIManager` nhận sự kiện và cập nhật hiển thị điểm số.
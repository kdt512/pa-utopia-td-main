Tuyệt vời! Để chuyển đổi thuật toán này sang Cocos Creator, chúng ta sẽ cần hiểu rõ từng thành phần và cách chúng tương tác. Dưới đây là phân tích chi tiết từng phần, kèm theo các gợi ý triển khai trong Cocos Creator.

---

## Phân tích Chi tiết Thuật toán Tìm đường trong `TableNumberController.cs` cho Cocos Creator

Mục tiêu của thuật toán này là xác định các ô số liền kề hoặc có thể liên kết (tức là không có ô số nào cản trở giữa chúng) trên một bảng trò chơi dạng lưới. Nó đặc biệt quan trọng cho các chức năng như gợi ý (hint) và kiểm tra xem hai ô có thể được xóa hay không.

### 1. Cấu trúc Dữ liệu Cơ bản

**1.1. `CellNumberController` (Biểu diễn một ô trên bảng)**

Trong C#, `CellNumberController` là một `MonoBehaviour` (thành phần của Unity). Trong Cocos Creator, bạn sẽ tạo một lớp JavaScript/TypeScript tương ứng, có thể là một Script Component (`CellNumber.ts`).

**Các thuộc tính quan trọng:**

*   **`_cellNumber: number`**: Giá trị số của ô.
    *   `IsActive`: `_cellNumber > 0` (Ô đang chứa số và có thể tương tác).
    *   `IsCleared`: `_cellNumber < 0` (Ô đã bị xóa, số âm được dùng để đánh dấu trạng thái này).
    *   `IsEmpty`: `_cellNumber == 0` (Ô trống).
*   **`_rowIndex: number`, `_columnIndex: number`**: Vị trí hàng và cột của ô trong bảng.
*   **`_cellLinks: number[]`**: Mảng chứa "khoảng cách" đến ô hoạt động tiếp theo theo 4 hướng.
    *   Kích thước mảng: `directions.Length` (4 hướng).
    *   Mỗi phần tử `_cellLinks[k]` lưu trữ số lượng ô **không hoạt động** liên tiếp bắt đầu từ ô hiện tại theo hướng `k`, cộng thêm 1 (để tính luôn ô đích).
    *   Nếu `_cellLinks[k]` là `N`, nghĩa là có `N-1` ô trống/đã xóa và ô thứ `N` (tính từ ô hiện tại theo hướng đó) là ô hoạt động đầu tiên.

**Triển khai trong Cocos Creator (`CellNumber.ts`):**

```typescript
import { _decorator, Component, Node, Label, Button, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CellNumber')
export class CellNumber extends Component {
    @property({ type: Label })
    private numberLabel: Label = null;

    @property({ type: Sprite })
    private selectedBg: Sprite = null;

    @property({ type: Sprite })
    private hintBg: Sprite = null;

    @property({ type: Sprite })
    private maskBg: Sprite = null;
    
    // Thuộc tính dữ liệu
    private _cellNumber: number = 0;
    private _rowIndex: number = 0;
    private _columnIndex: number = 0;
    private _isSelected: boolean = false;
    private _cellLinks: number[] = new Array(4).fill(1); // 4 hướng, khởi tạo là 1
    private _originalTextColor: Color;

    onLoad() {
        if (this.numberLabel) {
            this._originalTextColor = this.numberLabel.color.clone();
        }
    }

    // Getters
    get cellNumber(): number { return this._cellNumber; }
    get rowIndex(): number { return this._rowIndex; }
    get columnIndex(): number { return this._columnIndex; }
    get isSelected(): boolean { return this._isSelected; }
    get isActive(): boolean { return this._cellNumber > 0; }
    get isCleared(): boolean { return this._cellNumber < 0; }
    get isEmpty(): boolean { return this._cellNumber === 0; }

    // Setters và phương thức khởi tạo
    public setup(rowIndex: number, columnIndex: number, cellNumber: number = 0) {
        this._rowIndex = rowIndex;
        this._columnIndex = columnIndex;
        this.setCellNumber(cellNumber);
        this.setSelected(false);
        this.setHint(false);
        this.setMask(false);
        this._cellLinks.fill(1); // Reset links
        this.node.name = `Cell (${rowIndex}, ${columnIndex})`; // Debug
    }

    public setCellNumber(number: number) {
        this._cellNumber = number;
        if (this.numberLabel) {
            this.numberLabel.string = Math.abs(number).toString();
            this.numberLabel.node.active = !this.isEmpty; // Ẩn label nếu ô trống
            this.setClear(this.isCleared); // Cập nhật màu nếu đã xóa
        }
    }

    public setSelected(isSelected: boolean) {
        this._isSelected = isSelected;
        if (this.selectedBg) {
            this.selectedBg.node.active = isSelected;
        }
    }

    public setHint(isHint: boolean) {
        if (this.hintBg) {
            this.hintBg.node.active = isHint;
        }
    }

    public setMask(isMask: boolean) {
        if (this.maskBg) {
            this.maskBg.node.active = isMask;
        }
    }

    private setClear(isClear: boolean) {
        if (this.numberLabel) {
            const color = this.numberLabel.color.clone();
            color.setA(isClear ? Math.floor(255 * 0.2) : 255); // ALPHA_CLEAR = 0.2
            this.numberLabel.color = color;
        }
    }

    public setCellLink(direction: number, value: number) {
        if (direction >= 0 && direction < this._cellLinks.length) {
            this._cellLinks[direction] = value;
        }
    }

    public getCellLinkValue(direction: number): number {
        if (direction >= 0 && direction < this._cellLinks.length) {
            return this._cellLinks[direction];
        }
        return 1; // Default
    }

    public setOriginColorText() {
        if (this.numberLabel) {
            this.numberLabel.color = this._originalTextColor.clone();
        }
    }

    public setColorText(color: Color) {
        if (this.numberLabel) {
            const currentAlpha = this.numberLabel.color.a;
            color.setA(currentAlpha);
            this.numberLabel.color = color;
        }
    }

    // Các phương thức khác như shakeOnce(), playEffectHint() sẽ dùng Tween của Cocos Creator
}
```

**1.2. `TableNumberController` (Quản lý bảng)**

Đây là lớp chính chứa logic tạo bảng, tương tác ô, và thuật toán tìm đường.

**Các thuộc tính quan trọng:**

*   **`_table: CellNumberController[][]`**: Một mảng 2D (mảng các mảng) chứa tất cả các đối tượng `CellNumber`. `_table[row][col]` sẽ trả về ô tại vị trí đó.
*   **`_columnNum: number`**: Số cột cố định của bảng (ví dụ: 9).
*   **`_rowNum: number`**: Số hàng hiện tại của bảng (tăng khi thêm hàng).
*   **`directions: (x: number, y: number)[]`**: Mảng định nghĩa các vector dịch chuyển cho 4 hướng.
    *   `(1, 1)`: Dưới-phải
    *   `(1, 0)`: Dưới
    *   `(1, -1)`: Dưới-trái
    *   `(0, 1)`: Phải

**Triển khai trong Cocos Creator (`TableNumber.ts`):**

```typescript
import { _decorator, Component, Node, Prefab, instantiate, UITransform, Layout, ScrollView, Vec2, tween, Tween, Enum, Vec3, Color } from 'cc';
import { CellNumber } from './CellNumber'; // Import CellNumber

const { ccclass, property } = _decorator;

// Enum để ánh xạ các hướng
enum TableDirect {
    RightBot = 0,
    Bottom = 1,
    LeftBot = 2,
    Right = 3,
}

@ccclass('TableNumberController')
export class TableNumberController extends Component {
    @property({ type: Prefab })
    private cellPrefab: Prefab = null;

    @property({ type: UITransform })
    private tableContainer: UITransform = null; // Node chứa tất cả các CellNumber

    @property({ type: ScrollView })
    private scrollView: ScrollView = null; // ScrollView nếu có

    @property({ type: Node })
    private startPosNode: Node = null; // Vị trí tham chiếu để đặt ô

    @property({ slide: true, range: [1, 20, 1] }) // Range cho slider trong editor
    private _columnNum: number = 9;

    private _table: CellNumber[][] = [];
    private _rowNum: number = 0;
    private _cellSize: number = 0;
    private _isInitialized: boolean = false;
    private _isLocked: boolean = false; // Ngăn chặn tương tác khi đang có hiệu ứng

    // Định nghĩa các hướng (offset cho row, col)
    private directions: { x: number, y: number }[] = [
        { x: 1, y: 1 },   // Dưới-phải (RightBot)
        { x: 1, y: 0 },   // Dưới (Bottom)
        { x: 1, y: -1 },  // Dưới-trái (LeftBot)
        { x: 0, y: 1 }    // Phải (Right)
    ];

    onLoad() {
        // Khởi tạo các thứ cần thiết
    }

    start() {
        // Có thể gọi setupNewTable ở đây hoặc từ một lớp quản lý GamePlay
    }

    // --- Phương thức khởi tạo và thiết lập bảng ---
    public async setupNewTable(numbers: number[]) {
        this._isInitialized = false;
        this._table.length = 0; // Clear table
        this._rowNum = 0;
        this._isLocked = false; // Reset lock
        
        // Tính _cellSize dựa trên chiều rộng của tableContainer
        if (this.tableContainer && this._columnNum > 0) {
            this._cellSize = this.tableContainer.width / this._columnNum;
        }

        const initialRowCount = Math.ceil(numbers.length / this._columnNum) + 1 + 15; // +15 hàng dự phòng
        await this.initTable(initialRowCount); // Tạo cấu trúc bảng
        
        // Thêm số vào bảng sau khi cấu trúc đã được tạo
        await this.addListNumber(numbers, true);

        this._isInitialized = true;
    }

    private async initTable(rowInit: number) {
        // Xóa tất cả các ô cũ trong tableContainer
        this.tableContainer.node.removeAllChildren();
        this._table.length = 0;
        this._rowNum = 0;

        for (let i = 0; i < rowInit; i++) {
            this.addRow();
            // Đợi một frame sau mỗi 11 hàng để tránh blocking UI
            if (i % 11 === 0) await new Promise(resolve => this.scheduleOnce(resolve, 0));
        }
        
        // Điều chỉnh kích thước của tableContainer để phù hợp với số hàng
        this.tableContainer.height = this._cellSize * this._rowNum;
        // Đặt vị trí scroll về cuối (Cocos Creator có thể dùng setScrollingStep hay setScrollOffset)
        if (this.scrollView) {
            this.scrollView.scrollToBottom(0);
        }
        this.refreshCellPositions();
    }

    private addRow() {
        const row: CellNumber[] = [];
        for (let col = 0; col < this._columnNum; col++) {
            const cellNode = instantiate(this.cellPrefab);
            cellNode.setParent(this.tableContainer.node);
            const cell = cellNode.getComponent(CellNumber);
            if (cell) {
                // Đặt vị trí ban đầu cho cell (sẽ được điều chỉnh bởi refreshCellPositions)
                cell.setup(this._rowNum, col); 
                row.push(cell);
            }
        }
        this._table.push(row);
        this._rowNum++;
    }

    private refreshCellPositions() {
        const startPosX = this.startPosNode.worldPosition.x;
        const startPosY = this.startPosNode.worldPosition.y;

        for (let r = 0; r < this._rowNum; r++) {
            for (let c = 0; c < this._columnNum; c++) {
                const cell = this._table[r][c];
                if (cell && cell.node) {
                    // Tính toán vị trí cục bộ so với tableContainer
                    const x = (c + 0.5) * this._cellSize;
                    const y = (r + 0.5) * -this._cellSize; // Hàng dưới có Y nhỏ hơn
                    cell.node.setPosition(x, y);
                    cell.node.name = `Cell (${r}, ${c})`; // Cập nhật tên để debug
                }
            }
        }
    }

    // --- Các phương thức lấy và quản lý Cell ---
    public getCellByIndex(index: number): CellNumber | null {
        if (index < 0) return null;
        const row = Math.floor(index / this._columnNum);
        const col = index % this._columnNum;
        if (row < 0 || row >= this._rowNum || col < 0 || col >= this._columnNum) return null;
        return this._table[row][col];
    }

    private getIndexByRowCol(row: number, col: number): number {
        return row * this._columnNum + col;
    }

    private getIndexByCell(cell: CellNumber): number {
        return this.getIndexByRowCol(cell.rowIndex, cell.columnIndex);
    }

    private getNextCell(currentCell: CellNumber | null): CellNumber | null {
        let nextRow, nextCol;
        if (!currentCell) {
            return this._table[0][0]; // Bắt đầu từ ô đầu tiên
        }

        nextCol = currentCell.columnIndex + 1;
        nextRow = currentCell.rowIndex + Math.floor(nextCol / this._columnNum);
        nextCol %= this._columnNum;

        if (nextRow >= this._rowNum) return null;
        return this._table[nextRow][nextCol];
    }
    
    // --- Lock/Unlock bảng ---
    private async lockTable(isLocked: boolean) {
        if (isLocked) {
            // Đảm bảo không khóa lại khi đã khóa
            await new Promise(resolve => {
                const checkLock = () => {
                    if (!this._isLocked) {
                        this.unschedule(checkLock);
                        resolve(null);
                    }
                };
                this.schedule(checkLock, 0); // Kiểm tra mỗi frame
            });
        }
        this._isLocked = isLocked;
        // Tắt/bật tương tác và scroll
        this.node.active = !isLocked; // Có thể ẩn/hiện một overlay hoặc disable button
        if (this.scrollView) {
            this.scrollView.enabled = !isLocked;
        }
    }

    // ... Các phương thức khác sẽ được thêm vào sau ...
}
```

---

### 2. Thuật toán Liên kết Ô (Link Cells Algorithm)

Đây là trái tim của thuật toán tìm đường. Nó xác định các ô hoạt động mà có thể nhìn thấy nhau theo các hướng đã định, bỏ qua các ô trống/đã xóa.

**2.1. `directions` (Các hướng dịch chuyển)**

```typescript
// Trong TableNumberController
private directions: { x: number, y: number }[] = [
    { x: 1, y: 1 },   // Dưới-phải
    { x: 1, y: 0 },   // Dưới
    { x: 1, y: -1 },  // Dưới-trái
    { x: 0, y: 1 }    // Phải
];
```

**2.2. `ResetLinkCell()`**

*   **Mục đích:** Cập nhật lại toàn bộ `_cellLinks` cho tất cả các ô trên bảng. Nên gọi sau khi có bất kỳ sự thay đổi nào về trạng thái của các ô (xóa, thêm số).
*   **Cách hoạt động:**
    1.  Lặp qua tất cả các ô trên bảng, tốt nhất là từ dưới lên, từ phải sang trái (hoặc ngược lại) để đảm bảo tính toán đệ quy hiệu quả hơn.
    2.  Đối với mỗi ô, và cho mỗi hướng trong `directions`:
        *   Khởi tạo `_cellLinks[k]` của ô hiện tại là 1 (nghĩa là ô hoạt động đầu tiên theo hướng đó *có thể* là ô liền kề).
        *   Gọi hàm đệ quy `FindCellLink` để tính toán khoảng cách thực tế.

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private resetLinkCell() {
    // Lặp từ cuối bảng lên đầu để tính toán đệ quy hiệu quả
    for (let r = this._rowNum - 1; r >= 0; r--) {
        for (let c = this._columnNum - 1; c >= 0; c--) {
            const cell = this._table[r][c];
            if (cell) { // Đảm bảo cell tồn tại
                for (let k = 0; k < this.directions.length; k++) {
                    cell.setCellLink(k, 1); // Khởi tạo khoảng cách là 1
                    // Gọi hàm đệ quy để tìm khoảng cách thực tế
                    cell.setCellLink(k, this.findCellLink(r, c, k));
                }
            }
        }
    }
}
```

**2.3. `FindCellLink(row, column, direct)`**

*   **Mục đích:** Tìm số lượng ô liên tiếp (bao gồm cả ô không hoạt động) theo một hướng cụ thể, cho đến khi gặp một ô hoạt động hoặc ranh giới của bảng.
*   **Đây là hàm đệ quy.**
*   **Input:** `row`, `column` (tọa độ của ô hiện tại), `direct` (chỉ số của hướng).
*   **Output:** `number` (khoảng cách).

**Cách hoạt động:**

1.  Lấy `k` hiện tại từ `cell.getCellLinkValue(direct)`. Ban đầu, `k` sẽ là 1 (từ `resetLinkCell`).
2.  Tính toán tọa độ `nextRow`, `nextColumn` của ô tiếp theo bằng cách dịch chuyển từ `(row, column)` theo `direct` một khoảng `k`.
3.  **Xử lý tràn cột:** Nếu `nextColumn` vượt quá số cột (`_columnNum`) trong cùng một hàng, nó cần chuyển sang hàng tiếp theo.
    *   Ví dụ: Nếu đang ở ô cuối hàng `(0, 8)` và dịch chuyển sang phải `k=1`, `nextColumn` sẽ là `9`. Ta cần chuyển nó thành `(0, 8)` -> `(1, 0)`.
    *   `nextRow += Math.floor(nextColumn / this._columnNum);`
    *   `nextColumn %= this._columnNum;`
4.  **Điều kiện Dừng (Base Case) của đệ quy:**
    *   Nếu `(nextRow, nextColumn)` nằm ngoài ranh giới của bảng, HOẶC
    *   Nếu ô tại `(nextRow, nextColumn)` **đang hoạt động** (`isActive` là `true`).
    *   Trong trường hợp này, `k` hiện tại là khoảng cách hợp lệ. Cập nhật `_cellLinks[direct]` của ô ban đầu (`cell`) và trả về `k`.
5.  **Bước Đệ quy:**
    *   Nếu ô tại `(nextRow, nextColumn)` tồn tại VÀ **không hoạt động** (`isActive` là `false`).
    *   Tăng `k` lên `k + FindCellLink(nextRow, nextColumn, direct)`. Điều này có nghĩa là chúng ta "nhảy qua" ô không hoạt động này và tiếp tục tìm kiếm từ nó.
    *   Cập nhật `_cellLinks[direct]` của ô ban đầu (`cell`) và trả về `k`.

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private findCellLink(row: number, column: number, direct: number): number {
    const cell = this._table[row][column];
    let k = cell.getCellLinkValue(direct); // Lấy khoảng cách đã lưu trữ (ban đầu là 1)

    // Tính toán tọa độ ô tiếp theo
    let nextRow = row + this.directions[direct].x * k;
    let nextColumn = column + this.directions[direct].y * k;

    // Xử lý tràn cột (chuyển sang hàng mới nếu cột vượt quá)
    // Điều này là cần thiết nếu bạn coi bảng là một dòng liên tục
    if (this.directions[direct].x === 0 && this.directions[direct].y === 1) { // Chỉ cho hướng "Right"
        // Nếu nextColumn vượt quá _columnNum, chuyển sang hàng tiếp theo
        nextRow += Math.floor(nextColumn / this._columnNum);
        nextColumn %= this._columnNum;
    }

    // Kiểm tra ranh giới bảng
    if (nextRow < 0 || nextRow >= this._rowNum || nextColumn < 0 || nextColumn >= this._columnNum) {
        return k; // Đã ra ngoài bảng, khoảng cách là k hiện tại
    }

    const nextCell = this._table[nextRow][nextColumn];
    if (!nextCell) { // Nếu ô tiếp theo không tồn tại (trường hợp hiếm nếu bảng được khởi tạo đúng)
        return k;
    }
    
    // Điều kiện dừng đệ quy: Nếu ô tiếp theo đang hoạt động
    if (nextCell.isActive) {
        return k;
    }

    // Bước đệ quy: Nếu ô tiếp theo không hoạt động (trống hoặc đã xóa)
    // Tăng k lên và tiếp tục tìm kiếm từ ô không hoạt động đó
    k += this.findCellLink(nextRow, nextColumn, direct);
    cell.setCellLink(direct, k); // Cập nhật tổng khoảng cách vào ô ban đầu
    return k;
}
```

**2.4. `GetCellLink(row, column, direct)`**

*   **Mục đích:** Trả về đối tượng `CellNumber` của ô hoạt động đầu tiên theo một hướng cụ thể từ một ô ban đầu, bỏ qua các ô không hoạt động.
*   **Input:** `row`, `column`, `direct`.
*   **Output:** `CellNumber | null`.

**Cách hoạt động:**

1.  Gọi `FindCellLink` để lấy khoảng cách `k` đến ô hoạt động tiếp theo.
2.  Tính toán tọa độ `nextRow`, `nextColumn` dựa trên `k`.
3.  **Xử lý tràn cột** tương tự như `FindCellLink`.
4.  Kiểm tra xem ô tại `(nextRow, nextColumn)` có hợp lệ và **đang hoạt động** hay không.
    *   Nếu có, trả về đối tượng `CellNumber` đó.
    *   Nếu không, trả về `null`.

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
public getCellLink(row: number, column: number, direct: number): CellNumber | null {
    const k = this.findCellLink(row, column, direct); // Lấy khoảng cách đến ô hoạt động tiếp theo
    
    let nextRow = row + this.directions[direct].x * k;
    let nextColumn = column + this.directions[direct].y * k;

    // Xử lý tràn cột
    if (this.directions[direct].x === 0 && this.directions[direct].y === 1) { // Chỉ cho hướng "Right"
        nextRow += Math.floor(nextColumn / this._columnNum);
        nextColumn %= this._columnNum;
    }
    
    // Kiểm tra ranh giới
    if (nextRow < 0 || nextRow >= this._rowNum || nextColumn < 0 || nextColumn >= this._columnNum) {
        return null;
    }

    const linkedCell = this._table[nextRow][nextColumn];
    // Trả về ô liên kết nếu nó đang hoạt động
    if (linkedCell && linkedCell.isActive) {
        return linkedCell;
    } else {
        return null; // Không tìm thấy ô hoạt động liên kết
    }
}
```

---

### 3. Logic Kiểm tra và Gợi ý (Check & Hint Logic)

Các hàm này sử dụng `GetCellLink` để thực hiện kiểm tra logic trò chơi.

**3.1. `CheckTwoCell(cell1, cell2)`**

*   **Mục đích:** Kiểm tra điều kiện cơ bản để hai ô có thể được ghép (xóa).
*   **Điều kiện:**
    *   Cả hai ô phải đang hoạt động (`isActive`).
    *   Cả hai ô phải có cùng giá trị số (`cell1.cellNumber == cell2.cellNumber`), HOẶC
    *   Tổng giá trị số của chúng bằng `TARGET_SUM` (ví dụ: 10).

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private TARGET_SUM: number = 10; // Đặt hằng số này

private checkTwoCell(cell1: CellNumber | null, cell2: CellNumber | null): boolean {
    if (!cell1 || !cell2 || !cell1.isActive || !cell2.isActive) {
        return false;
    }
    return (cell1.cellNumber === cell2.cellNumber || (cell1.cellNumber + cell2.cellNumber === this.TARGET_SUM));
}
```

**3.2. `CheckTwoCellHint(cell1, cell2)`**

*   **Mục đích:** Kiểm tra xem hai ô có thể được ghép VÀ có thể liên kết (không có ô hoạt động nào cản trở giữa chúng).
*   **Cách hoạt động:**
    1.  Gọi `checkTwoCell` để kiểm tra điều kiện ghép cơ bản.
    2.  Nếu `checkTwoCell` trả về `true`, sau đó kiểm tra xem `GetCellLink` từ `cell1` theo bất kỳ hướng nào có trả về `cell2` hay không, HOẶC ngược lại. Điều này xác nhận rằng không có ô hoạt động nào khác trên đường đi.

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private checkTwoCellHint(cell1: CellNumber | null, cell2: CellNumber | null): boolean {
    if (!this.checkTwoCell(cell1, cell2)) {
        return false;
    }

    // Kiểm tra xem cell1 và cell2 có liên kết trực tiếp với nhau qua các hướng không
    for (let k = 0; k < this.directions.length; k++) {
        // Kiểm tra từ cell1 đến cell2
        if (this.getCellLink(cell1.rowIndex, cell1.columnIndex, k) === cell2) {
            return true;
        }
        // Kiểm tra từ cell2 đến cell1 (để bao phủ các hướng đối diện nếu cần, mặc dù findCellLink đã làm điều đó)
        // Tuy nhiên, việc kiểm tra hai chiều này là dư thừa nếu getCellLink được gọi đúng cách
        // chỉ cần một chiều là đủ vì đường đi là đối xứng trong game này
        // if (this.getCellLink(cell2.rowIndex, cell2.columnIndex, k) === cell1) {
        //     return true;
        // }
    }
    return false;
}
```

**3.3. `FindTwoCellCanSelect()` (Tìm gợi ý)**

*   **Mục đích:** Tìm một cặp ô hoạt động bất kỳ trên bảng có thể được ghép.
*   **Cách hoạt động:**
    1.  Lặp qua tất cả các ô trên bảng (ô `cell1`).
    2.  Với mỗi `cell1`, lặp qua tất cả các hướng `k`.
    3.  Tìm `cell2` bằng cách gọi `GetCellLink(cell1.rowIndex, cell1.columnIndex, k)`.
    4.  Nếu `cell2` tìm thấy và `CheckTwoCell(cell1, cell2)` trả về `true`, thì đã tìm thấy một cặp. Trả về `[cell1, cell2]`.
    5.  Nếu không tìm thấy cặp nào sau khi lặp qua tất cả các khả năng, trả về một mảng trống.

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private findTwoCellCanSelect(): CellNumber[] {
    const cells: CellNumber[] = [];
    for (let r1 = 0; r1 < this._rowNum; r1++) {
        for (let c1 = 0; c1 < this._columnNum; c1++) {
            const cell1 = this._table[r1][c1];
            if (!cell1 || !cell1.isActive) continue;

            for (let k = 0; k < this.directions.length; k++) {
                const cell2 = this.getCellLink(r1, c1, k);
                if (cell2 && this.checkTwoCell(cell1, cell2)) {
                    // Trả về cặp đầu tiên tìm thấy
                    cells.push(cell1);
                    cells.push(cell2);
                    return cells;
                }
            }
        }
    }
    return cells; // Không tìm thấy cặp nào
}
```

**3.4. `HintCell(cellHints: CellNumber[] | null)`**

*   **Mục đích:** Cung cấp gợi ý cho người chơi bằng cách đánh dấu một cặp ô có thể ghép.
*   **Cách hoạt động:**
    1.  Nếu `cellHints` được cung cấp, sử dụng cặp đó. Nếu không, gọi `FindTwoCellCanSelect()` để tìm một cặp.
    2.  Nếu không tìm thấy cặp nào, hiển thị thông báo "No More Matches" (sẽ cần một thông báo UI và hiệu ứng tương ứng trong Cocos Creator).
    3.  Nếu tìm thấy cặp:
        *   Tắt các gợi ý hiện có.
        *   Cuộn đến vị trí của các ô gợi ý nếu chúng không ở trong tầm nhìn.
        *   Kích hoạt hiệu ứng gợi ý (ví dụ: `setHint(true)`) cho cả hai ô.
        *   Kích hoạt hiệu ứng đường liên kết giữa hai ô (ví dụ: `_vfxAttachCell`).

**Triển khai trong `TableNumberController.ts`:**

```typescript
// Trong TableNumberController
private _cellHints: CellNumber[] = []; // Lưu trữ các ô đang được gợi ý

public async hintCell(manualCellHints: CellNumber[] | null): Promise<boolean> {
    await this.lockTable(true); // Khóa tương tác bảng

    let cellsToHint: CellNumber[] = [];
    if (manualCellHints && manualCellHints.length >= 2) {
        cellsToHint = manualCellHints;
    } else {
        cellsToHint = this.findTwoCellCanSelect();
    }

    if (cellsToHint.length < 2) {
        // Hiển thị VFX "No More Matches"
        console.warn("No more matches available!");
        // Gọi logic hiển thị UI/VFX tương ứng trong Cocos Creator
        await new Promise(resolve => this.scheduleOnce(resolve, 1)); // Chờ 1 giây cho VFX
        await this.lockTable(false);
        return false;
    }

    this.offHintCell(); // Tắt gợi ý cũ

    // Cuộn đến vị trí của các ô gợi ý nếu cần
    // (Cocos Creator: scrollToOffset, getScrollOffset, content.worldPosition, view.worldPosition)
    // Cần tính toán xem các ô có nằm trong tầm nhìn của ScrollView không
    // const scrollPromise = this.scrollIntoView(cellsToHint[0], cellsToHint[1]); // Hàm này cần được triển khai
    // await scrollPromise;
    await new Promise(resolve => this.scheduleOnce(resolve, 0.5)); // Chờ một chút sau scroll

    cellsToHint[0].setHint(true);
    cellsToHint[1].setHint(true);

    // Kích hoạt VFX đường liên kết (nếu có)
    // this.playVfxAttachCell(this.vfxAttachCell, this.getIndexByCell(cellsToHint[0]), this.getIndexByCell(cellsToHint[1]));

    // Hiệu ứng "pop-in" cho hintBg
    // tween(cellsToHint[0].hintBg.node).to(0.3, { scale: new Vec3(1,1,1) }, { easing: 'backOut' }).start();
    // tween(cellsToHint[1].hintBg.node).to(0.3, { scale: new Vec3(1,1,1) }, { easing: 'backOut' }).start();

    this._cellHints.push(cellsToHint[0], cellsToHint[1]);

    await new Promise(resolve => this.scheduleOnce(resolve, 0.5)); // Chờ hiệu ứng hint hoàn tất

    await this.lockTable(false);
    return true;
}

private offHintCell() {
    if (this._cellHints.length === 2) {
        this._cellHints[0].setHint(false);
        this._cellHints[1].setHint(false);
        this._cellHints.length = 0;
        // Tắt VFX đường liên kết nếu có
        // this.vfxAttachCell.stop();
    }
}
```

---

### 4. Xử lý Tương tác (Cell Selection & Click)

Khi người chơi click vào các ô.

**`OnCellClicked(clickedCell: CellNumber)`**

*   **Mục đích:** Xử lý logic khi người chơi chọn một ô.
*   **Cách hoạt động:**
    1.  Nếu ô `clickedCell` không hoạt động, bỏ qua.
    2.  Nếu đã có ô `_selectedCell` và `_selectedCell` là chính `clickedCell`: Bỏ chọn ô đó.
    3.  Nếu đã có `_selectedCell` và `checkTwoCellHint(_selectedCell, clickedCell)` trả về `true`: Xử lý ghép cặp (`handleTwoCellSelected`).
    4.  Nếu không thỏa mãn các điều kiện trên: Chọn `clickedCell` làm `_selectedCell` mới.


Dựa vào nội dung các file mã nguồn, game này có các hệ thống chính sau:

1.  **Hệ thống Gameplay và Quản lý Bảng chơi (Core Gameplay & Board Management):**
    *   Đây là trái tim của game, được quản lý chủ yếu bởi `TableNumberController.cs`.
    *   **Chức năng:** Tạo và quản lý lưới các con số. Xử lý logic cốt lõi là tìm và ghép các cặp số (cặp số giống nhau hoặc có tổng bằng 10). Nó cũng định nghĩa các quy tắc ghép nối hợp lệ (ví dụ: nằm cạnh nhau, hoặc không có số nào khác ở giữa).
    *   Hệ thống này cũng chịu trách nhiệm xóa các ô số đã ghép, kiểm tra và xóa các hàng trống để dồn bảng chơi lên, và tính điểm cho mỗi lần ghép.

2.  **Hệ thống Luồng chơi và Trạng thái (Game Flow & State):**
    *   Được điều khiển bởi `NumberMatchGamePlayLogic.cs`.
    *   **Chức năng:** Quản lý toàn bộ vòng đời của một màn chơi. Bắt đầu màn chơi mới, xử lý các điều kiện thắng/thua, và hiển thị các popup tương ứng (hoàn thành màn, thua cuộc, v.v.). Nó cũng quản lý việc chuyển qua màn mới hoặc bắt đầu lại một vòng chơi mới.

3.  **Hệ thống Giao diện người dùng (UI & Popups):**
    *   Bao gồm nhiều file kịch bản khác nhau, mỗi file quản lý một cửa sổ (popup) hoặc một phần của giao diện.
    *   **Chức năng:**
        *   Hiển thị thông tin trong game như điểm số, màn chơi, điểm cao nhất (`StageUIInfo.cs`).
        *   Hiển thị các popup thông báo kết quả khi kết thúc màn chơi (`IngameStageCompleteModal`, `IngameStageEndModal`, `IngameChallengeCompleteModal`).
        *   Quản lý cửa sổ cài đặt trong game (nhạc, âm thanh, rung) (`IngameSettingModal`).
        *   Hiển thị các thông báo nhanh như "Điểm cao mới!", "Không còn nước đi" (`IngameInform.cs`).

4.  **Hệ thống Hướng dẫn chơi (Tutorial):**
    *   Được quản lý bởi `HowToPlayModal.cs`.
    *   **Chức năng:** Hướng dẫn người chơi mới các cơ chế cơ bản của game một cách tuần tự. Nó sẽ khóa các tính năng không liên quan và chỉ cho phép người chơi tương tác với các ô số được chỉ định để hoàn thành hướng dẫn.

5.  **Hệ thống Vật phẩm hỗ trợ (Boosters/Power-ups):**
    *   Bao gồm các nút chức năng giúp người chơi.
    *   **Gợi ý (Hint):** Cho phép người chơi tìm một cặp số có thể ghép. Người chơi có thể xem quảng cáo để nhận thêm lượt gợi ý (`ButtonHintNumber.cs`).
    *   **Thêm số (Plus):** Thêm lại các số hiện có trên bảng xuống dưới cùng, tạo thêm cơ hội ghép cặp (`ButtonPlusNumber.cs`).

6.  **Hệ thống Hiệu ứng hình ảnh (VFX):**
    *   Quản lý các hiệu ứng đồ họa để tăng trải nghiệm người chơi (`Effect/` folder).
    *   **Chức năng:** Tạo hiệu ứng khi ghép số, xóa hàng, các đường nối giữa hai số được chọn, hiệu ứng cho vật phẩm hỗ trợ, v.v.

7.  **Hệ thống Quản lý Dữ liệu (Data Management):**
    *   Sử dụng các `DataAsset` (ScriptableObject trong Unity) để lưu trữ trạng thái game.
    *   `RoundDataAsset`: Lưu dữ liệu của vòng chơi hiện tại (các số trên bảng, điểm, màn chơi...).
    *   `NumberMatchHomeDataAsset`: Lưu dữ liệu tổng quát của người chơi (tiến trình, đã hoàn thành hướng dẫn chưa, số lượt gợi ý...).
    *   `SettingDataAsset`: Lưu cài đặt của người chơi.

8.  **Hệ thống Sự kiện (Messaging/Event System):**
    *   Sử dụng thư viện `SuperMaxim.Messaging` để các hệ thống khác nhau có thể giao tiếp với nhau một cách độc lập mà không cần tham chiếu trực tiếp. Ví dụ, khi một cặp số được xóa, `TableNumberController` sẽ "phát" một sự kiện, và `StageUIInfo` sẽ "nghe" sự kiện đó để cập nhật lại giao diện điểm số.
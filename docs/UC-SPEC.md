# UC-SPEC — Đặc tả Use Case theo CODE (WDP301 · Hotel Management System)

> Tài liệu này **hoàn thiện lại UC dựa trên code thực tế** (docs cũ soạn trước khi code nên còn thiếu/sai lệch).
> Dùng kèm bản test `HMS_SystemTesting_MaiQuoc.xlsx` (mỗi UC ↔ nhóm test case `UCxx_TCy`).

## Quy ước đánh số (đã hợp nhất)
Sơ đồ số cũ trong repo có 2 hệ (comment code `UC-26→82` khác file test `UC01–UC68`). Bản này dùng **theo dải role**, giữ nguyên các ID đã có trong file test:

| Dải | Role |
|---|---|
| UC01–UC14 | Guest / Auth (dùng chung) |
| UC15–UC30 | Customer |
| UC31–UC45 | Housekeeper |
| UC46–UC80 | Receptionist (giữ UC54–UC68 đã có; mở rộng UC69–UC75) |
| UC81–UC90 | Branch Manager |
| UC91–UC110 | Super Admin |

Trạng thái booking (nguồn sự thật: `bookingModel.js`): `pending → confirmed → checked_in → checked_out → completed`; nhánh `cancelled` / `no_show`. Chuyển trạng thái qua `bookingService.transition` (bảng `ALLOWED_TRANSITIONS`).

---

## 0. Guest / Auth (UC01–UC14)
*Nguồn: `authService.js`, `publicController.js`, `contactService.js`*

- **UC01 — Đăng ký + xác thực OTP.** Tạo `Account(role=customer, isVerified=false)`; gửi OTP (SMTP nếu có `EMAIL_HOST`, không thì log DEV). BR: email unique; OTP có hạn `OTP_TTL_MINUTES`; sai quá số lần → `lockedUntil` khoá tạm.
- **UC02 — Đăng nhập (local + Google).** BR quan trọng: chặn khi `!account.isActive` ("Tài khoản đã bị khoá") **và** khi staff thuộc chi nhánh khoá ("Chi nhánh của bạn đang tạm ngừng hoạt động"). 2 điều kiện **độc lập** (xem UC97/UC98).
- **UC03 — Quên / đặt lại mật khẩu.** Thông báo trung tính (không lộ email tồn tại).
- **UC10 — Trang chủ** (`/home-data`): phòng nổi bật + ẩm thực + đánh giá.
- **UC11 — Tìm phòng trống** (`/rooms/available` → `searchAvailableRooms`). BR: overlap theo giờ khách sạn (nhận 14:00 / trả 12:00); Phương án B (luôn tìm được, vượt sức chứa → phụ phí giường phụ). **Regression bắt buộc:** khoảng ngày dài (2–3 tuần+) phải nhanh, không timeout — giá đã đổi sang nạp `RoomPrice` 1 lần + tính 1 lần/loại phòng.
- **UC12 — Chi tiết loại phòng.**
- **UC13 — Gửi Liên hệ** (`POST /public/contact`): lưu `ContactMessage` + thông báo realtime cho lễ tân & QL **của chi nhánh được chọn** (`notifyReceptionists`+`notifyManagers`). BR: bắt buộc chọn chi nhánh, validate email.

---

## 1. Customer (UC15–UC30)
*Nguồn: `customerController.js`, `bookingService.js`, `payosService.js`*

- **UC15 — Đặt 1 phòng online.** Mọi lần đặt đều bọc trong **1 BookingGroup** (kể cả 1 phòng) để nhất quán. Tạo booking `pending` + `HoldRoom` + `expiresAt`.
- **UC16 — Thanh toán PayOS (deposit/full/remaining).** Webhook `applyPaidPayment` → `confirmDeposit`; polling `syncBookingPayments` fallback khi webhook không tới localhost.
- **UC17 — Lịch sử đặt phòng theo NHÓM** (`getBookingGroupHistory`): mỗi lần đặt = 1 thẻ; nhãn "N phòng".
- **UC21 — Đặt NHIỀU phòng online (giỏ).** `quoteGroupOnline` + `createGroupOnline`. Khách chọn **loại + số lượng** (trộn nhiều loại), hệ thống **tự chia khách** (`autoAllocate`: mỗi phòng ≥1 người lớn, rải tối thiểu phụ phí) + **tự gán phòng trống**. BR: `số phòng ≤ số người lớn` (chặn); thiếu sức chứa → phụ phí giường phụ (cho đặt + cảnh báo trước).
- **UC22 — Cọc GOM cả nhóm** (`createGroupQR` → `applyPaidGroupPayment` → `confirmGroupDeposit`): 1 QR = tổng cọc; trả xong tất cả phòng `confirmed`, xoá `HoldRoom`. Quá hạn → `expirePendingBookings` huỷ cả nhóm.
- **UC23 — Banner "chi nhánh tạm ngừng"** trên trang đơn (suy từ `branch.isActive`).

---

## 2. Housekeeper (UC31–UC45)
*Nguồn: `housekeepingService.js`*

- **UC31 — DS task được giao** (scope theo chi nhánh + tầng phụ trách).
- **UC32 — Bắt đầu task** (`start`). BR: phải hoàn thành task được giao **sớm hơn** trước.
- **UC33 — Kiểm kê thiết bị** (`saveAmenityReport`). Cập nhật tồn kho phòng; **reconcile bill**: thiếu → cộng dòng đền vào booking (confirmed/checked_in), đủ lại → gỡ. **Realtime:** bắn `booking_updated` để lễ tân đang checkout tự cập nhật (không reload).
- **UC34 — Hoàn tất task** (`complete`). Turnover: đủ đồ → phòng `available`; thiếu → `awaitingRestock=true` (chưa mở bán) + báo QL. BR: chưa kiểm kê thì không hoàn tất được. Inspection xong → báo lễ tân yêu cầu + `booking_updated`.
- **UC35 — Báo sự cố** (`reportIssue`): tạo `RoomIssue(open)` chờ QL duyệt; **không** tự chuyển phòng sang maintenance; chặn báo trùng.
- **UC36 — Báo đã sửa** phòng bảo trì (`fix_requested`).

---

## 3. Receptionist (UC54–UC75)
*Nguồn: `receptionService.js`, `bookingService.js`*

- **UC54 — Lịch/timeline phòng.**
- **UC55 — Walk-in tạo booking** (1 hoặc nhiều phòng) — luôn qua `createGroup` (1 mã, 1 cọc). Phân bổ khách từng phòng, báo giá nhóm realtime.
- **UC56 — Danh sách booking theo NHÓM** (rollup trạng thái/tiền) + **realtime** (`booking_updated`/`new_booking`, debounce).
- **UC57 — Cập nhật booking** (số khách/tên/SĐT/ghi chú); đổi số khách → tính lại phụ phí giường phụ.
- **UC59 — Giao dịch** (scope chi nhánh).
- **UC62 — Bill:** thêm/xoá dịch vụ (+ toggle đã giao, không đổi tiền); ghi thiết bị thiếu (đền bù).
- **UC63 — Đổi trạng thái vòng đời:** check-in (phòng `available`→`occupied`, tự áp phụ phí giường phụ) · check-out (thu remaining, phòng→`cleaning`, sinh task turnover giao housekeeper) · complete (chặn nếu chưa paid đủ) · cancel (giữ cọc) · no-show (chỉ khi confirmed + đã tới ngày).
- **UC64 — QR PayOS** thu cọc / thu tiền còn lại (lễ tân).
- **UC69 — Thu cọc GOM nhóm** (tiền mặt / toàn bộ) → tất cả phòng pending `confirmed`.
- **UC70 — Nhận sớm (early check-in) — 2 lớp bảo vệ + trần 3h.** `setEarlyCheckin`:
  - (a) **Cổng thời gian:** chỉ cho khi hiện tại còn ≤ **4 giờ** tới giờ nhận chuẩn (14:00).
  - (b) **Kẹp theo booking liền trước cùng phòng:** giờ đến sớm nhất không được lấn giờ trả của khách trước (bảo vệ khách ngày trước) — soi gương `setLateCheckout`.
  - Trần **3 giờ**; phòng phải `available`; phí giờ = 10% giá đêm/giờ.
- **UC71 — Trả muộn (late check-out).** Kẹp theo booking kế tiếp cùng phòng; vượt mốc 18:00 → tính 1 đêm.
- **UC72 — Phụ phí giường phụ** bật/tắt (tính lại bill + cọc pending).
- **UC73 — Đổi phòng in-house** (cùng chi nhánh + cùng loại; phòng cũ→cleaning, mới→occupied).
- **UC74 — Yêu cầu Housekeeping** (kiểm tra/dọn giữa kỳ) + xem trạng thái; bill/kiểm tra cập nhật **realtime**.
- **UC75 — Hộp thư Liên hệ** (scope chi nhánh): xem, trả lời thủ công qua email (mailto điền sẵn), **đánh dấu đã xử lý** (ghi người + thời điểm).

---

## 4. Branch Manager (UC81–UC90)
*Nguồn: `managerService.js`* — mọi hàm scope theo `req.branchId` (middleware `getBranchManagerBranch`).

- **UC81 — Loại phòng** (CRUD + đổi trạng thái). **UC82 — Giá phòng** (khoảng ngày + giá lặp weekday/weekend; khoảng bắt đầu muộn nhất thắng; ngoài khoảng → `basePrice`). **UC83 — Phòng vật lý** (CRUD, số phòng unique/chi nhánh, ngừng = soft delete). **UC84 — Tiện nghi + số chuẩn kiểm kê** (dùng cho `expected` khi housekeeper kiểm kê). **UC85 — Sự cố/bảo trì** (duyệt → phòng maintenance; xác nhận sửa → available). **UC86 — Giao việc + đánh dấu khẩn housekeeping.** **UC87 — Phân tầng** cho housekeeper. **UC88 — Bổ sung thiết bị** (đủ chuẩn → mở bán lại phòng). **UC89 — Hộp thư Liên hệ** chi nhánh.

---

## 5. Super Admin (UC91–UC105)
*Nguồn: `adminService.js`*

- **UC91 — Chi nhánh** (tạo/sửa).
- **UC92 — Nhân sự & tài khoản** (tạo staff + `RoleAssignment`, đổi role đồng bộ, gán/gỡ chi nhánh).
- **UC97 — KHOÁ / MỞ chi nhánh (2 cờ độc lập — nghiệp vụ trọng tâm).** `toggleBranchActive` chỉ đổi `Branch.isActive`, **không** đụng `Account.isActive`. Quyền vào = `account.isActive` **AND** chi nhánh active (kiểm tra ở `protect` mỗi request + `login`). Khoá → **force_logout** nhân viên online ngay. **Mở lại chỉ khôi phục người chưa bị khoá riêng**; ai đã bị khoá tài khoản trước đó vẫn bị chặn (do cờ tài khoản của họ vẫn `false`).
- **UC98 — Khoá / mở tài khoản** (`toggleAccountActive`): khoá → force_logout + chặn đăng nhập ("Tài khoản đã bị khoá"); độc lập với chi nhánh.
- **UC99 — Đổi role** (đồng bộ `RoleAssignment`). **UC100 — Dashboard** tổng + theo chi nhánh. **UC101 — Thư viện ảnh** (upload/sửa/xoá).

---

## Nghiệp vụ xuyên suốt (cross-cutting) — cần test kèm
1. **Realtime `booking_updated`** (socket): phát ở `transition` + kiểm kê/hoàn tất housekeeping → cập nhật `BookingDetailPage`, `GroupDetailPage`, `BookingsPage`, `RoomsPage` không reload tay.
2. **2 cờ khoá độc lập** (UC02/UC97/UC98): `protect` tra DB mỗi request nên khoá có hiệu lực **ngay** (không đợi token hết hạn); FE interceptor 401 + code `ACCOUNT_LOCKED`/`BRANCH_LOCKED` → về `/login?locked=...`.
3. **Hiệu năng đặt dài** (UC11/UC21): `computeRoomCharge` nạp giá 1 lần + `searchAvailableRooms` tính 1 lần/loại phòng — khoảng dài không timeout.
4. **Mô hình nhóm** (UC15/UC21/UC55): mỗi lần đặt = 1 BookingGroup + N Booking; mỗi phòng vòng đời độc lập, group gom nhận dạng + tiền (1 mã, 1 cọc).

# HBMS — Status & Workflow Spec (chuẩn cuối)

> Nguồn chuẩn: **`WDP_Report_Final.docx`** (UC-01→82 + 17 bảng DB + BR-01→50).
> Mượn thêm từ `Hotel_Booking_System_Dev_Doc_V2.docx` 2 thứ: task **`missed`** và cơ chế **`HoldRoom`/expiry**.
> Tài liệu này là nguồn sự thật cho mọi enum status; khi code khác doc → sửa code theo doc này.
> Quy ước code: enum dùng **lowercase snake_case** (khớp scaffold hiện tại). Liên quan: [[TASK_DIVISION]].

---

## 0. Bảng tổng hợp enum (tra nhanh)

| Entity.field | Giá trị (code) | Chủ sở hữu |
|---|---|---|
| `Account.isVerified` / `isActive` | boolean / boolean (+ `lockedUntil`) | Khánh |
| `RoomType.status` | `active`, `inactive` | Hoàng |
| `RoomType.bedType` | `single`, `double`, `twin`, `king` | Hoàng |
| `Room.status` | `available`, `occupied`, `cleaning`, `maintenance`, `locked` | Hoàng |
| `RoomAmenity.condition` | `active`, `broken`, `missing` | Hoàng |
| `Service.status` | `active`, `inactive` | Hoàng |
| `Booking.status` | `pending`, `confirmed`, `checked_in`, `checked_out`, `completed`, `cancelled`, `no_show` | **Quốc** |
| `Booking.paymentStatus` | `unpaid`, `partial`, `paid` | **Quốc** |
| `Payment.type` | `deposit`, `remaining` | Quốc |
| `Payment.method` | `online_qr`, `cash`, `bank_transfer` | Quốc |
| `Payment.status` | `pending`, `paid`, `failed`, `expired` | Quốc |
| `HousekeepingTask.status` | `pending`, `in_progress`, `urgent`, `completed`, `missed` | Tú |

---

## 1. Account (Khánh)
Giữ 2 boolean thay cho enum status (đầy đủ hơn report_final vốn chỉ có UNVERIFIED/VERIFIED):
- `isVerified`: `false` = chưa xác thực OTP (không được login — BR-05), `true` = đã xác thực.
- `isActive`: `false` = bị Super Admin khoá/disable (BR-36).
- `lockedUntil`: khoá tạm 15' sau 5 lần sai OTP (BR, UC-02).
- `authProvider`: `local` | `google`. ⚠️ Google login chỉ nhận **email FPT** (MSG01).

---

## 2. Room.status (Hoàng)
Bỏ `reserved` của Dev_Doc_V2 — tình trạng "đã đặt" suy ra **từ booking** (mục 6.1), tránh 2 nguồn sự thật.

| Status | Ý nghĩa | Ai set |
|---|---|---|
| `available` | Sẵn sàng cho thuê | System (HK complete), Manager |
| `occupied` | Khách đang ở | System (check-in) |
| `cleaning` | Chờ dọn (vẫn **bookable**) | System (check-out) |
| `maintenance` | Bảo trì / báo lỗi (BR-43) | Manager, Receptionist, System |
| `locked` | Tạm khoá (BR-19 "Temporarily Locked") | Manager |

Chuyển: `available → occupied/maintenance/locked` · `occupied → cleaning` · `cleaning → available` (HK complete, BR-44) · `maintenance/locked → available`.
📌 Khách check-in vào phòng `cleaning` → task của HK tự thành `missed` (mục 7).

---

## 3. Booking.status (Quốc) — TRỌNG TÂM

Theo BR-22 (đúng 7 trạng thái; **không** có `expired`/`transferred` như Dev_Doc_V2).

```
            ┌────────────► cancelled  (hủy trước check-in / hold hết hạn)
            │
  (tạo) ─► pending ─► confirmed ─► checked_in ─► checked_out ─► completed
                          │
                          └────────► no_show  (quá ngày check-in, giữ cọc)
```

| Status | Ý nghĩa | Trigger |
|---|---|---|
| `pending` | Đã tạo, chờ cọc (có `HoldRoom` giữ phòng) | Customer đặt online; hoặc walk-in chưa thu cọc |
| `confirmed` | Đã cọc, hợp lệ | Webhook PayOS thành công **hoặc** Receptionist xác nhận thu cọc tại quầy |
| `checked_in` | Khách đang ở | Receptionist check-in (gán `roomId`) — phải đang `confirmed` |
| `checked_out` | Đã trả phòng, đã thu `remaining` | Receptionist check-out |
| `completed` | Đóng booking, không sửa được nữa (BR-28) | Receptionist bấm **"Complete"** (BR-27) sau khi `paymentStatus = paid` |
| `cancelled` | Bị hủy (cọc **không hoàn** nếu đã confirmed) | Customer/Receptionist hủy khi chưa check-in; **hoặc** cron tự hủy khi `HoldRoom` hết hạn (ghi `cancelReason`) |
| `no_show` | Khách không đến, giữ cọc | Receptionist mark thủ công khi `confirmed` & quá ngày check-in |

**Quy tắc:** BR-23 chống trùng lịch (`newCheckIn < existCheckOut AND newCheckOut > existCheckIn`) chỉ tính booking `pending/confirmed/checked_in`. · BR-29: **mọi đổi status phải ghi log** → cần bảng `BookingStatusHistory`. · BR-26: tính theo số đêm. · BR-24/25: bắt buộc CCCD khi đặt.

---

## 4. Booking.paymentStatus (Quốc)
Theo BR-33 (`Unpaid, Partial, Paid`):
- `unpaid`: chưa trả gì.
- `partial`: đã thu cọc (deposit) → set khi booking `confirmed`.
- `paid`: đã thu đủ remaining → set khi `checked_out`.

---

## 5. Payment (Quốc)
- `type`: `deposit` (cọc online) | `remaining` (thu tại quầy lúc checkout).
- `method`: `online_qr` (PayOS/VietQR) | `cash` | `bank_transfer`.
- `status`: `pending` → `paid` (webhook/được xác nhận) | `failed` | `expired` (link QR hết hạn).
- ❌ Không có `refund` — BR: hủy sau confirmed **không hoàn cọc**.
- Webhook idempotent: `pending`→`paid` 1 lần (đã `paid` thì trả 200 ngay).

---

## 6. HoldRoom & cơ chế giữ phòng (Quốc)
report_final tách **HoldRoom** riêng (không nhét `expired` vào Booking):
- Khi customer bắt đầu đặt online → tạo `HoldRoom` giữ phòng, `expiresAt = now + branch.pendingTimeoutMinutes`.
- TTL index tự xoá khi hết hạn; cron/logic nhả phòng. Nếu hết hạn mà chưa cọc → booking `pending` → `cancelled` (reason = `payment_timeout`).

---

## 7. HousekeepingTask.status (Tú)
Giữ `missed` của Dev_Doc_V2 (BR-39 quên nhưng BR-46/47 + UC-82 cần "miss rate"). Dùng `assignedTo` cho việc giao (null = chưa ai nhận), **không** dùng status `unassigned/claimed`.

| Status | Ý nghĩa | Trigger |
|---|---|---|
| `pending` | Mới tạo, chờ nhận | Tự động khi Booking → `checked_in` |
| `in_progress` | HK đang làm | HK **claim & start** (BR-38) → set `assignedTo`, `startedAt` |
| `urgent` | Khách đã checkout, phòng cần dọn gấp mà chưa xong | System khi Booking → `checked_out` mà task chưa `completed` |
| `completed` | Xong → Room tự `available` | HK bấm "Hoàn thành" → `completedAt` |
| `missed` | Khách mới check-in trước khi dọn xong | System khi có Booking `checked_in` mới cho phòng đó → Room `occupied` |

BR-41/42: HK tick thiết bị thiếu + số lượng → ghi vào `Booking` (cộng `extraCharges`/bill). BR-40: chỉ làm task thuộc branch mình.

---

## 8. RoomAmenity.condition (Hoàng)
Theo BR-16: `active` (tốt) | `broken` (hỏng) | `missing` (thiếu). Nếu `broken`/`missing` phải kèm ghi chú. BR-17: không trùng amenity trong cùng 1 phòng.

---

## 9. Quy tắc nghiệp vụ liên quan workflow (tối ưu so với Dev_Doc_V2)

1. **Giá động (RoomPrices)** — total = Σ theo từng đêm của giá (thường/cuối tuần/lễ) trừ discount. *Không* dùng `basePrice` phẳng × số đêm.
2. **Tỉ lệ cọc theo branch** — `depositAmount = branch.depositRate × totalAmount` (BR + Branch.depositRate). *Không* cứng 30%.
3. **Room Transfer = in-house** (UC-37, BR-27) — đổi phòng **khi khách đang `checked_in`**: gán lại `roomId` trên *cùng* booking, phòng cũ → `cleaning`/`available`. KHÔNG tạo booking mới, KHÔNG cần status `transferred`.
4. **Credit balance (BR-34)** — Branch Manager áp credit từ booking trước vào `remaining` lúc check-out.
5. **Log status (BR-29)** — thêm `BookingStatusHistory` { booking, from, to, by, at, note }.
6. **Timestamps (BR-49)** — mọi bảng có `createdAt`/`updatedAt` (Mongoose `timestamps: true`).

---

## 10. Việc cần sửa trong model scaffold hiện tại

| Model | Sửa |
|---|---|
| `bookingModel` | ✅ status đã khớp report_final; **thêm** `paymentStatus(unpaid/partial/paid)`, `creditApplied`; (tuỳ) bỏ field thừa. Thêm bảng `BookingStatusHistory` |
| `paymentModel` | `type` bỏ `refund`; `method` → `online_qr/cash/bank_transfer`; `status` → `pending/paid/failed/expired` |
| `housekeepingTaskModel` | status → `pending/in_progress/urgent/completed/missed`; bỏ `unassigned/claimed`; bỏ field `type` |
| `roomModel` | status → `available/occupied/cleaning/maintenance/locked` (bỏ ý định thêm `reserved`) |
| `roomAmenityModel` | condition → `active/broken/missing` |
| `roomTypeModel` | thêm enum `bedType: single/double/twin/king` |
| `roomPriceModel` | đảm bảo đủ field cho giá động (date, dayType, price, discount) — đã có |

---

## 11. ❓ Điểm cần cả nhóm xác nhận (mâu thuẫn trong report_final)
1. **Trigger `completed`**: đề xuất = action "Complete" của Receptionist sau khi `paymentStatus = paid` (theo BR-27/28). Cần chốt.
2. **`missed`**: BR-39 thiếu nhưng UC-82 + BR-46/47 cần → **giữ `missed`**. Xác nhận.
3. **Bỏ `expired`/`transferred`** của Dev_Doc_V2 (thay bằng `cancelled`+reason và in-house transfer). Xác nhận.

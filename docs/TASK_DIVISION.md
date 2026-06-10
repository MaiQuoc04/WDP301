# HBMS — Phân công công việc & Quy ước chống conflict

> Hotel Booking Management System (HBMS) — nhóm 5 người. Stack: **MERN**
> (MongoDB + Mongoose, Express, React + Vite + Redux Toolkit + React Router + Axios).
> Tài liệu nguồn: `WDP_Report_Final.docx` — 6 actor, 82 use case (UC-01→82), 17 bảng DB.

---

## 1. Nguyên tắc chia việc

Trục chính: **chia theo role/actor (vertical slice)** — mỗi người làm trọn module của role
mình đã vẽ UC (model → API → UI), giữ được tri thức nghiệp vụ.
Bổ sung 2 lớp chống conflict: **Sprint 0 nền tảng** + **"1 file = 1 chủ sở hữu"**.

### Map role → người

| Role (đã vẽ UC) | Người | UC |
|---|---|---|
| Receptionist | **Quốc** (PM/Tech-lead, + Sprint 0) | UC-26→43 |
| Guest + Customer (+ auth customer) | **Khánh** | UC-01→25 |
| Housekeeper | **Tú** | UC-44→55 |
| Branch Manager | **Hoàng** | UC-56→70 |
| Super Admin | **Sáng** | UC-71→82 |

---

## 2. Sprint 0 — Nền tảng (Quốc làm trước, merge `main` rồi cả nhóm mới nhánh ra)

Mục tiêu: tạo sẵn mọi "file đông người đụng" **đúng 1 lần** để về sau không ai phải sửa.

- [x] 17 model Mongoose (`backend/src/models/`) — schema thống nhất, chốt enum chung.
- [x] `routes/index.js` pre-wire 7 prefix → mỗi prefix trỏ 1 file route placeholder.
- [x] `middlewares/authMiddleware.js` — thêm `authorize(...roles)` (thay cho `adminOnly`).
- [x] FE: `store.js` import sẵn 6 slice; `AppRoutes.jsx` + `ProtectedRoute` theo role;
      `apiEndpoints.js` khung 7 nhóm; `services/index.js` export sẵn 6 service.
- [ ] **Auth lõi cần Quốc hoàn thiện:** migrate `authService`/`authController` từ
      `userModel.js` (legacy) sang `accountModel.js`; nhét `role` vào JWT payload để
      `authorize()` hoạt động; dựng OTP/email + Google OAuth khung.
- [ ] Seed data + biến môi trường (`.env`).

> ✅ = đã scaffold sẵn trong repo. ☐ = việc còn lại của Sprint 0.

---

## 3. Ba quy tắc vàng chống merge-conflict

1. **Chỉ tạo file mới trong vùng của mình.** Không sửa file người khác.
2. **Sau Sprint 0 KHÔNG sửa các file trung tâm đã pre-wire:** `routes/index.js`,
   `redux/store/store.js`, `AppRoutes.jsx`, `services/index.js`, `apiEndpoints.js`.
   Cần thêm route/endpoint mới → thêm trong **file của module mình**.
3. **Đọc model người khác thoải mái** (query trong service/controller của *chính bạn*).
   **Ghi/đổi logic nghiệp vụ của entity người khác → gọi service do chủ sở hữu cung cấp**,
   không tự sửa file của họ.

---

## 4. Bảng chủ sở hữu (1 file = 1 người được commit)

| Cụm dữ liệu | Model (file) | Chủ sở hữu | Code BE | Code FE |
|---|---|---|---|---|
| Account, Customer, Review | `account/customer/review Model` | **Khánh** | `public*`, `customer*`, `review*` | `pages/{home,customer}/*`, `customerSlice` |
| Booking, Payment, HoldRoom | `booking/payment/holdRoom Model` | **Quốc** | `reception*`, `bookingService` | `pages/reception/*`, `bookingSlice` |
| RoomType, RoomPrice, Room, Amenity, RoomAmenity, Service | `room*/amenity*/service Model` | **Hoàng** | `manager*` | `pages/manager/*`, `roomSlice` |
| HousekeepingTask | `housekeepingTaskModel` | **Tú** | `housekeeping*`, `housekeepingService` | `pages/housekeeping/*`, `taskSlice` |
| Branch, Employee, Role, Role_Assignment | `branch/employee/role/roleAssignment Model` | **Sáng** | `admin*` | `pages/admin/*`, `adminSlice` |

> Models do nhiều người **đọc** nhưng **ổn định sau Sprint 0**. Đổi schema của entity
> không thuộc cụm của bạn → báo chủ sở hữu, không tự sửa.

---

## 5. Ba "hợp đồng interface" liên-module (chốt ngay đầu, để 2 người không chờ nhau)

| Hợp đồng | Người định nghĩa | Người gọi |
|---|---|---|
| `bookingService.create(payload)` + enum `Booking.status` | **Quốc** | Khánh (đặt phòng online) |
| `housekeepingService.createOnCheckIn(bookingId, roomId)` | **Tú** | Quốc (check-in tự sinh task) |
| Cách amenity-thiếu cộng vào Bill (`Booking.missingAmenities`) | **Quốc** (định nghĩa field) | Tú (chỉ ghi) |

`Booking.status` (đã đặt trong `bookingModel.js`):
`pending → confirmed → checked_in → checked_out → completed`, nhánh phụ `cancelled`, `no_show`.

---

## 6. Phân công chi tiết theo người

### Quốc — Sprint 0 + Receptionist (UC-26→43)
Walk-in booking, **check-in/check-out**, tab Bill + extra service (UC-32/34),
tick amenity thiếu (UC-33), cancel/no-show/room-transfer/update (UC-35→38),
**Room Schedule/Timeline** (UC-39/40), danh sách & chi tiết giao dịch (UC-41/42), lịch sử (UC-43).
Sở hữu schema Booking/Payment/HoldRoom + `bookingService` lõi.

### Khánh — Guest + Customer (UC-01→25)
Public: Homepage, Hotel detail, Room list + **search phòng trống** (UC-15), Room detail, xem review.
Auth customer: Register + OTP (UC-01/02/06), Google OAuth (UC-04), Forgot password (UC-05).
Customer: **Tạo booking online + thanh toán PayOS/VietQR** (UC-17/18) — *gọi `bookingService.create`*,
lịch sử booking/bill/payment (UC-19→21), rating/feedback/react (UC-22→25).

### Tú — Housekeeper (UC-44→55)
List/detail/filter task (UC-44→46), **claim/start/complete** (UC-47/48/54),
check amenities + tick thiếu & số lượng + lưu report (UC-49→51), report sự cố phòng (UC-52),
mark maintenance (UC-53), lịch sử (UC-55). Cung cấp `housekeepingService.createOnCheckIn()`.

### Hoàng — Branch Manager (UC-56→70)
Branch dashboard/KPI (UC-56), CRUD RoomType (UC-57→59), CRUD Room (UC-60→62),
CRUD Amenity template (UC-63→65), CRUD Extra Service (UC-66→68),
monitor housekeeping (UC-69), review room issue (UC-70). Sở hữu toàn bộ catalog phòng/dịch vụ.

### Sáng — Super Admin (UC-71→82)
CRUD/deactivate Branch (UC-71→73), quản lý user + tạo staff + đổi role + gán staff vào branch +
deactivate account (UC-74→78), Enterprise dashboard (UC-79),
report doanh thu/occupancy/housekeeping-missed (UC-80→82) — *chỉ aggregate-read dữ liệu người khác*.

---

## 7. Quy ước Git

- Nhánh: `feat/be-<role>` và `feat/fe-<role>` (vd `feat/be-reception`, `feat/fe-customer`).
- Tách `main` **sau khi Sprint 0 đã merge**. Rebase/merge `main` thường xuyên.
- Commit nhỏ, message: `[<role>] <mô tả>` (vd `[reception] add check-in API`).
- PR review chéo trước khi merge vào `main`.

---

## 8. Quy trình merge & Definition of Done

### 8.1. "Chức năng nhỏ" là gì
1 chức năng nhỏ ≈ **một UC hoặc một lát cắt chạy được end-to-end**, KHÔNG phải cả module.
- ✅ Đúng cỡ: "API `GET /reception/bookings` trả list + hiện ra bảng".
- ❌ To quá: "toàn bộ Receptionist".
- Cỡ lý tưởng: vài giờ → 1-2 ngày công, **vài trăm dòng đổ lại**. Càng nhỏ càng dễ review, càng ít conflict.

### 8.2. Definition of Done (DoD) — tick đủ mới được merge
```
[ ] Chạy được: BE test Postman trả đúng response; FE bấm được, nối API thật
[ ] Không phá build: FE `npm run build` pass; BE `npm run dev` start không crash
[ ] Đúng phạm vi: chỉ đụng file thuộc vùng sở hữu của mình
[ ] Sạch: không còn console.log rác, không hardcode token/URL
[ ] Happy path + tối thiểu 1 case lỗi đã thử tay
[ ] Commit message rõ: [reception] add list bookings API
```

### 8.3. Khi nào merge vào `main`
Quy tắc tối thượng: **`main` luôn xanh** (lúc nào cũng chạy được).
- Merge **ngay khi một mẩu đạt DoD và tự đứng được** — "sớm và nhỏ" thắng "muộn và to".
- Merge mẩu self-contained (vd API backend chưa gắn nav vẫn an toàn vì chưa ai gọi).
- ❌ Đừng merge khi: build đỏ, chưa ai review, hoặc vội sát deadline.
- ❌ Đừng dồn 5 nhánh lại "merge một phát ở cuối" — phân kỳ xa = conflict nặng.

### 8.4. Các bước BẮT BUỘC trước khi mở PR
```bash
git checkout main && git pull        # lấy main mới nhất
git checkout feat/be-reception
git rebase main                      # đưa code mình lên trên main mới
# chạy lại test/build → xanh
git diff main --stat                 # KIỂM CHỨNG: mọi file đổi phải nằm trong vùng của mình
```
Nếu `git diff main --stat` lộ ra file trung tâm (`routes/index.js`, `store.js`, `AppRoutes.jsx`,
`services/index.js`, `apiEndpoints.js`) hoặc file người khác → **dừng lại, xem lại thiết kế**.

### 8.5. Làm sao không phải sửa code người khác
- **Ranh giới ghi = ownership.** Chỉ sửa file vùng mình. "Cần sửa file người khác" = tín hiệu thiết kế sai → dùng API/service contract thay vì sửa.
- **Phụ thuộc qua hợp đồng, không qua sửa.** Cần dữ liệu/logic module khác → gọi cái họ đã expose.
- **Khi hợp đồng buộc đổi** (hiếm): đổi đi qua chủ sở hữu → họ sửa file họ → merge `main` → người phụ thuộc `rebase` và chỉnh phía mình.
- **PR review** soi `diff` chặn việc lỡ đụng file ngoài vùng. PR đụng file trung tâm → bị chặn.

> Ví dụ: Khánh đặt phòng online → gọi `bookingService.create()` của Quốc, KHÔNG mở `bookingModel.js`.
> Thiếu field → nhắn Quốc thêm vào service của Quốc → merge `main` → Khánh `rebase`. Không ai sửa file của ai.

---

## 9. Bản đồ API (prefix theo module — đã pre-wire ở `routes/index.js`)

| Prefix | Module | Chủ |
|---|---|---|
| `/api/auth` | Đăng nhập/đăng ký (Sprint 0) | Quốc |
| `/api/public` | Guest (xem phòng, search, review) | Khánh |
| `/api/customer` | Customer (booking, payment, profile) | Khánh |
| `/api/reception` | Receptionist | Quốc |
| `/api/housekeeping` | Housekeeper | Tú |
| `/api/manager` | Branch Manager | Hoàng |
| `/api/admin` | Super Admin | Sáng |

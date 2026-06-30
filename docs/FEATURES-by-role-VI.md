# Thống kê chức năng theo Role — Hệ thống Quản lý Đặt phòng Khách sạn (WDP301)

> Hệ thống có **5 role** (`accountModel.js`): `customer`, `receptionist`, `housekeeper`, `branch_manager`, `super_admin`.
> Ngoài ra có nhóm **Guest** (khách chưa đăng nhập) và các chức năng **dùng chung** (Auth, Thông báo).

---

## 0. Guest — Khách vãng lai (chưa đăng nhập)
*Nguồn: `publicRoutes.js`, `authRoutes.js`*

| # | Chức năng | API |
|---|-----------|-----|
| 1 | Xem trang chủ / dữ liệu trang chủ | `GET /home-data` |
| 2 | Xem danh sách phòng | `GET /rooms` |
| 3 | Tìm phòng trống theo chi nhánh + ngày | `GET /rooms/available` |
| 4 | Xem chi tiết phòng | trang `/rooms/:id` |
| 5 | Xem danh sách chi nhánh | `GET /branches` |
| 6 | Xem thư viện ảnh / ẩm thực | `GET /gallery` |
| 7 | Xem trang tĩnh: Ẩm thực, Tiện ích, Thư viện, Liên hệ | FE static pages |
| 8 | Đăng ký tài khoản + xác thực OTP | `POST /register`, `/verify-otp`, `/resend-otp` |
| 9 | Đăng nhập (thường / Google) | `POST /login`, `/google` |
| 10 | Quên mật khẩu / đặt lại mật khẩu | `POST /forgot-password`, `/reset-password` |

---

## Dùng chung — mọi role đã đăng nhập
*Nguồn: `authRoutes.js`, `notificationRoutes.js`*

| # | Chức năng | API |
|---|-----------|-----|
| 1 | Đăng xuất | `POST /logout` |
| 2 | Xem thông tin tài khoản | `GET /me` |
| 3 | Đổi mật khẩu | `POST /change-password` |
| 4 | Xem danh sách thông báo | `GET /notifications` |
| 5 | Đếm thông báo chưa đọc | `GET /notifications/unread-count` |
| 6 | Đánh dấu 1 / tất cả đã đọc | `PATCH /notifications/:id/read`, `/read-all` |

---

## 1. Customer — Khách hàng
*Nguồn: `customerRoutes.js`*

| # | Chức năng | API |
|---|-----------|-----|
| 1 | Đặt phòng online (phải đăng nhập) | `POST /bookings` |
| 2 | Xem lịch sử đặt phòng | `GET /bookings` |
| 3 | Xem chi tiết booking | `GET /bookings/:id` |
| 4 | Tạo link thanh toán PayOS | `POST /bookings/:id/payos-link` |
| 5 | Nhận kết quả thanh toán (webhook PayOS) | `POST /payos-webhook` |
| 6 | Quản lý hồ sơ cá nhân | trang `/customer` |

---

## 2. Receptionist — Lễ tân
*Nguồn: `receptionRoutes.js`*

### Danh mục & đọc dữ liệu
| # | Chức năng | API |
|---|-----------|-----|
| 1 | Danh sách dịch vụ / tiện ích (dropdown bill) | `GET /services`, `/amenities` |
| 2 | Danh sách phòng + trạng thái | `GET /rooms` |
| 3 | Tìm phòng trống hợp số khách (walk-in) | `GET /rooms/available` |
| 4 | Danh sách + lọc booking | `GET /bookings` |
| 5 | Chi tiết booking | `GET /bookings/:id` |

### Vòng đời booking
| # | Chức năng | API |
|---|-----------|-----|
| 6 | Tạo booking walk-in | `POST /bookings` |
| 7 | Thu cọc → confirmed (tiền mặt) | `POST /bookings/:id/confirm-deposit` |
| 8 | Tạo QR PayOS thu cọc | `POST /bookings/:id/deposit-qr` |
| 9 | Check-in | `POST /bookings/:id/check-in` |
| 10 | Check-out (legacy / tiền mặt) | `POST /bookings/:id/check-out`, `/checkout-cash` |
| 11 | Tạo QR PayOS thu tiền còn lại | `POST /bookings/:id/checkout-qr` |
| 12 | Đồng bộ trạng thái thanh toán (polling) | `POST /bookings/:id/sync-payments` |
| 13 | Hoàn tất booking → completed | `POST /bookings/:id/complete` |
| 14 | Bật/tắt phụ phí giường phụ | `POST /bookings/:id/bed-surcharge` |
| 15 | Nhận sớm (early check-in) | `POST /bookings/:id/early-checkin` |
| 16 | Trả muộn (late check-out) | `POST /bookings/:id/late-checkout` |

### Hoá đơn (Bill) & Dịch vụ
| # | Chức năng | API |
|---|-----------|-----|
| 17 | Xem hoá đơn | `GET /bookings/:id/bill` |
| 18 | Thêm / xoá / toggle đã giao dịch vụ | `POST/DELETE/PATCH /bookings/:id/services` |
| 19 | Bảng triển khai dịch vụ theo phòng | `GET /service-board` |
| 20 | Thêm / xoá tiện ích thiếu (đền bù) | `POST/DELETE /bookings/:id/missing-amenities` |

### Phối hợp Housekeeping
| # | Chức năng | API |
|---|-----------|-----|
| 21 | Yêu cầu kiểm tra thiết bị phòng | `POST /bookings/:id/request-inspection` |
| 22 | Yêu cầu dọn phòng (giữa kỳ) | `POST /bookings/:id/request-cleaning` |
| 23 | Xem trạng thái + lịch sử housekeeping | `GET /bookings/:id/housekeeping` |
| 24 | Gợi ý housekeeper để giao việc | `GET /bookings/:id/housekeepers` |

### Huỷ / No-show / Đổi phòng
| # | Chức năng | API |
|---|-----------|-----|
| 25 | Huỷ booking trước check-in | `POST /bookings/:id/cancel` |
| 26 | Đánh dấu no-show (giữ cọc) | `POST /bookings/:id/no-show` |
| 27 | Đổi phòng cho khách in-house | `POST /bookings/:id/transfer` |
| 28 | Cập nhật booking | `PATCH /bookings/:id` |

### Dashboard & Giao dịch
| # | Chức năng | API |
|---|-----------|-----|
| 29 | Dashboard thông số trong ngày | `GET /dashboard` |
| 30 | Lịch / timeline phòng | `GET /schedule` |
| 31 | Danh sách + chi tiết giao dịch | `GET /transactions`, `/transactions/:id` |

---

## 3. Housekeeper — Nhân viên buồng phòng
*Nguồn: `housekeepingRoutes.js`*

| # | Chức năng | API |
|---|-----------|-----|
| 1 | Dashboard công việc | `GET /dashboard` |
| 2 | Danh sách công việc được giao | `GET /tasks` |
| 3 | Lịch sử công việc | `GET /history` |
| 4 | Chi tiết công việc | `GET /tasks/:id` |
| 5 | Bắt đầu công việc | `PATCH /tasks/:id/start` |
| 6 | Báo cáo kiểm kê tiện ích phòng | `PUT /tasks/:id/amenity-report` |
| 7 | Báo sự cố cần bảo trì (chờ QL duyệt) | `POST /tasks/:id/issues` |
| 8 | Hoàn tất công việc | `PATCH /tasks/:id/complete` |
| 9 | Danh sách phòng đang bảo trì / chờ xác nhận | `GET /maintenance` |
| 10 | Báo đã sửa xong | `PATCH /maintenance/:id/fixed` |

---

## 4. Branch Manager — Quản lý chi nhánh
*Nguồn: `managerRoutes.js`*

### Loại phòng (RoomType)
| # | Chức năng | API |
|---|-----------|-----|
| 1 | Xem / chi tiết / options loại phòng | `GET /room-types`, `/:id`, `/options` |
| 2 | Tạo / sửa loại phòng | `POST`, `PUT /room-types/:id` |
| 3 | Đổi trạng thái loại phòng | `PATCH /room-types/:id/status` |

### Phòng (Room)
| # | Chức năng | API |
|---|-----------|-----|
| 4 | Xem / chi tiết phòng | `GET /rooms`, `/rooms/:id` |
| 5 | Tạo / sửa phòng | `POST`, `PUT /rooms/:id` |
| 6 | Đổi trạng thái / ngừng hoạt động phòng | `PATCH /rooms/:id/status`, `/deactivate` |

### Giá phòng (RoomPrice)
| # | Chức năng | API |
|---|-----------|-----|
| 7 | Xem giá phòng | `GET /room-prices` |
| 8 | Tạo / cập nhật giá | `POST /room-prices` |
| 9 | Xoá giá | `DELETE /room-prices/:id` |

### Tiện ích & Tiêu chuẩn kiểm kê
| # | Chức năng | API |
|---|-----------|-----|
| 10 | Xem / options tiện ích | `GET /amenities`, `/options` |
| 11 | Tạo / sửa / ngừng tiện ích | `POST`, `PUT`, `PATCH /amenities/:id/deactivate` |
| 12 | Gán tiện ích cho loại phòng | `GET/PUT /room-types/:id/amenities` |
| 13 | Số lượng chuẩn kiểm kê theo loại phòng | `GET/PUT /room-types/:id/standards` |

### Bổ sung thiết bị (Restock) & Tồn kho phòng
| # | Chức năng | API |
|---|-----------|-----|
| 14 | Danh sách phòng cần bổ sung | `GET /restock/rooms` |
| 15 | Xem / cập nhật tồn kho thiết bị phòng | `GET/PUT /rooms/:id/inventory` |

### Dịch vụ (Service)
| # | Chức năng | API |
|---|-----------|-----|
| 16 | Xem / chi tiết / options dịch vụ | `GET /services`, `/:id`, `/options` |
| 17 | Tạo / sửa / ngừng dịch vụ | `POST`, `PUT`, `PATCH /services/:id/deactivate` |

### Sự cố phòng (Room Issues) & Bảo trì
| # | Chức năng | API |
|---|-----------|-----|
| 18 | Xem / chi tiết sự cố phòng | `GET /room-issues`, `/:id` |
| 19 | Tạo sự cố phòng | `POST /room-issues` |
| 20 | Duyệt đưa phòng vào bảo trì | `PATCH /room-issues/:id/approve-maintenance` |
| 21 | Giải quyết / huỷ sự cố | `PATCH /room-issues/:id/resolve`, `/cancel` |

### Quản lý Housekeeping
| # | Chức năng | API |
|---|-----------|-----|
| 22 | Xem / chi tiết task housekeeping | `GET /housekeeping/tasks`, `/:id` |
| 23 | Giao việc cho housekeeper | `PATCH /housekeeping/tasks/:id/assign` |
| 24 | Đánh dấu task khẩn cấp | `PATCH /housekeeping/tasks/:id/urgent` |
| 25 | Tạo sự cố phòng từ task | `POST /housekeeping/tasks/:taskId/issues` |
| 26 | Danh sách housekeeper | `GET /housekeepers` |
| 27 | Xem / gán tầng phụ trách cho housekeeper | `GET /housekeeper-floors`, `PUT /housekeepers/:id/floors` |

---

## 5. Super Admin — Quản trị hệ thống
*Nguồn: `adminRoutes.js`*

### Chi nhánh (Branch)
| # | Chức năng | API |
|---|-----------|-----|
| 1 | Tạo / xem chi nhánh | `POST`, `GET /branches` |
| 2 | Sửa chi nhánh | `PUT /branches/:id` |
| 3 | Bật/tắt hoạt động chi nhánh | `PATCH /branches/:id/deactivate` |

### Nhân sự & Tài khoản (Staff & Account)
| # | Chức năng | API |
|---|-----------|-----|
| 4 | Tạo nhân viên | `POST /staff` |
| 5 | Xem danh sách nhân viên / tất cả tài khoản | `GET /staff`, `/users` |
| 6 | Bật/tắt hoạt động tài khoản | `PATCH /accounts/:id/deactivate` |
| 7 | Cập nhật role nhân viên | `PUT /staff/:id/role` |
| 8 | Gán / gỡ nhân viên khỏi chi nhánh | `POST /staff/:id/assignments`, `DELETE /staff/assignments/:assignmentId` |

### Dashboard & Báo cáo
| # | Chức năng | API |
|---|-----------|-----|
| 9 | Thống kê tổng quan hệ thống | `GET /dashboard/stats` |
| 10 | Dashboard theo chi nhánh | `GET /dashboard/branches/:branchId` |

### Thư viện ảnh / Media (global)
| # | Chức năng | API |
|---|-----------|-----|
| 11 | Xem danh sách ảnh | `GET /gallery` |
| 12 | Tải lên ảnh mới | `POST /gallery` |
| 13 | Sửa / xoá ảnh | `PUT`, `DELETE /gallery/:id` |

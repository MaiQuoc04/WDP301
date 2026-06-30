# Feature Breakdown by Role — Hotel Booking Management System (WDP301)

> The system has **5 roles** (`accountModel.js`): `customer`, `receptionist`, `housekeeper`, `branch_manager`, `super_admin`.
> Plus a **Guest** group (unauthenticated visitors) and **shared** features (Auth, Notifications).

---

## 0. Guest — Unauthenticated visitor
*Source: `publicRoutes.js`, `authRoutes.js`*

| # | Feature | API |
|---|---------|-----|
| 1 | View homepage / home data | `GET /home-data` |
| 2 | Browse room list | `GET /rooms` |
| 3 | Search available rooms by branch + dates | `GET /rooms/available` |
| 4 | View room detail | page `/rooms/:id` |
| 5 | View branch list | `GET /branches` |
| 6 | View gallery / dining images | `GET /gallery` |
| 7 | View static pages: Dining, Facilities, Gallery, Contact | FE static pages |
| 8 | Register account + OTP verification | `POST /register`, `/verify-otp`, `/resend-otp` |
| 9 | Login (standard / Google) | `POST /login`, `/google` |
| 10 | Forgot / reset password | `POST /forgot-password`, `/reset-password` |

---

## Shared — every authenticated role
*Source: `authRoutes.js`, `notificationRoutes.js`*

| # | Feature | API |
|---|---------|-----|
| 1 | Logout | `POST /logout` |
| 2 | View account profile | `GET /me` |
| 3 | Change password | `POST /change-password` |
| 4 | List notifications | `GET /notifications` |
| 5 | Unread notification count | `GET /notifications/unread-count` |
| 6 | Mark one / all as read | `PATCH /notifications/:id/read`, `/read-all` |

---

## 1. Customer
*Source: `customerRoutes.js`*

| # | Feature | API |
|---|---------|-----|
| 1 | Book a room online (login required) | `POST /bookings` |
| 2 | View booking history | `GET /bookings` |
| 3 | View booking detail | `GET /bookings/:id` |
| 4 | Create PayOS payment link | `POST /bookings/:id/payos-link` |
| 5 | Receive payment result (PayOS webhook) | `POST /payos-webhook` |
| 6 | Manage personal profile | page `/customer` |

---

## 2. Receptionist
*Source: `receptionRoutes.js`*

### Catalog & data reads
| # | Feature | API |
|---|---------|-----|
| 1 | List services / amenities (bill dropdowns) | `GET /services`, `/amenities` |
| 2 | Room list + status | `GET /rooms` |
| 3 | Search available rooms by party size (walk-in) | `GET /rooms/available` |
| 4 | List + filter bookings | `GET /bookings` |
| 5 | Booking detail | `GET /bookings/:id` |

### Booking lifecycle
| # | Feature | API |
|---|---------|-----|
| 6 | Create walk-in booking | `POST /bookings` |
| 7 | Collect deposit → confirmed (cash) | `POST /bookings/:id/confirm-deposit` |
| 8 | Generate PayOS QR for deposit | `POST /bookings/:id/deposit-qr` |
| 9 | Check-in | `POST /bookings/:id/check-in` |
| 10 | Check-out (legacy / cash) | `POST /bookings/:id/check-out`, `/checkout-cash` |
| 11 | Generate PayOS QR for remaining balance | `POST /bookings/:id/checkout-qr` |
| 12 | Sync payment status (polling) | `POST /bookings/:id/sync-payments` |
| 13 | Complete booking → completed | `POST /bookings/:id/complete` |
| 14 | Toggle extra-bed surcharge | `POST /bookings/:id/bed-surcharge` |
| 15 | Early check-in | `POST /bookings/:id/early-checkin` |
| 16 | Late check-out | `POST /bookings/:id/late-checkout` |

### Bill & Services
| # | Feature | API |
|---|---------|-----|
| 17 | View bill | `GET /bookings/:id/bill` |
| 18 | Add / remove / toggle-delivered service | `POST/DELETE/PATCH /bookings/:id/services` |
| 19 | Service delivery board per room | `GET /service-board` |
| 20 | Add / remove missing amenity (compensation) | `POST/DELETE /bookings/:id/missing-amenities` |

### Housekeeping coordination
| # | Feature | API |
|---|---------|-----|
| 21 | Request equipment inspection | `POST /bookings/:id/request-inspection` |
| 22 | Request mid-stay cleaning | `POST /bookings/:id/request-cleaning` |
| 23 | View housekeeping status + history | `GET /bookings/:id/housekeeping` |
| 24 | Suggest housekeeper for assignment | `GET /bookings/:id/housekeepers` |

### Cancel / No-show / Transfer
| # | Feature | API |
|---|---------|-----|
| 25 | Cancel booking before check-in | `POST /bookings/:id/cancel` |
| 26 | Mark no-show (forfeit deposit) | `POST /bookings/:id/no-show` |
| 27 | Transfer in-house guest to another room | `POST /bookings/:id/transfer` |
| 28 | Update booking | `PATCH /bookings/:id` |

### Dashboard & Transactions
| # | Feature | API |
|---|---------|-----|
| 29 | Daily-metrics dashboard | `GET /dashboard` |
| 30 | Room schedule / timeline | `GET /schedule` |
| 31 | Transaction list + detail | `GET /transactions`, `/transactions/:id` |

---

## 3. Housekeeper
*Source: `housekeepingRoutes.js`*

| # | Feature | API |
|---|---------|-----|
| 1 | Task dashboard | `GET /dashboard` |
| 2 | List assigned tasks | `GET /tasks` |
| 3 | Task history | `GET /history` |
| 4 | Task detail | `GET /tasks/:id` |
| 5 | Start task | `PATCH /tasks/:id/start` |
| 6 | Save room amenity inventory report | `PUT /tasks/:id/amenity-report` |
| 7 | Report issue needing maintenance (awaits manager approval) | `POST /tasks/:id/issues` |
| 8 | Complete task | `PATCH /tasks/:id/complete` |
| 9 | List rooms under maintenance / pending confirmation | `GET /maintenance` |
| 10 | Report fix done | `PATCH /maintenance/:id/fixed` |

---

## 4. Branch Manager
*Source: `managerRoutes.js`*

### Room Types
| # | Feature | API |
|---|---------|-----|
| 1 | View / detail / options of room types | `GET /room-types`, `/:id`, `/options` |
| 2 | Create / update room type | `POST`, `PUT /room-types/:id` |
| 3 | Change room-type status | `PATCH /room-types/:id/status` |

### Rooms
| # | Feature | API |
|---|---------|-----|
| 4 | View / detail rooms | `GET /rooms`, `/rooms/:id` |
| 5 | Create / update room | `POST`, `PUT /rooms/:id` |
| 6 | Change status / deactivate room | `PATCH /rooms/:id/status`, `/deactivate` |

### Room Prices
| # | Feature | API |
|---|---------|-----|
| 7 | View room prices | `GET /room-prices` |
| 8 | Create / update price | `POST /room-prices` |
| 9 | Delete price | `DELETE /room-prices/:id` |

### Amenities & Inventory Standards
| # | Feature | API |
|---|---------|-----|
| 10 | View / options amenities | `GET /amenities`, `/options` |
| 11 | Create / update / deactivate amenity | `POST`, `PUT`, `PATCH /amenities/:id/deactivate` |
| 12 | Map amenities to room type | `GET/PUT /room-types/:id/amenities` |
| 13 | Inventory standard quantities per room type | `GET/PUT /room-types/:id/standards` |

### Restock & Room Inventory
| # | Feature | API |
|---|---------|-----|
| 14 | List rooms needing restock | `GET /restock/rooms` |
| 15 | View / update room equipment inventory | `GET/PUT /rooms/:id/inventory` |

### Services
| # | Feature | API |
|---|---------|-----|
| 16 | View / detail / options services | `GET /services`, `/:id`, `/options` |
| 17 | Create / update / deactivate service | `POST`, `PUT`, `PATCH /services/:id/deactivate` |

### Room Issues & Maintenance
| # | Feature | API |
|---|---------|-----|
| 18 | View / detail room issues | `GET /room-issues`, `/:id` |
| 19 | Create room issue | `POST /room-issues` |
| 20 | Approve putting room into maintenance | `PATCH /room-issues/:id/approve-maintenance` |
| 21 | Resolve / cancel issue | `PATCH /room-issues/:id/resolve`, `/cancel` |

### Housekeeping Management
| # | Feature | API |
|---|---------|-----|
| 22 | View / detail housekeeping tasks | `GET /housekeeping/tasks`, `/:id` |
| 23 | Assign task to housekeeper | `PATCH /housekeeping/tasks/:id/assign` |
| 24 | Mark task urgent | `PATCH /housekeeping/tasks/:id/urgent` |
| 25 | Create room issue from a task | `POST /housekeeping/tasks/:taskId/issues` |
| 26 | List housekeepers | `GET /housekeepers` |
| 27 | View / assign floors to housekeeper | `GET /housekeeper-floors`, `PUT /housekeepers/:id/floors` |

---

## 5. Super Admin
*Source: `adminRoutes.js`*

### Branches
| # | Feature | API |
|---|---------|-----|
| 1 | Create / view branches | `POST`, `GET /branches` |
| 2 | Update branch | `PUT /branches/:id` |
| 3 | Toggle branch active | `PATCH /branches/:id/deactivate` |

### Staff & Accounts
| # | Feature | API |
|---|---------|-----|
| 4 | Create staff | `POST /staff` |
| 5 | List staff / all accounts | `GET /staff`, `/users` |
| 6 | Toggle account active | `PATCH /accounts/:id/deactivate` |
| 7 | Update staff role | `PUT /staff/:id/role` |
| 8 | Assign / remove staff from branch | `POST /staff/:id/assignments`, `DELETE /staff/assignments/:assignmentId` |

### Dashboard & Reports
| # | Feature | API |
|---|---------|-----|
| 9 | System-wide statistics | `GET /dashboard/stats` |
| 10 | Per-branch dashboard | `GET /dashboard/branches/:branchId` |

### Gallery / Media (global)
| # | Feature | API |
|---|---------|-----|
| 11 | List images | `GET /gallery` |
| 12 | Upload new image | `POST /gallery` |
| 13 | Update / delete image | `PUT`, `DELETE /gallery/:id` |

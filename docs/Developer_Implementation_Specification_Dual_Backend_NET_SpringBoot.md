# Developer Implementation Specification v1.1

# Parking Building Management System

## Dual Backend: ASP.NET Core + Spring Boot dùng chung PostgreSQL

---

## Thông Tin Tài Liệu

| Thuộc tính                | Nội dung                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tên tài liệu              | Developer Implementation Specification - Dual Backend                                                                    |
| Tên hệ thống              | Parking Building Management System                                                                                       |
| Phiên bản tài liệu        | v1.1                                                                                                                     |
| Nguồn yêu cầu chính       | `SRS_v2_2_Parking_Building_Management_System.md`                                                                         |
| Nguồn chi tiết triển khai | `Developer_Implementation_Specification_Parking_Building_Management_System_v1_0.md`                                      |
| Backend 1                 | ASP.NET Core Web API - Core API                                                                                          |
| Backend 2                 | Spring Boot REST API - Support API                                                                                       |
| Frontend                  | React Web Application                                                                                                    |
| Database                  | PostgreSQL dùng chung                                                                                                    |
| Quy mô backend team       | 2 dev .NET + 2 dev Spring Boot                                                                                           |
| Đối tượng sử dụng         | Backend Developer, Frontend Developer, Tester, Team Leader                                                               |
| Mục tiêu                  | Chia hệ thống thành 2 backend không xung đột, cùng dùng 1 database, đủ schema/API/service/test để dev triển khai độc lập |

---

# 1. Mục Đích Và Source Of Truth

SRS mô tả **hệ thống cần làm gì**. Tài liệu này mô tả **dev .NET, dev Spring Boot và frontend cần code gì**, chia ownership ra sao, API/path/payload nào dùng, bảng nào được ghi bởi backend nào, và test case nào phải đạt.

Thứ tự ưu tiên khi có mâu thuẫn:

1. `SRS_v2_2_Parking_Building_Management_System.md` là business truth.
2. Tài liệu này là implementation truth cho dual-backend.
3. File implementation v1.0 cũ chỉ là nguồn tham khảo chi tiết, không override ownership dual-backend.
4. Code phải update lại tài liệu này nếu đổi endpoint, field, enum, ownership, transaction rule hoặc status flow.

Nguyên tắc triển khai:

- Không code trực tiếp theo từng câu FR; code theo module, use case và transaction boundary.
- Mỗi bảng có một owner ghi chính.
- Một use case ghi dữ liệu core phải nằm trong một backend transaction duy nhất.
- `.NET Core API` là owner nghiệp vụ core và Driver account ghi dữ liệu.
- `Spring Boot API` là owner public read, dashboard/report/audit search và support optional.
- PostgreSQL là single source of truth.

---

# 2. Phạm Vi Triển Khai

## 2.1 Must Have

Các chức năng bắt buộc cho MVP/demo:

- Auth và phân quyền theo role.
- User management nội bộ.
- Public Driver pages: thông tin bãi xe, slot trống, bảng giá, quy định, QR lookup.
- Parking Card + Static QR.
- Vehicle Type management.
- Floor/Area/Slot/Gate management.
- Slot suggestion.
- Entry Processing.
- Exit Processing cho khách vãng lai.
- Exit Processing cho Monthly Pass.
- Fee Calculation.
- Cash Payment.
- Monthly Pass.
- Booking/Reservation.
- Reservation: Đặt trước slot ô tô tại tầng B2, giữ chỗ tối đa 15 phút, tự động hủy/hết hạn nếu quá giờ.
- Lost Card.
- Plate Mismatch.
- Session Administration / Cancel Session.
- Slot Occupancy Adjustment.
- Pricing Management.
- Dashboard cơ bản.
- Reports cơ bản.
- Audit Log.

## 2.2 Should Have

Làm sau Must Have, không được block core flow:

- Driver self-register/login.
- Driver profile.
- Driver vehicles.
- Driver parking history.
- Excel export report/audit.
- QR scanner bằng camera trình duyệt.
- Upload ảnh xe hoặc ảnh demo.

## 2.3 Could Have

Chỉ làm nếu còn dư thời gian:

- Driver feedback.
- Notification.
- Mock online payment.
- PDF export.
- Biểu đồ nâng cao.
- System configuration nâng cao.

## 2.4 Out Of Scope Trong MVP

- Thiết bị camera/RFID/barrier thật.
- Thanh toán online thật.
- Realtime WebSocket bắt buộc.
- Multi-building/multi-tenant.
- RBAC đầy đủ bằng các bảng phân quyền riêng.

---

# 3. Nguyên Tắc Kiến Trúc Dual Backend

## 3.1 Một Database, Hai Backend, Một Source Of Truth

```text
React Frontend
   |
   |-- gọi .NET Core API: core write, auth, driver account, transaction chính
   |
   |-- gọi Spring Boot API: public read, dashboard, report, audit search, support

ASP.NET Core API  ----\
                      ---> PostgreSQL shared database
Spring Boot API  -----/
```

Quy tắc bắt buộc:

- Chỉ có một schema PostgreSQL chính.
- `database/*.sql` tao schema/seed chinh thuc; ca hai backend chi map schema da co.
- Spring Boot dùng JPA validate/read mapping, không tự thay đổi schema.
- Backend không phải owner chỉ đọc bảng core, hoặc gọi API của owner để thay đổi.
- Không để cả .NET và Spring cùng update một trạng thái nghiệp vụ quan trọng.
- Không dùng enum integer trong database; chỉ lưu enum string.

## 3.2 Không Chia Một Use Case Thành Transaction Qua 2 Backend

Không làm:

```text
Step 1: Support API tạo session
Step 2: Core API đổi trạng thái card
Step 3: Support API đổi trạng thái slot
```

Phải làm:

```text
.NET EntryService.CreateEntrySessionAsync()
  - validate card
  - validate vehicle/monthly pass
  - validate slot/suggestion
  - create parking_session
  - update card IN_USE
  - update slot OCCUPIED
  - write audit log
  - commit transaction
```

Spring Boot chỉ đọc kết quả sau khi .NET API trả success.

## 3.3 Module Owner Rule

| Loại module                                 | Backend chính      | Lý do                                                               |
| ------------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| Auth/User/Role enum                         | .NET               | Token và quyền thống nhất toàn hệ thống                             |
| Driver account/profile/vehicles             | .NET               | Có ghi `users`, `driver_profiles`, `vehicles`, cần chung auth owner |
| Parking session, entry, exit                | .NET               | Core transaction nhiều bước                                         |
| Parking card/state                          | .NET               | Entry/exit update thường xuyên                                      |
| Parking structure/slot/gate                 | .NET               | Slot status bị transaction core update                              |
| Pricing/Fee/Payment                         | .NET               | Ảnh hưởng thanh toán và session completion                          |
| Monthly Pass                                | .NET               | Entry/exit cần check trong core flow                                |
| Lost Card/Mismatch/Cancel Session           | .NET               | Exception core cần transaction                                      |
| Public parking info/available slots/pricing | Spring Boot        | Read-heavy, public                                                  |
| Public QR lookup                            | Spring Boot        | Read-only, che dữ liệu nhạy cảm                                     |
| Dashboard/Reports/Excel                     | Spring Boot        | Query đọc nhiều, tách khỏi core write                               |
| Audit Log Search                            | Spring Boot        | Read/export audit log                                               |
| Audit Log Write                             | Cả hai append-only | Mỗi service ghi action của chính nó                                 |
| Feedback/Notification/Mock Device           | Spring Boot        | Optional support module                                             |

## 3.4 API Gateway Hoặc Frontend Gọi Trực Tiếp

MVP khuyến nghị frontend gọi trực tiếp 2 backend nhưng vẫn giữ prefix:

```text
Core API base URL    http://localhost:5000
Support API base URL http://localhost:8080
Public API base URL  http://localhost:8080
```

Prefix chuẩn:

```text
.NET Core API      /api/core/*
Spring Support API /api/support/*
Public API         /api/public/*
```

Nếu dùng gateway sau này:

```text
/api/core/*      -> .NET Core API
/api/support/*   -> Spring Boot API
/api/public/*    -> Spring Boot API
```

---

# 4. Phân Chia Backend Tổng Quát

## 4.1 ASP.NET Core API - Core Service

Tên project đề xuất:

```text
ParkingBuilding.CoreApi
```

Phụ trách:

- Auth/JWT/password hash.
- User management nội bộ.
- Driver register/profile/vehicles/history nếu làm Should Have.
- Vehicle Type và Vehicle.
- Parking Card management.
- Floor/Area/Slot/Gate management.
- Slot suggestion.
- Entry processing.
- Exit processing.
- Fee calculation.
- Cash payment.
- Monthly Pass.
- Lost Card.
- Plate Mismatch.
- Admin Cancel Session.
- Slot move/status adjustment.
- Pricing Management.
- Ghi audit log cho nghiệp vụ core.
- `DbContext` mapping theo schema da co va seed data tu `database/02_seed.sql`.

## 4.2 Spring Boot API - Support Service

Tên project đề xuất:

```text
parking-building-support-api
```

Phụ trách:

- Public Driver APIs.
- Public available slots/pricing/rules.
- Public card QR lookup.
- Dashboard summary.
- Reports.
- Excel export bằng Apache POI.
- Audit log search/export.
- Feedback nếu làm.
- Notification nếu làm.
- Mock device optional.
- Read-only search APIs cho frontend nếu cần.

---

# 5. Quy Ước Chung Backend

## 5.1 API Response Format

Cả .NET và Spring Boot trả cùng format:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "timestamp": "2026-05-21T10:00:00+07:00"
}
```

Lỗi validation:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "cardCode",
      "message": "CARD_NOT_AVAILABLE"
    }
  ],
  "timestamp": "2026-05-21T10:00:00+07:00"
}
```

Pagination:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  },
  "errors": null,
  "timestamp": "2026-05-21T10:00:00+07:00"
}
```

## 5.2 HTTP Status Convention

| Trường hợp               | HTTP Status |
| ------------------------ | ----------: |
| GET thành công           |         200 |
| Tạo mới thành công       |         201 |
| Cập nhật thành công      |         200 |
| Hủy/xóa logic thành công |         200 |
| Validation lỗi           |         400 |
| Chưa đăng nhập           |         401 |
| Không đủ quyền           |         403 |
| Không tìm thấy           |         404 |
| Conflict nghiệp vụ       |         409 |
| Lỗi server               |         500 |

## 5.3 Error Code Convention

| Nhóm lỗi  | Ví dụ                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Auth      | `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `TOKEN_EXPIRED`               |
| User      | `USERNAME_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`                      |
| Card      | `CARD_NOT_FOUND`, `CARD_NOT_AVAILABLE`, `CARD_STATE_CONFLICT`          |
| Vehicle   | `VEHICLE_HAS_ACTIVE_SESSION`, `VEHICLE_TYPE_INACTIVE`                  |
| Slot      | `SLOT_NOT_AVAILABLE`, `SLOT_VEHICLE_TYPE_NOT_ALLOWED`                  |
| Session   | `SESSION_NOT_FOUND`, `SESSION_NOT_ACTIVE`, `SESSION_ALREADY_COMPLETED` |
| Payment   | `PAYMENT_ALREADY_PAID`, `PAYMENT_REQUIRED_BEFORE_EXIT`                 |
| Lost Card | `LOST_CARD_CASE_PENDING`, `LOST_CARD_NOT_APPROVED`                     |
| Mismatch  | `PLATE_MISMATCH_REQUIRES_APPROVAL`                                     |

## 5.4 API Path Convention

```text
POST /api/core/auth/login
POST /api/core/parking-sessions/entry
GET  /api/support/dashboard/summary
GET  /api/public/parking-info
```

Không dùng endpoint thiếu prefix trong bản dual-backend.

---

# 6. Auth Và Phân Quyền Dùng Chung

## 6.1 Auth Owner

`.NET Core API` là owner của Auth.

Spring Boot không tự login. Spring Boot chỉ verify JWT do .NET phát hành.

```text
POST /api/core/auth/login -> .NET cấp JWT
React lưu JWT
React gọi .NET/Spring đều gửi Authorization: Bearer <token>
Spring Boot verify JWT bằng cùng secret/issuer/audience
```

## 6.2 Role Model MVP

MVP dùng `role` enum trực tiếp trong bảng `users`.

Không dùng các bảng phân quyền tách riêng trong MVP.

Neu sau nay can RBAC day du, cap nhat SQL script rieng va cap nhat lai spec.

## 6.3 JWT Claims Bắt Buộc

```json
{
  "sub": "1",
  "username": "staff01",
  "role": "STAFF",
  "fullName": "Nguyen Van A",
  "iss": "parking-building-auth",
  "aud": "parking-building-api",
  "exp": 1790000000
}
```

## 6.4 Role Check

| Role    | Có thể dùng                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------- |
| ADMIN   | Tất cả API quản trị, cancel session, audit, user management                                    |
| MANAGER | Dashboard, reports, card/structure/pricing/monthly pass, lost card approval, mismatch approval |
| STAFF   | Entry, exit, lost card create, session search                                   |
| DRIVER  | Driver profile, vehicles, history nếu làm                                                      |
| Public  | Parking info, available slots, pricing, public card QR lookup                                  |

---

# 7. Shared PostgreSQL Design

## 7.1 Naming Convention

- Table/column dùng `snake_case`.
- .NET property dùng `PascalCase` map sang column.
- Java field dùng `camelCase` map sang column.
- Thời gian dùng `TIMESTAMPTZ`.
- ID mặc định dùng `BIGSERIAL`.
- Enum lưu `VARCHAR`, không lưu integer.

Ví dụ:

```text
Database: created_at
.NET: CreatedAt
Java: createdAt
```

## 7.2 SQL Script Ownership

Schema/seed chinh thuc nam trong `database/*.sql`:

```text
database/01_schema.sql
database/02_seed.sql
database/03_indexes_constraints.sql
```

Spring Boot config bắt buộc:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

Không dùng:

```yaml
spring.jpa.hibernate.ddl-auto: update
```

## 7.3 Connection Config

.NET:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.your-project-ref.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your-supabase-db-password;SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

Spring Boot:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: your-supabase-db-password
  jpa:
    hibernate:
      ddl-auto: validate
```

## 7.4 Table Ownership Matrix

| Bảng                 | Owner ghi chính    | .NET quyền    | Spring Boot quyền | Ghi chú                         |
| -------------------- | ------------------ | ------------- | ----------------- | ------------------------------- |
| users                | .NET               | Read/Write    | Read              | Auth/User/Driver account        |
| driver_profiles      | .NET               | Read/Write    | Read              | Driver register/profile do .NET |
| vehicles             | .NET               | Read/Write    | Read              | Driver vehicles và entry lookup |
| vehicle_types        | .NET               | Read/Write    | Read              | Seed + management               |
| parking_cards        | .NET               | Read/Write    | Read              | Entry/exit update status        |
| floors               | .NET               | Read/Write    | Read              | Structure management            |
| areas                | .NET               | Read/Write    | Read              | Structure management            |
| area_vehicle_types   | .NET               | Read/Write    | Read              | Mapping area-vehicle            |
| slots                | .NET               | Read/Write    | Read              | Entry/exit update status        |
| gates                | .NET               | Read/Write    | Read              | Gate data                       |
| parking_sessions     | .NET               | Read/Write    | Read              | Core transaction                |
| pricing_rules        | .NET               | Read/Write    | Read              | Fee calculation consistent      |
| payments             | .NET               | Read/Write    | Read              | Payment core                    |
| monthly_passes       | .NET               | Read/Write    | Read              | Entry/exit check                |
| lost_card_cases      | .NET               | Read/Write    | Read              | Exception core                  |
| plate_mismatch_cases | .NET               | Read/Write    | Read              | Exception core                  |
| audit_logs           | Append-only shared | Insert/Read   | Insert/Read       | Không update/delete             |
| feedbacks            | Spring Boot        | Read optional | Read/Write        | Could Have                      |
| notifications        | Spring Boot        | Read optional | Read/Write        | Could Have                      |
| mock_device_events   | Spring Boot        | Read optional | Read/Write        | Optional                        |
| system_configs       | .NET               | Read/Write    | Read              | Could Have, config hệ thống     |
| reservations         | .NET               | Read/Write    | Read              | Quản lý lượt đặt chỗ trước     |

## 7.5 Shared Enums

```text
UserRole: ADMIN, MANAGER, STAFF, DRIVER
UserStatus: ACTIVE, LOCKED, INACTIVE
DriverProfileStatus: ACTIVE, LOCKED, INACTIVE
VehicleStatus: ACTIVE, INACTIVE
CardStatus: AVAILABLE, IN_USE, LOST, DAMAGED, INACTIVE
FloorStatus: ACTIVE, LOCKED, MAINTENANCE
AreaStatus: ACTIVE, LOCKED, MAINTENANCE
SlotStatus: AVAILABLE, OCCUPIED, RESERVED, LOCKED, MAINTENANCE
ReservationStatus: PENDING, COMPLETED, CANCELLED, EXPIRED
GateStatus: ACTIVE, LOCKED, MAINTENANCE
GateType: ENTRY, EXIT
SessionStatus: ACTIVE, COMPLETED, CANCELLED, LOST_CARD_PENDING, MISMATCH_PENDING
PaymentStatus: PENDING, PAID, FAILED, CANCELLED, WAIVED, NOT_REQUIRED
PaymentMethod: CASH, NONE
CustomerType: CASUAL, MONTHLY
MonthlyPassStatus: ACTIVE, EXPIRED, LOCKED
LostCardCaseStatus: PENDING, APPROVED, REJECTED
PlateMismatchCaseStatus: PENDING, CONFIRMED, REJECTED
FeedbackStatus: OPEN, RESOLVED, REJECTED
SystemStatus: OPEN, CLOSED, MAINTENANCE
```

Để sinh viên mới không bị lệch dữ liệu, enum trong code nên dùng đúng tên uppercase như database. Ví dụ C# nên dùng `CardStatus.AVAILABLE`, không dùng `CardStatus.Available`, trừ khi tự viết converter riêng để lưu uppercase.

---

# 8. Database Implementation Specification

## 8.1 users

Owner: `.NET`

| Column        | Type         | Required | Note                       |
| ------------- | ------------ | -------: | -------------------------- |
| id            | BIGSERIAL    |      Yes | PK                         |
| full_name     | VARCHAR(150) |      Yes | Họ tên                     |
| username      | VARCHAR(100) |      Yes | Unique                     |
| email         | VARCHAR(150) |       No | Unique nếu có              |
| phone         | VARCHAR(30)  |       No | Unique nếu có              |
| password_hash | VARCHAR(255) |      Yes | BCrypt                     |
| role          | VARCHAR(30)  |      Yes | ADMIN/MANAGER/STAFF/DRIVER |
| status        | VARCHAR(30)  |      Yes | ACTIVE/LOCKED/INACTIVE     |
| last_login_at | TIMESTAMPTZ  |       No | Should Have                |
| created_at    | TIMESTAMPTZ  |      Yes | Auto                       |
| updated_at    | TIMESTAMPTZ  |      Yes | Auto                       |

Indexes:

```sql
CREATE UNIQUE INDEX ux_users_username ON users(username);
CREATE UNIQUE INDEX ux_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX ux_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_users_status ON users(status);
```

## 8.2 driver_profiles

Owner: `.NET`

| Column     | Type                | Required | Note                     |
| ---------- | ------------------- | -------: | ------------------------ |
| id         | BIGSERIAL           |      Yes | PK                       |
| user_id    | BIGINT FK users(id) |       No | Có nếu registered driver |
| full_name  | VARCHAR(150)        |      Yes | Họ tên driver            |
| phone      | VARCHAR(30)         |       No | Unique nếu có            |
| email      | VARCHAR(150)        |       No | Unique nếu có            |
| status     | VARCHAR(30)         |      Yes | ACTIVE/LOCKED/INACTIVE   |
| created_at | TIMESTAMPTZ         |      Yes | Auto                     |
| updated_at | TIMESTAMPTZ         |      Yes | Auto                     |

Indexes:

```sql
CREATE UNIQUE INDEX ux_driver_profiles_user_id ON driver_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX ux_driver_profiles_phone ON driver_profiles(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX ux_driver_profiles_email ON driver_profiles(email) WHERE email IS NOT NULL;
```

## 8.3 vehicle_types

Owner: `.NET`

| Column      | Type         | Required | Note            |
| ----------- | ------------ | -------: | --------------- |
| id          | BIGSERIAL    |      Yes | PK              |
| name        | VARCHAR(100) |      Yes | Xe máy, Ô tô... |
| description | TEXT         |       No | Mô tả           |
| is_active   | BOOLEAN      |      Yes | Bật/tắt         |
| created_at  | TIMESTAMPTZ  |      Yes | Auto            |
| updated_at  | TIMESTAMPTZ  |      Yes | Auto            |

Seed bắt buộc:

```text
Xe đạp
Xe đạp điện
Xe máy
Xe máy điện
Ô tô
Ô tô điện
Xe vận chuyển hàng hóa
```

## 8.4 vehicles

Owner: `.NET`

| Column                  | Type                          | Required | Note                           |
| ----------------------- | ----------------------------- | -------: | ------------------------------ |
| id                      | BIGSERIAL                     |      Yes | PK                             |
| driver_id               | BIGINT FK driver_profiles(id) |       No | Nullable với guest             |
| plate_number            | VARCHAR(30)                   |       No | Nullable với xe không biển số  |
| normalized_plate_number | VARCHAR(30)                   |       No | Dùng để search/check duplicate |
| vehicle_type_id         | BIGINT FK vehicle_types(id)   |      Yes | Loại xe                        |
| description             | TEXT                          |       No | Xe không biển số               |
| status                  | VARCHAR(30)                   |      Yes | ACTIVE/INACTIVE                |
| created_at              | TIMESTAMPTZ                   |      Yes | Auto                           |
| updated_at              | TIMESTAMPTZ                   |      Yes | Auto                           |

Indexes:

```sql
CREATE INDEX ix_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX ix_vehicles_plate ON vehicles(normalized_plate_number);
CREATE INDEX ix_vehicles_type ON vehicles(vehicle_type_id);
```

## 8.5 parking_cards

Owner: `.NET`

| Column             | Type                           | Required | Note                                   |
| ------------------ | ------------------------------ | -------: | -------------------------------------- |
| id                 | BIGSERIAL                      |      Yes | PK                                     |
| card_code          | VARCHAR(50)                    |      Yes | Unique, ví dụ C001                     |
| qr_token           | VARCHAR(120)                   |      Yes | Unique, khó đoán                       |
| status             | VARCHAR(30)                    |      Yes | AVAILABLE/IN_USE/LOST/DAMAGED/INACTIVE |
| current_session_id | BIGINT FK parking_sessions(id) |       No | Nullable                               |
| note               | TEXT                           |       No | Ghi chú                                |
| created_at         | TIMESTAMPTZ                    |      Yes | Auto                                   |
| updated_at         | TIMESTAMPTZ                    |      Yes | Auto                                   |

Indexes:

```sql
CREATE UNIQUE INDEX ux_cards_card_code ON parking_cards(card_code);
CREATE UNIQUE INDEX ux_cards_qr_token ON parking_cards(qr_token);
CREATE INDEX ix_cards_status ON parking_cards(status);
```

Rule:

- Một card chỉ có tối đa một session active/pending exception.
- `current_session_id` phải null khi card AVAILABLE/INACTIVE/DAMAGED nếu không gắn session.

## 8.6 floors

Owner: `.NET`

| Column     | Type         | Required | Note                      |
| ---------- | ------------ | -------: | ------------------------- |
| id         | BIGSERIAL    |      Yes | PK                        |
| floor_code | VARCHAR(30)  |      Yes | Unique, B1/B2/B3          |
| floor_name | VARCHAR(100) |      Yes | Tên tầng                  |
| status     | VARCHAR(30)  |      Yes | ACTIVE/LOCKED/MAINTENANCE |
| created_at | TIMESTAMPTZ  |      Yes | Auto                      |
| updated_at | TIMESTAMPTZ  |      Yes | Auto                      |

Seed demo:

```text
B1 - Tầng 1
B2 - Tầng 2
B3 - Tầng 3
```

## 8.7 areas

Owner: `.NET`

| Column         | Type                 | Required | Note                      |
| -------------- | -------------------- | -------: | ------------------------- |
| id             | BIGSERIAL            |      Yes | PK                        |
| floor_id       | BIGINT FK floors(id) |      Yes | Tầng                      |
| area_code      | VARCHAR(30)          |      Yes | A/B/C...                  |
| area_name      | VARCHAR(100)         |      Yes | Tên khu vực               |
| priority_order | INT                  |      Yes | Số nhỏ ưu tiên trước      |
| status         | VARCHAR(30)          |      Yes | ACTIVE/LOCKED/MAINTENANCE |
| created_at     | TIMESTAMPTZ          |      Yes | Auto                      |
| updated_at     | TIMESTAMPTZ          |      Yes | Auto                      |

Indexes:

```sql
CREATE UNIQUE INDEX ux_areas_floor_code ON areas(floor_id, area_code);
CREATE INDEX ix_areas_status ON areas(status);
CREATE INDEX ix_areas_priority ON areas(priority_order);
```

## 8.8 area_vehicle_types

Owner: `.NET`

| Column          | Type                        | Required | Note    |
| --------------- | --------------------------- | -------: | ------- |
| area_id         | BIGINT FK areas(id)         |      Yes | PK part |
| vehicle_type_id | BIGINT FK vehicle_types(id) |      Yes | PK part |

Indexes:

```sql
CREATE UNIQUE INDEX ux_area_vehicle_types ON area_vehicle_types(area_id, vehicle_type_id);
```

## 8.9 slots

Owner: `.NET`

| Column                  | Type                           | Required | Note                                  |
| ----------------------- | ------------------------------ | -------: | ------------------------------------- |
| id                      | BIGSERIAL                      |      Yes | PK                                    |
| area_id                 | BIGINT FK areas(id)            |      Yes | Khu vực                               |
| slot_code               | VARCHAR(50)                    |      Yes | A1, A2...                             |
| allowed_vehicle_type_id | BIGINT FK vehicle_types(id)    |      Yes | Loại xe chính                         |
| status                  | VARCHAR(30)                    |      Yes | AVAILABLE/OCCUPIED/LOCKED/MAINTENANCE |
| current_session_id      | BIGINT FK parking_sessions(id) |       No | Nullable                              |
| created_at              | TIMESTAMPTZ                    |      Yes | Auto                                  |
| updated_at              | TIMESTAMPTZ                    |      Yes | Auto                                  |

Indexes:

```sql
CREATE UNIQUE INDEX ux_slots_area_code ON slots(area_id, slot_code);
CREATE INDEX ix_slots_status ON slots(status);
CREATE INDEX ix_slots_vehicle_type ON slots(allowed_vehicle_type_id);
CREATE INDEX ix_slots_current_session ON slots(current_session_id);
```

## 8.10 gates

Owner: `.NET`

| Column     | Type                 | Required | Note                      |
| ---------- | -------------------- | -------: | ------------------------- |
| id         | BIGSERIAL            |      Yes | PK                        |
| floor_id   | BIGINT FK floors(id) |      Yes | Tầng                      |
| gate_code  | VARCHAR(50)          |      Yes | B1-IN/B1-OUT              |
| gate_type  | VARCHAR(30)          |      Yes | ENTRY/EXIT                |
| status     | VARCHAR(30)          |      Yes | ACTIVE/LOCKED/MAINTENANCE |
| created_at | TIMESTAMPTZ          |      Yes | Auto                      |
| updated_at | TIMESTAMPTZ          |      Yes | Auto                      |

Seed demo:

```text
B1-IN, B1-OUT
B2-IN, B2-OUT
B3-IN, B3-OUT
```

## 8.11 parking_sessions

Owner: `.NET`

| Column                  | Type                          | Required | Note                           |
| ----------------------- | ----------------------------- | -------: | ------------------------------ |
| id                      | BIGSERIAL                     |      Yes | PK                             |
| session_code            | VARCHAR(50)                   |      Yes | Unique, PS202605210001         |
| card_id                 | BIGINT FK parking_cards(id)   |      Yes | Card gắn với lượt gửi          |
| driver_id               | BIGINT FK driver_profiles(id) |       No | Nullable                       |
| vehicle_id              | BIGINT FK vehicles(id)        |       No | Nullable                       |
| plate_number            | VARCHAR(30)                   |       No | Nullable với xe không biển số  |
| normalized_plate_number | VARCHAR(30)                   |       No | Search/check active            |
| no_plate                | BOOLEAN                       |      Yes | Xe không biển số               |
| vehicle_description     | TEXT                          |       No | Mô tả xe không biển số         |
| vehicle_type_id         | BIGINT FK vehicle_types(id)   |      Yes | Loại xe                        |
| customer_type           | VARCHAR(30)                   |      Yes | CASUAL/MONTHLY                 |
| monthly_pass_id         | BIGINT FK monthly_passes(id)  |       No | Nullable                       |
| floor_id                | BIGINT FK floors(id)          |      Yes | Tầng                           |
| area_id                 | BIGINT FK areas(id)           |      Yes | Khu vực                        |
| slot_id                 | BIGINT FK slots(id)           |       No | Slot                           |
| entry_gate_id           | BIGINT FK gates(id)           |      Yes | Cổng vào                       |
| exit_gate_id            | BIGINT FK gates(id)           |       No | Cổng ra                        |
| entry_staff_id          | BIGINT FK users(id)           |      Yes | Staff vào                      |
| exit_staff_id           | BIGINT FK users(id)           |       No | Staff ra                       |
| entry_time              | TIMESTAMPTZ                   |      Yes | Thời gian vào                  |
| exit_time               | TIMESTAMPTZ                   |       No | Thời gian ra                   |
| status                  | VARCHAR(40)                   |      Yes | ACTIVE/COMPLETED/CANCELLED/... |
| payment_required        | BOOLEAN                       |      Yes | false nếu monthly pass valid   |
| payment_status          | VARCHAR(40)                   |      Yes | PENDING/PAID/WAIVED/...        |
| pricing_rule_id         | BIGINT FK pricing_rules(id)   |       No | Snapshot source                |
| snapshot_day_price      | NUMERIC(12,2)                 |       No | Giá tại lúc vào                |
| snapshot_night_price    | NUMERIC(12,2)                 |       No | Giá tại lúc vào                |
| snapshot_monthly_price  | NUMERIC(12,2)                 |       No | Giá tại lúc vào                |
| snapshot_lost_card_fee  | NUMERIC(12,2)                 |       No | Giá tại lúc vào                |
| suggested_area_id       | BIGINT FK areas(id)           |       No | Khu được gợi ý                 |
| suggested_slot_id       | BIGINT FK slots(id)           |       No | Slot được gợi ý                |
| override_area_id        | BIGINT FK areas(id)           |       No | Khu override                   |
| override_slot_id        | BIGINT FK slots(id)           |       No | Slot override                  |
| override_reason         | TEXT                          |       No | Lý do override                 |
| cancellation_reason     | TEXT                          |       No | Lý do hủy                      |
| created_at              | TIMESTAMPTZ                   |      Yes | Auto                           |
| updated_at              | TIMESTAMPTZ                   |      Yes | Auto                           |

Indexes:

```sql
CREATE UNIQUE INDEX ux_sessions_session_code ON parking_sessions(session_code);
CREATE INDEX ix_sessions_card_id ON parking_sessions(card_id);
CREATE INDEX ix_sessions_plate ON parking_sessions(normalized_plate_number);
CREATE INDEX ix_sessions_status ON parking_sessions(status);
CREATE INDEX ix_sessions_entry_time ON parking_sessions(entry_time);
CREATE INDEX ix_sessions_exit_time ON parking_sessions(exit_time);
CREATE INDEX ix_sessions_vehicle_type ON parking_sessions(vehicle_type_id);
CREATE INDEX ix_sessions_slot ON parking_sessions(slot_id);
```

PostgreSQL partial indexes chống trùng active:

```sql
CREATE UNIQUE INDEX ux_active_session_by_card
ON parking_sessions(card_id)
WHERE status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING');

CREATE UNIQUE INDEX ux_active_session_by_plate
ON parking_sessions(normalized_plate_number)
WHERE normalized_plate_number IS NOT NULL
  AND status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING');

CREATE UNIQUE INDEX ux_active_session_by_slot
ON parking_sessions(slot_id)
WHERE status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING');
```

## 8.12 pricing_rules

Owner: `.NET`

| Column          | Type                        | Required | Note                 |
| --------------- | --------------------------- | -------: | -------------------- |
| id              | BIGSERIAL                   |      Yes | PK                   |
| vehicle_type_id | BIGINT FK vehicle_types(id) |      Yes | Loại xe              |
| day_price       | NUMERIC(12,2)               |      Yes | Giá block khung ngày |
| night_price     | NUMERIC(12,2)               |      Yes | Giá block khung tối  |
| monthly_price   | NUMERIC(12,2)               |      Yes | Giá vé tháng         |
| lost_card_fee   | NUMERIC(12,2)               |      Yes | Phí mất thẻ          |
| effective_from  | TIMESTAMPTZ                 |      Yes | Bắt đầu hiệu lực     |
| status          | VARCHAR(30)                 |      Yes | ACTIVE/INACTIVE      |
| created_by      | BIGINT FK users(id)         |      Yes | Người tạo            |
| updated_by      | BIGINT FK users(id)         |       No | Người cập nhật       |
| created_at      | TIMESTAMPTZ                 |      Yes | Auto                 |
| updated_at      | TIMESTAMPTZ                 |      Yes | Auto                 |

Rule:

- Giá không âm.
- Fee calculation ưu tiên snapshot trong `parking_sessions`.
- Khi tạo entry, .NET copy giá active vào snapshot để tránh tranh cãi nếu giá đổi khi session đang active.

## 8.13 payments

Owner: `.NET`

| Column        | Type                           | Required | Note                                              |
| ------------- | ------------------------------ | -------: | ------------------------------------------------- |
| id            | BIGSERIAL                      |      Yes | PK                                                |
| session_id    | BIGINT FK parking_sessions(id) |      Yes | Session                                           |
| amount        | NUMERIC(12,2)                  |      Yes | Phí gửi xe                                        |
| lost_card_fee | NUMERIC(12,2)                  |      Yes | Default 0                                         |
| total_amount  | NUMERIC(12,2)                  |      Yes | amount + lost_card_fee                            |
| method        | VARCHAR(30)                    |      Yes | CASH/NONE                                         |
| status        | VARCHAR(30)                    |      Yes | PENDING/PAID/FAILED/CANCELLED/WAIVED/NOT_REQUIRED |
| paid_at       | TIMESTAMPTZ                    |       No | Thời gian thanh toán                              |
| collected_by  | BIGINT FK users(id)            |       No | Staff thu tiền                                    |
| waive_reason  | VARCHAR(100)                   |       No | MONTHLY_PASS                                      |
| created_at    | TIMESTAMPTZ                    |      Yes | Auto                                              |
| updated_at    | TIMESTAMPTZ                    |      Yes | Auto                                              |

Rule:

- Không sửa payment đã `PAID`, `WAIVED`, `NOT_REQUIRED`.
- Khách vãng lai không được complete session nếu payment chưa `PAID`.
- Monthly Pass valid có thể tạo payment `WAIVED` hoặc `NOT_REQUIRED`.

## 8.15 monthly_passes

Owner: `.NET`

| Column                  | Type                          | Required | Note                  |
| ----------------------- | ----------------------------- | -------: | --------------------- |
| id                      | BIGSERIAL                     |      Yes | PK                    |
| driver_id               | BIGINT FK driver_profiles(id) |       No | Nullable              |
| owner_name              | VARCHAR(150)                  |      Yes | Chủ xe                |
| phone                   | VARCHAR(30)                   |       No | SĐT                   |
| plate_number            | VARCHAR(30)                   |      Yes | Biển số/mã xe         |
| normalized_plate_number | VARCHAR(30)                   |      Yes | Check                 |
| vehicle_type_id         | BIGINT FK vehicle_types(id)   |      Yes | Loại xe               |
| start_date              | DATE                          |      Yes | Ngày bắt đầu          |
| end_date                | DATE                          |      Yes | Ngày hết hạn          |
| status                  | VARCHAR(30)                   |      Yes | ACTIVE/EXPIRED/LOCKED |
| created_by              | BIGINT FK users(id)           |      Yes | Người tạo             |
| created_at              | TIMESTAMPTZ                   |      Yes | Auto                  |
| updated_at              | TIMESTAMPTZ                   |      Yes | Auto                  |

Indexes:

```sql
CREATE INDEX ix_monthly_pass_plate ON monthly_passes(normalized_plate_number);
CREATE INDEX ix_monthly_pass_status ON monthly_passes(status);
CREATE INDEX ix_monthly_pass_dates ON monthly_passes(start_date, end_date);
```

## 8.16 lost_card_cases

Owner: `.NET`

| Column            | Type                           | Required | Note                      |
| ----------------- | ------------------------------ | -------: | ------------------------- |
| id                | BIGSERIAL                      |      Yes | PK                        |
| session_id        | BIGINT FK parking_sessions(id) |      Yes | Session                   |
| card_id           | BIGINT FK parking_cards(id)    |       No | Card nếu biết             |
| reporter_name     | VARCHAR(150)                   |      Yes | Người báo mất             |
| phone             | VARCHAR(30)                    |       No | SĐT                       |
| verification_note | TEXT                           |      Yes | Mô tả xác minh            |
| reason            | TEXT                           |      Yes | Lý do                     |
| lost_card_fee     | NUMERIC(12,2)                  |      Yes | Phí áp dụng               |
| status            | VARCHAR(30)                    |      Yes | PENDING/APPROVED/REJECTED |
| created_by        | BIGINT FK users(id)            |      Yes | Staff                     |
| approved_by       | BIGINT FK users(id)            |       No | Manager/Admin             |
| approved_at       | TIMESTAMPTZ                    |       No | Thời gian duyệt           |
| rejection_reason  | TEXT                           |       No | Lý do từ chối             |
| created_at        | TIMESTAMPTZ                    |      Yes | Auto                      |
| updated_at        | TIMESTAMPTZ                    |      Yes | Auto                      |

Rule:

- Staff chỉ tạo case.
- Manager/Admin approve/reject.
- Nếu pending, session chuyển `LOST_CARD_PENDING`.
- Nếu approved, có thể tiếp tục exit với phí mất thẻ.

## 8.17 plate_mismatch_cases

Owner: `.NET`

| Column             | Type                           | Required | Note                       |
| ------------------ | ------------------------------ | -------: | -------------------------- |
| id                 | BIGSERIAL                      |      Yes | PK                         |
| session_id         | BIGINT FK parking_sessions(id) |      Yes | Session                    |
| entry_plate_number | VARCHAR(30)                    |       No | Biển số lúc vào            |
| exit_plate_number  | VARCHAR(30)                    |      Yes | Biển số lúc ra             |
| reason             | TEXT                           |       No | Lý do xác nhận             |
| status             | VARCHAR(30)                    |      Yes | PENDING/CONFIRMED/REJECTED |
| created_by         | BIGINT FK users(id)            |      Yes | Staff                      |
| confirmed_by       | BIGINT FK users(id)            |       No | Manager/Admin              |
| confirmed_at       | TIMESTAMPTZ                    |       No | Thời gian xác nhận         |
| rejection_reason   | TEXT                           |       No | Lý do từ chối              |
| created_at         | TIMESTAMPTZ                    |      Yes | Auto                       |
| updated_at         | TIMESTAMPTZ                    |      Yes | Auto                       |

Rule:

- Staff không được tự bỏ qua mismatch.
- Mismatch pending chặn exit đến khi Manager/Admin confirm.

## 8.18 audit_logs

Owner: append-only shared.

| Column         | Type                | Required | Note                    |
| -------------- | ------------------- | -------: | ----------------------- |
| id             | BIGSERIAL           |      Yes | PK                      |
| actor_user_id  | BIGINT FK users(id) |       No | Người thực hiện         |
| source_service | VARCHAR(50)         |      Yes | CORE_API/SUPPORT_API    |
| action         | VARCHAR(100)        |      Yes | SESSION_CREATED...      |
| target_type    | VARCHAR(100)        |      Yes | ParkingSession/Card/... |
| target_id      | VARCHAR(100)        |      Yes | ID string               |
| old_value      | JSONB               |       No | Snapshot cũ             |
| new_value      | JSONB               |       No | Snapshot mới            |
| reason         | TEXT                |       No | Lý do                   |
| created_at     | TIMESTAMPTZ         |      Yes | Auto                    |

Indexes:

```sql
CREATE INDEX ix_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
CREATE INDEX ix_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);
```

Không backend nào được update/delete audit log.

## 8.19 feedbacks - Could Have

Owner: `Spring Boot`

| Column         | Type                | Required | Note                         |
| -------------- | ------------------- | -------: | ---------------------------- |
| id             | BIGSERIAL           |      Yes | PK                           |
| driver_user_id | BIGINT FK users(id) |       No | Nullable nếu public feedback |
| type           | VARCHAR(50)         |      Yes | ISSUE/SUGGESTION/OTHER       |
| content        | TEXT                |      Yes | Nội dung                     |
| status         | VARCHAR(30)         |      Yes | OPEN/RESOLVED/REJECTED       |
| resolved_by    | BIGINT FK users(id) |       No | Manager/Admin                |
| resolved_at    | TIMESTAMPTZ         |       No | Thời gian xử lý              |
| created_at     | TIMESTAMPTZ         |      Yes | Auto                         |
| updated_at     | TIMESTAMPTZ         |      Yes | Auto                         |

## 8.20 notifications - Could Have

Owner: `Spring Boot`

| Column     | Type                | Required | Note          |
| ---------- | ------------------- | -------: | ------------- |
| id         | BIGSERIAL           |      Yes | PK            |
| user_id    | BIGINT FK users(id) |       No | Người nhận    |
| title      | VARCHAR(150)        |      Yes | Tiêu đề       |
| content    | TEXT                |      Yes | Nội dung      |
| is_read    | BOOLEAN             |      Yes | Default false |
| created_at | TIMESTAMPTZ         |      Yes | Auto          |

## 8.21 mock_device_events - Optional

Owner: `Spring Boot`

| Column     | Type                | Required | Note                     |
| ---------- | ------------------- | -------: | ------------------------ |
| id         | BIGSERIAL           |      Yes | PK                       |
| event_type | VARCHAR(50)         |      Yes | CAMERA_SCAN/BARRIER_OPEN |
| payload    | JSONB               |       No | Dữ liệu mock             |
| created_by | BIGINT FK users(id) |       No | User                     |
| created_at | TIMESTAMPTZ         |      Yes | Auto                     |

## 8.22 system_configs - Could Have

Owner: `.NET`

| Column       | Type                | Required | Note    |
| ------------ | ------------------- | -------: | ------- |
| id           | BIGSERIAL           |      Yes | PK      |
| config_key   | VARCHAR(100)        |      Yes | Unique  |
| config_value | TEXT                |      Yes | Giá trị |
| description  | TEXT                |       No | Mô tả   |
| updated_by   | BIGINT FK users(id) |       No | Admin   |
| updated_at   | TIMESTAMPTZ         |      Yes | Auto    |

## 8.23 reservations

Owner: `.NET`

| Column      | Type                          | Required | Note                                           |
| ----------- | ----------------------------- | -------: | ---------------------------------------------- |
| id          | BIGSERIAL                     |      Yes | PK                                             |
| driver_id   | BIGINT FK driver_profiles(id) |       No | Tài xế đặt chỗ                                 |
| slot_id     | BIGINT FK slots(id)           |      Yes | Slot ô tô được giữ                             |
| reserved_at | TIMESTAMPTZ                   |      Yes | Thời điểm đặt                                  |
| expires_at  | TIMESTAMPTZ                   |      Yes | Thời điểm hết hạn (thời gian vào + 15p)        |
| status      | VARCHAR(30)                   |      Yes | PENDING/COMPLETED/CANCELLED/EXPIRED            |
| created_at  | TIMESTAMPTZ                   |      Yes | Auto                                           |
| updated_at  | TIMESTAMPTZ                   |      Yes | Auto                                           |

Indexes:

```sql
CREATE INDEX ix_reservations_driver ON reservations(driver_id);
CREATE INDEX ix_reservations_slot ON reservations(slot_id);
CREATE INDEX ix_reservations_status ON reservations(status);
```

---

# 9. State Transition Rules

## 9.1 Parking Card

```text
AVAILABLE -> IN_USE       khi Entry tạo session
IN_USE -> AVAILABLE       khi Exit complete/cancel và card không LOST/DAMAGED/INACTIVE
IN_USE -> LOST            khi lost card approved
AVAILABLE -> LOST         Manager/Admin mark lost
AVAILABLE -> DAMAGED      Manager/Admin mark damaged
AVAILABLE -> INACTIVE     Manager/Admin deactivate
```

Không cho dùng card nếu status khác `AVAILABLE`.

## 9.2 Slot

```text
AVAILABLE -> OCCUPIED     khi Entry thành công
OCCUPIED -> AVAILABLE     khi Exit complete/cancel/move session
AVAILABLE -> LOCKED       Manager/Admin khóa
AVAILABLE -> MAINTENANCE  Manager/Admin bảo trì
LOCKED/MAINTENANCE -> AVAILABLE khi mở lại
```

Không chuyển slot `OCCUPIED` sang `LOCKED/MAINTENANCE` nếu đang gắn active session, trừ khi đi qua flow move/cancel có transaction.

## 9.3 Parking Session

```text
ACTIVE -> COMPLETED           exit thành công
ACTIVE -> LOST_CARD_PENDING   tạo lost card case
LOST_CARD_PENDING -> ACTIVE   lost card rejected
LOST_CARD_PENDING -> COMPLETED lost card approved + exit
ACTIVE -> MISMATCH_PENDING    phát hiện sai biển số
MISMATCH_PENDING -> ACTIVE    mismatch confirmed
MISMATCH_PENDING -> ACTIVE    mismatch rejected nhưng không cho exit
ACTIVE/PENDING -> CANCELLED   Admin cancel
```

Không hủy session `COMPLETED`.

## 9.4 Payment

```text
PENDING -> PAID          staff thu tiền
PENDING -> FAILED        lỗi thao tác hoặc hủy attempt
PENDING/FAILED -> CANCELLED khi session cancel
PENDING -> WAIVED        monthly pass valid hoặc manager waive
PENDING -> NOT_REQUIRED  monthly pass valid không cần thu
```

Không sửa payment final: `PAID`, `WAIVED`, `NOT_REQUIRED`.

---

# 10. ASP.NET Core Architecture

## 10.1 Project Structure

```text
ParkingBuilding.CoreApi
├── Controllers
│   ├── AuthController.cs
│   ├── UsersController.cs
│   ├── DriversController.cs
│   ├── VehicleTypesController.cs
│   ├── VehiclesController.cs
│   ├── CardsController.cs
│   ├── FloorsController.cs
│   ├── AreasController.cs
│   ├── SlotsController.cs
│   ├── GatesController.cs
│   ├── ParkingSessionsController.cs
│   ├── PaymentsController.cs
│   ├── MonthlyPassesController.cs
│   ├── LostCardCasesController.cs
│   ├── PlateMismatchController.cs
│   └── PricingRulesController.cs
├── Application
│   ├── Auth
│   ├── Users
│   ├── Drivers
│   ├── Vehicles
│   ├── Cards
│   ├── ParkingStructure
│   ├── ParkingSessions
│   ├── FeeCalculation
│   ├── Payments
│   ├── MonthlyPasses
│   ├── LostCards
│   ├── Mismatch
│   ├── Pricing
│   └── Audit
├── Domain
│   ├── Entities
│   ├── Enums
│   └── ValueObjects
├── Infrastructure
│   ├── Persistence
│   │   ├── ParkingDbContext.cs
│   │   ├── Configurations
│   │   └── Migrations (deprecated, do not use)
│   ├── Repositories
│   └── Security
├── Contracts
│   ├── Requests
│   ├── Responses
│   └── Common
└── Program.cs
```

## 10.2 Packages Đề Xuất

```text
Microsoft.EntityFrameworkCore
Npgsql.EntityFrameworkCore.PostgreSQL
Microsoft.AspNetCore.Authentication.JwtBearer
BCrypt.Net-Next
FluentValidation.AspNetCore
AutoMapper.Extensions.Microsoft.DependencyInjection
Swashbuckle.AspNetCore
```

Không cần package xuất Excel trong .NET nếu Excel export giao cho Spring Boot.

---

# 11. Spring Boot Architecture

## 11.1 Project Structure

```text
parking-building-support-api
├── src/main/java/com/parkingbuilding/support
│   ├── ParkingBuildingSupportApplication.java
│   ├── common
│   │   ├── ApiResponse.java
│   │   ├── ErrorResponse.java
│   │   ├── PageResponse.java
│   │   └── exception
│   ├── config
│   │   ├── SecurityConfig.java
│   │   ├── JwtConfig.java
│   │   └── CorsConfig.java
│   ├── security
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenValidator.java
│   ├── publicapi
│   ├── dashboard
│   ├── report
│   ├── auditlog
│   ├── feedback
│   ├── notification
│   ├── mockdevice
│   └── sharedreadmodel
└── src/main/resources/application.yml
```

## 11.2 Packages Đề Xuất

```text
spring-boot-starter-web
spring-boot-starter-security
spring-boot-starter-data-jpa
postgresql
jjwt-api / jjwt-impl / jjwt-jackson
lombok
mapstruct
springdoc-openapi-starter-webmvc-ui
apache-poi
```

## 11.3 Read-Only Repository Rule

Với bảng core do .NET sở hữu, Spring Boot repository chỉ expose query methods. Không gọi `save`, `delete`, `flush` cho:

```text
users
driver_profiles
vehicles
vehicle_types
parking_cards
floors
areas
area_vehicle_types
slots
gates
parking_sessions
pricing_rules
payments
monthly_passes
lost_card_cases
plate_mismatch_cases
```

Ngoại lệ:

- `audit_logs`: Spring được insert append-only cho action của support service.
- `feedbacks`, `notifications`, `mock_device_events`: Spring sở hữu nếu triển khai.

---

# 12. .NET Core API Module Breakdown

## 12.1 Module Auth

FR liên quan: FR-01, FR-03.08.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                | Role          | Mô tả                        |
| ------ | ----------------------- | ------------- | ---------------------------- |
| POST   | `/api/core/auth/login`  | Public        | Đăng nhập user nội bộ/driver |
| POST   | `/api/core/auth/logout` | Authenticated | Đăng xuất logic              |
| GET    | `/api/core/auth/me`     | Authenticated | Lấy user hiện tại            |

DTO:

```csharp
LoginRequest { usernameOrEmailOrPhone, password }
LoginResponse { accessToken, tokenType, expiresAt, user }
CurrentUserResponse { id, username, fullName, role, status }
```

Services:

```csharp
IAuthService.LoginAsync(LoginRequest request)
IAuthService.GetCurrentUserAsync(long userId)
IAuthService.ValidateUserStatusAsync(User user)
IJwtTokenService.GenerateToken(User user)
IPasswordHasher.Verify(string password, string passwordHash)
```

Repository:

```csharp
UserRepository.GetByUsernameAsync(string username)
UserRepository.GetByEmailAsync(string email)
UserRepository.GetByPhoneAsync(string phone)
```

Business validation:

| Validation                         | Error                 |
| ---------------------------------- | --------------------- |
| Sai username/password              | `INVALID_CREDENTIALS` |
| User LOCKED/INACTIVE               | `ACCOUNT_LOCKED`      |
| Password plain text không được lưu | Dev rule              |

Frontend:

| Page/Component | Mô tả          |
| -------------- | -------------- |
| LoginPage      | Login chung    |
| AuthProvider   | Lưu token/user |
| ProtectedRoute | Check auth     |
| RoleBasedRoute | Check role     |

Test cases:

| Test ID    | Mô tả                                |
| ---------- | ------------------------------------ |
| TC-AUTH-01 | Staff login thành công nhận JWT      |
| TC-AUTH-02 | Sai password trả 401                 |
| TC-AUTH-03 | Account LOCKED không login được      |
| TC-AUTH-04 | Spring verify JWT từ .NET thành công |

## 12.2 Module User Management

FR liên quan: FR-02.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                      | Role  |
| ------ | ----------------------------- | ----- |
| GET    | `/api/core/users`             | ADMIN |
| POST   | `/api/core/users`             | ADMIN |
| GET    | `/api/core/users/{id}`        | ADMIN |
| PUT    | `/api/core/users/{id}`        | ADMIN |
| PATCH  | `/api/core/users/{id}/status` | ADMIN |
| PATCH  | `/api/core/users/{id}/role`   | ADMIN |

DTO:

```csharp
UserSearchRequest { keyword, role, status, page, pageSize }
CreateUserRequest { fullName, username, email, phone, password, role }
UpdateUserRequest { fullName, email, phone }
ChangeUserStatusRequest { status, reason }
ChangeUserRoleRequest { role, reason }
UserResponse { id, fullName, username, email, phone, role, status }
```

Services:

```csharp
IUserService.GetUsersAsync(UserSearchRequest request)
IUserService.CreateInternalUserAsync(CreateUserRequest request, long adminId)
IUserService.UpdateUserAsync(long id, UpdateUserRequest request, long adminId)
IUserService.ChangeStatusAsync(long id, UserStatus status, string reason, long adminId)
IUserService.ChangeRoleAsync(long id, UserRole role, string reason, long adminId)
IUserService.ValidateUniqueUsernameEmailPhoneAsync(...)
```

Repository:

```csharp
UserRepository.SearchAsync(...)
UserRepository.ExistsByUsernameAsync(...)
UserRepository.ExistsByEmailAsync(...)
UserRepository.ExistsByPhoneAsync(...)
```

Business validation:

| Validation                | Error                     |
| ------------------------- | ------------------------- |
| Username trùng            | `USERNAME_ALREADY_EXISTS` |
| Email trùng               | `EMAIL_ALREADY_EXISTS`    |
| Phone trùng               | `PHONE_ALREADY_EXISTS`    |
| Staff gọi user management | 403                       |

Frontend:

| Page/Component     | Mô tả          |
| ------------------ | -------------- |
| UserManagementPage | Danh sách user |
| UserCreateModal    | Tạo user       |
| UserStatusAction   | Lock/unlock    |
| UserRoleSelect     | Đổi role       |

Test cases:

| Test ID    | Mô tả                          |
| ---------- | ------------------------------ |
| TC-USER-01 | Admin tạo Staff                |
| TC-USER-02 | Không tạo username trùng       |
| TC-USER-03 | Admin khóa user                |
| TC-USER-04 | Staff không gọi được API admin |

## 12.3 Module Driver Account - Should Have

FR liên quan: FR-03.06 đến FR-03.10.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                           | Role   |
| ------ | ---------------------------------- | ------ |
| POST   | `/api/core/driver/register`        | Public |
| GET    | `/api/core/driver/me`              | DRIVER |
| PUT    | `/api/core/driver/me`              | DRIVER |
| GET    | `/api/core/driver/vehicles`        | DRIVER |
| POST   | `/api/core/driver/vehicles`        | DRIVER |
| GET    | `/api/core/driver/parking-history` | DRIVER |

DTO:

```csharp
DriverRegisterRequest { fullName, email, phone, password }
UpdateDriverProfileRequest { fullName, email, phone }
CreateDriverVehicleRequest { plateNumber, vehicleTypeId, description }
DriverVehicleResponse { id, plateNumber, vehicleType, status }
DriverParkingHistoryResponse { sessionCode, plateNumber, entryTime, exitTime, totalAmount, status }
```

Services:

```csharp
IDriverService.RegisterAsync(DriverRegisterRequest request)
IDriverService.GetMyProfileAsync(long userId)
IDriverService.UpdateMyProfileAsync(long userId, UpdateDriverProfileRequest request)
IDriverVehicleService.GetMyVehiclesAsync(long userId)
IDriverVehicleService.CreateVehicleAsync(long userId, CreateDriverVehicleRequest request)
IDriverService.GetParkingHistoryAsync(long userId, PageRequest request)
```

Business validation:

| Validation                   | Error                                           |
| ---------------------------- | ----------------------------------------------- |
| Email/phone trùng user       | `EMAIL_ALREADY_EXISTS` / `PHONE_ALREADY_EXISTS` |
| Vehicle type inactive        | `VEHICLE_TYPE_INACTIVE`                         |
| Driver xem history user khác | 403                                             |

Rule:

- Driver register do .NET ghi `users` role DRIVER và `driver_profiles`.
- Support API không ghi trực tiếp bảng Driver hoặc Vehicle.

Frontend:

| Page/Component     | Mô tả       |
| ------------------ | ----------- |
| DriverRegisterPage | Should Have |
| DriverProfilePage  | Should Have |
| MyVehiclesPage     | Should Have |
| ParkingHistoryPage | Should Have |

Test cases:

| Test ID   | Mô tả                                    |
| --------- | ---------------------------------------- |
| TC-DRV-01 | Driver register bằng email               |
| TC-DRV-02 | Driver thêm xe cá nhân                   |
| TC-DRV-03 | Driver xem lịch sử của mình              |
| TC-DRV-04 | Driver không xem được history người khác |

## 12.4 Module Vehicle Type And Vehicle

FR liên quan: FR-05, FR-03.09, FR-07.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                              | Role                |
| ------ | ------------------------------------- | ------------------- |
| GET    | `/api/core/vehicle-types`             | Public/Auth         |
| POST   | `/api/core/vehicle-types`             | MANAGER/ADMIN       |
| PATCH  | `/api/core/vehicle-types/{id}/active` | MANAGER/ADMIN       |
| GET    | `/api/core/vehicles`                  | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/vehicles`                  | STAFF/MANAGER/ADMIN |

Services:

```csharp
IVehicleTypeService.GetActiveVehicleTypesAsync()
IVehicleTypeService.GetVehicleTypesAsync()
IVehicleTypeService.ChangeActiveStatusAsync(long id, bool isActive, long userId)
IVehicleService.FindOrCreateVehicleForEntryAsync(...)
IVehicleService.FindByPlateNumberAsync(string plateNumber)
IVehicleService.CheckVehicleHasActiveSessionAsync(string plateNumber)
IVehicleService.NormalizePlateNumber(string plateNumber)
```

Repository:

```csharp
VehicleTypeRepository.GetActiveAsync()
VehicleRepository.FindByNormalizedPlateAsync(string normalizedPlate)
ParkingSessionRepository.ExistsActiveByPlateAsync(string normalizedPlate)
```

Business validation:

| Validation                      | Error                          |
| ------------------------------- | ------------------------------ |
| Vehicle type inactive khi entry | `VEHICLE_TYPE_INACTIVE`        |
| Plate đang có active session    | `VEHICLE_HAS_ACTIVE_SESSION`   |
| Xe không biển số phải có mô tả  | `VEHICLE_DESCRIPTION_REQUIRED` |

Frontend:

| Component                 | Mô tả                   |
| ------------------------- | ----------------------- |
| VehicleTypeSelect         | Dropdown loại xe        |
| VehicleTypeManagementPage | Manager quản lý loại xe |
| PlateNumberInput          | Nhập biển số            |
| NoPlateToggle             | Xe không biển số        |
| VehicleDescriptionInput   | Mô tả                   |

Test cases:

| Test ID   | Mô tả                                    |
| --------- | ---------------------------------------- |
| TC-VEH-01 | Lấy danh sách loại xe active             |
| TC-VEH-02 | Manager tắt loại xe                      |
| TC-VEH-03 | Không entry với loại xe inactive         |
| TC-VEH-04 | Xe đã active session không tạo entry mới |

## 12.5 Module Parking Card

FR liên quan: FR-04, FR-07, FR-09, FR-14, FR-16.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                            | Role                |
| ------ | --------------------------------------------------- | ------------------- |
| GET    | `/api/core/cards`                                   | MANAGER/ADMIN       |
| POST   | `/api/core/cards`                                   | MANAGER/ADMIN       |
| GET    | `/api/core/cards/available`                         | STAFF/MANAGER/ADMIN |
| GET    | `/api/core/cards/{id}`                              | MANAGER/ADMIN       |
| PATCH  | `/api/core/cards/{id}/status`                       | MANAGER/ADMIN       |
| GET    | `/api/core/cards/by-code/{cardCode}/active-session` | STAFF/MANAGER/ADMIN |

DTO:

```csharp
CreateCardRequest { cardCode, note }
CardResponse { id, cardCode, qrToken, status, currentSessionId }
ChangeCardStatusRequest { status, reason }
ActiveSessionByCardResponse { card, session }
```

Services:

```csharp
IParkingCardService.CreateCardAsync(CreateCardRequest request, long userId)
IParkingCardService.GetCardsAsync(CardSearchRequest request)
IParkingCardService.GetAvailableCardsAsync()
IParkingCardService.ValidateCardAvailableAsync(long cardId)
IParkingCardService.MarkInUseAsync(long cardId, long sessionId)
IParkingCardService.MarkAvailableAsync(long cardId)
IParkingCardService.MarkLostAsync(long cardId, string reason)
IParkingCardService.ChangeStatusAsync(long cardId, CardStatus status, string reason, long userId)
IParkingCardService.GenerateQrToken()
```

Repository:

```csharp
ParkingCardRepository.FindByCardCodeAsync(string cardCode)
ParkingCardRepository.FindByQrTokenAsync(string qrToken)
ParkingCardRepository.FindByStatusAsync(CardStatus status)
ParkingCardRepository.ExistsByCardCodeAsync(string cardCode)
ParkingCardRepository.ExistsByQrTokenAsync(string qrToken)
```

Business validation:

| Validation                                  | Error                      |
| ------------------------------------------- | -------------------------- |
| cardCode trùng                              | `CARD_CODE_ALREADY_EXISTS` |
| qrToken trùng                               | `QR_TOKEN_ALREADY_EXISTS`  |
| Card không AVAILABLE khi entry              | `CARD_NOT_AVAILABLE`       |
| Card IN_USE không có active session         | `CARD_STATE_CONFLICT`      |
| Card LOST/DAMAGED/INACTIVE không dùng entry | `CARD_NOT_AVAILABLE`       |

Frontend:

| Page/Component      | Mô tả                      |
| ------------------- | -------------------------- |
| CardManagementPage  | Manager/Admin quản lý card |
| CardListTable       | Danh sách card             |
| CardCreateModal     | Tạo card                   |
| CardStatusBadge     | Trạng thái card            |
| CardStatusAction    | LOST/DAMAGED/INACTIVE      |
| AvailableCardSelect | Staff chọn card lúc entry  |
| CardCodeInput       | Staff nhập card lúc exit   |

Test cases:

| Test ID    | Mô tả                                       |
| ---------- | ------------------------------------------- |
| TC-CARD-01 | Manager tạo card C001                       |
| TC-CARD-02 | Không cho tạo cardCode trùng                |
| TC-CARD-03 | Card AVAILABLE được gán vào session         |
| TC-CARD-04 | Card IN_USE không được dùng cho session mới |
| TC-CARD-05 | Card LOST không được dùng lại               |

## 12.6 Module Parking Structure

FR liên quan: FR-06, FR-08, FR-17.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                    | Role                |
| ------ | ------------------------------------------- | ------------------- |
| GET    | `/api/core/floors`                          | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/floors`                          | MANAGER/ADMIN       |
| PUT    | `/api/core/floors/{id}`                     | MANAGER/ADMIN       |
| GET    | `/api/core/areas`                           | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/areas`                           | MANAGER/ADMIN       |
| PUT    | `/api/core/areas/{id}`                      | MANAGER/ADMIN       |
| GET    | `/api/core/slots`                           | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/slots`                           | MANAGER/ADMIN       |
| PATCH  | `/api/core/slots/{id}/status`               | MANAGER/ADMIN       |
| POST   | `/api/core/parking-sessions/{id}/move-slot` | MANAGER/ADMIN       |
| GET    | `/api/core/gates`                           | STAFF/MANAGER/ADMIN |

Services:

```csharp
IFloorService.GetFloorsAsync()
IAreaService.GetAreasAsync(AreaSearchRequest request)
IAreaService.SetAllowedVehicleTypesAsync(long areaId, long[] vehicleTypeIds)
ISlotService.GetSlotsAsync(SlotSearchRequest request)
ISlotService.FindFirstAvailableSlotAsync(long areaId, long vehicleTypeId)
ISlotService.MarkOccupiedAsync(long slotId, long sessionId)
ISlotService.MarkAvailableAsync(long slotId)
ISlotService.ChangeSlotStatusAsync(long slotId, SlotStatus status, string reason, long userId)
ISlotService.MoveSessionSlotAsync(long sessionId, MoveSlotRequest request, long userId)
IGateService.ValidateEntryGateAsync(long gateId)
IGateService.ValidateExitGateAsync(long gateId)
```

Repository:

```csharp
SlotRepository.CountAvailableByAreaAndVehicleTypeAsync(...)
SlotRepository.FindFirstAvailableByAreaAndVehicleTypeAsync(...)
AreaRepository.FindActiveAreasByVehicleTypeAsync(...)
GateRepository.FindByTypeAndStatusAsync(...)
```

Business validation:

| Validation                                        | Error                           |
| ------------------------------------------------- | ------------------------------- |
| Area LOCKED/MAINTENANCE                           | `AREA_NOT_AVAILABLE`            |
| Slot không AVAILABLE khi entry                    | `SLOT_NOT_AVAILABLE`            |
| Slot không match vehicle type                     | `SLOT_VEHICLE_TYPE_NOT_ALLOWED` |
| Change status slot OCCUPIED không qua flow hợp lệ | `SLOT_HAS_ACTIVE_SESSION`       |
| Move slot thiếu reason                            | `REASON_REQUIRED`               |

Frontend:

| Page/Component          | Mô tả                         |
| ----------------------- | ----------------------------- |
| StructureManagementPage | Quản lý tầng/khu/slot         |
| SlotMap                 | Sơ đồ slot đơn giản           |
| SlotStatusBadge         | Màu trạng thái                |
| SlotStatusAction        | Đổi status                    |
| MoveSlotModal           | Chuyển session sang slot khác |

Test cases:

| Test ID      | Mô tả                                               |
| ------------ | --------------------------------------------------- |
| TC-STRUCT-01 | Manager tạo floor/area/slot                         |
| TC-STRUCT-02 | Không tạo trùng slot trong cùng area                |
| TC-STRUCT-03 | Đổi slot AVAILABLE sang LOCKED                      |
| TC-STRUCT-04 | Không khóa slot đang OCCUPIED nếu không move/cancel |
| TC-STRUCT-05 | Move session cập nhật slot cũ/mới đúng              |

## 12.7 Module Slot Suggestion

FR liên quan: FR-08, FR-07.06 đến FR-07.10.

Owner: `.NET Core API`

API:

| Method | Endpoint                                  | Role                |
| ------ | ----------------------------------------- | ------------------- |
| POST   | `/api/core/parking-sessions/suggest-slot` | STAFF/MANAGER/ADMIN |

Request:

```json
{
  "vehicleTypeId": 3,
  "preferredFloorId": null
}
```

Response:

```json
{
  "areaId": 2,
  "areaCode": "A",
  "slotId": 35,
  "slotCode": "A-035",
  "reason": "Khu A còn nhiều slot trống nhất và ưu tiên gần cổng"
}
```

Services:

```csharp
ISlotSuggestionService.SuggestSlotAsync(SuggestSlotRequest request)
ISlotSuggestionService.FindCandidateAreasAsync(long vehicleTypeId)
ISlotSuggestionService.RemoveUnavailableAreasAsync(...)
ISlotSuggestionService.SortByAvailableSlotsAndPriority(...)
ISlotSuggestionService.PickFirstAvailableSlotAsync(...)
ISlotSuggestionService.BuildSuggestionReason(...)
```

Business validation:

| Validation                          | Error                             |
| ----------------------------------- | --------------------------------- |
| Không có area phù hợp               | `NO_AVAILABLE_AREA`               |
| Không có slot phù hợp               | `NO_AVAILABLE_SLOT`               |
| Staff chọn khác suggestion          | `SUGGESTION_OVERRIDE_NOT_ALLOWED` |
| Manager/Admin override thiếu reason | `OVERRIDE_REASON_REQUIRED`        |

Test cases:

| Test ID   | Mô tả                            |
| --------- | -------------------------------- |
| TC-SUG-01 | Đề xuất khu đúng loại xe         |
| TC-SUG-02 | Bỏ qua khu LOCKED                |
| TC-SUG-03 | Ưu tiên khu nhiều slot trống hơn |
| TC-SUG-04 | Staff không override suggestion  |
| TC-SUG-05 | Manager override có audit log    |

## 12.8 Module Entry Processing

FR liên quan: FR-07, FR-08, FR-13.

Owner: `.NET Core API`

API:

| Method | Endpoint                           | Role                |
| ------ | ---------------------------------- | ------------------- |
| POST   | `/api/core/parking-sessions/entry` | STAFF/MANAGER/ADMIN |

Request:

```json
{
  "entryGateId": 1,
  "plateNumber": "51A-12345",
  "noPlate": false,
  "vehicleDescription": null,
  "vehicleTypeId": 3,
  "cardId": 10,
  "selectedAreaId": 2,
  "selectedSlotId": 35,
  "overrideReason": null
}
```

Response:

```json
{
  "sessionId": 1001,
  "sessionCode": "PS202605210001",
  "status": "ACTIVE",
  "customerType": "CASUAL",
  "cardCode": "C001",
  "slotCode": "A-035",
  "entryTime": "2026-05-21T10:00:00+07:00"
}
```

Services:

```csharp
IEntryService.CreateEntrySessionAsync(CreateEntrySessionRequest request, long staffId)
IEntryService.ValidateEntryRequestAsync(CreateEntrySessionRequest request)
IEntryService.ValidateStaffCanCreateEntryAsync(long staffId)
IEntryService.ValidateCardAvailableAsync(long cardId)
IEntryService.ValidateVehicleNoActiveSessionAsync(string normalizedPlate)
IEntryService.FindOrCreateVehicleForEntryAsync(...)
IEntryService.DetectCustomerTypeAsync(string plateNumber, long vehicleTypeId)
IEntryService.ValidateMonthlyPassIfAnyAsync(...)
IEntryService.ValidateSelectedSlotMatchesSuggestionAsync(...)
IEntryService.GetPricingSnapshotAsync(long vehicleTypeId)
IEntryService.CreateParkingSessionAsync(...)
IEntryService.BindCardToSessionAsync(long cardId, long sessionId)
IEntryService.MarkSlotOccupiedAsync(long slotId, long sessionId)
IEntryService.WriteEntryAuditLogAsync(...)
IEntryService.GenerateSessionCodeAsync()
```

Repository:

```csharp
ParkingSessionRepository.ExistsActiveByCardAsync(long cardId)
ParkingSessionRepository.ExistsActiveByPlateAsync(string normalizedPlate)
ParkingSessionRepository.CreateAsync(ParkingSession session)
PricingRuleRepository.GetActiveByVehicleTypeAsync(long vehicleTypeId, DateTimeOffset time)
```

Transaction boundary:

`CreateEntrySessionAsync` chạy trong một transaction .NET. Rollback nếu bất kỳ bước nào lỗi:

- Không tạo session.
- Không đổi card sang `IN_USE`.
- Không đổi slot sang `OCCUPIED`.
- Không ghi audit log.

Business validation:

| Validation                   | Error                             |
| ---------------------------- | --------------------------------- |
| Card không AVAILABLE         | `CARD_NOT_AVAILABLE`              |
| Slot không AVAILABLE         | `SLOT_NOT_AVAILABLE`              |
| Xe đã active session         | `VEHICLE_HAS_ACTIVE_SESSION`      |
| NoPlate nhưng không có mô tả | `VEHICLE_DESCRIPTION_REQUIRED`    |
| Không có pricing active      | `PRICING_RULE_NOT_FOUND`          |
| Staff override suggestion    | `SUGGESTION_OVERRIDE_NOT_ALLOWED` |

Frontend:

| Page/Component   | Mô tả            |
| ---------------- | ---------------- |
| StaffEntryPage   | Màn xử lý xe vào |
| MockCameraButton | Điền biển số mẫu |
| EntryForm        | Form vào         |
| SuggestionPanel  | Hiển thị gợi ý   |
| EntryResultModal | Kết quả session  |

Test cases:

| Test ID     | Mô tả                                        |
| ----------- | -------------------------------------------- |
| TC-ENTRY-01 | Xe vãng lai vào thành công                   |
| TC-ENTRY-02 | Card chuyển IN_USE                           |
| TC-ENTRY-03 | Slot chuyển OCCUPIED                         |
| TC-ENTRY-04 | Duplicate active card bị chặn                |
| TC-ENTRY-05 | Duplicate active plate bị chặn               |
| TC-ENTRY-06 | Entry monthly pass nhận customerType MONTHLY |
| TC-ENTRY-07 | Snapshot giá được lưu                        |

## 12.9 Module Exit Processing

FR liên quan: FR-09, FR-10, FR-11, FR-13, FR-15.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                             | Role                |
| ------ | ---------------------------------------------------- | ------------------- |
| GET    | `/api/core/parking-sessions/{id}`                    | STAFF/MANAGER/ADMIN |
| GET    | `/api/core/parking-sessions/search`                  | STAFF/MANAGER/ADMIN |
| GET    | `/api/core/parking-sessions/by-card-code/{cardCode}` | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/parking-sessions/{id}/calculate-fee`      | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/parking-sessions/{id}/exit`               | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/parking-sessions/{id}/monthly-pass-exit`  | STAFF/MANAGER/ADMIN |

Casual exit request:

```json
{
  "exitGateId": 2,
  "exitPlateNumber": "51A-12345",
  "exitTime": "2026-05-21T14:30:00+07:00",
  "paymentId": 501
}
```

Monthly pass exit request:

```json
{
  "exitGateId": 2,
  "exitPlateNumber": "51A-12345",
  "exitTime": "2026-05-21T14:30:00+07:00"
}
```

Services:

```csharp
IExitService.FindActiveSessionByCardCodeAsync(string cardCode)
IExitService.SearchSessionsAsync(SessionSearchRequest request)
IExitService.ValidateSessionActiveAsync(long sessionId)
IExitService.ValidatePlateMatchOrRequireApprovalAsync(...)
IExitService.CompleteCasualExitAsync(long sessionId, ExitRequest request, long staffId)
IExitService.CompleteMonthlyPassExitAsync(long sessionId, MonthlyPassExitRequest request, long staffId)
IExitService.ValidatePaymentPaidAsync(long sessionId)
IExitService.MarkSessionCompletedAsync(...)
IExitService.ReleaseSlotAsync(...)
IExitService.ReleaseCardAsync(...)
IExitService.WriteExitAuditLogAsync(...)
```

Transaction boundary:

`CompleteCasualExitAsync` và `CompleteMonthlyPassExitAsync` chạy trong transaction .NET:

- Validate session active.
- Validate mismatch/lost-card state.
- Validate payment hoặc create waived/not-required payment.
- Mark session completed.
- Release slot.
- Release card nếu card không LOST/DAMAGED/INACTIVE.
- Write audit log.

Business validation:

| Validation                          | Error                              |
| ----------------------------------- | ---------------------------------- |
| Session không ACTIVE/pending hợp lệ | `SESSION_NOT_ACTIVE`               |
| Khách vãng lai chưa paid            | `PAYMENT_REQUIRED_BEFORE_EXIT`     |
| Lost card chưa approved             | `LOST_CARD_NOT_APPROVED`           |
| Plate mismatch chưa confirm         | `PLATE_MISMATCH_REQUIRES_APPROVAL` |
| Gate không phải EXIT                | `INVALID_EXIT_GATE`                |

Frontend:

| Page/Component     | Mô tả       |
| ------------------ | ----------- |
| StaffExitPage      | Màn xe ra   |
| SessionLookupPanel | Tìm session |
| FeeSummaryPanel    | Phí         |
| CashPaymentPanel   | Thanh toán  |

Test cases:

| Test ID    | Mô tả                            |
| ---------- | -------------------------------- |
| TC-EXIT-01 | Tìm session bằng Card Code       |
| TC-EXIT-02 | Casual exit sau paid thành công  |
| TC-EXIT-03 | Chưa paid không completed        |
| TC-EXIT-04 | Monthly pass exit hoàn thành lượt gửi không thu tiền |
| TC-EXIT-05 | Exit giải phóng card/slot        |
| TC-EXIT-06 | Sai biển số bị chặn              |

## 12.10 Module Fee Calculation

FR liên quan: FR-10, Pricing Specification.

Owner: `.NET Core API`

API:

| Method | Endpoint                                        | Role                |
| ------ | ----------------------------------------------- | ------------------- |
| POST   | `/api/core/parking-sessions/{id}/calculate-fee` | STAFF/MANAGER/ADMIN |

Request:

```json
{
  "exitTime": "2026-05-21T14:30:00+07:00",
  "includeLostCardFee": false
}
```

Response:

```json
{
  "sessionId": 1001,
  "entryTime": "2026-05-21T10:00:00+07:00",
  "exitTime": "2026-05-21T14:30:00+07:00",
  "amount": 10000,
  "lostCardFee": 0,
  "totalAmount": 10000,
  "breakdown": [
    {
      "timeFrame": "DAY",
      "blocks": 2,
      "unitPrice": 5000,
      "amount": 10000
    }
  ]
}
```

Services:

```csharp
IFeeCalculationService.CalculateFeeAsync(long sessionId, DateTimeOffset exitTime)
IFeeCalculationService.CalculateTemporaryFeeAsync(long sessionId, DateTimeOffset currentTime)
IFeeCalculationService.CalculateCasualFee(...)
IFeeCalculationService.CalculateMonthlyPassFee(...)
IFeeCalculationService.CalculateLostCardFee(...)
IFeeCalculationService.SplitDurationByTimeFrame(...)
IFeeCalculationService.CalculateBlocks(TimeSpan duration)
IFeeCalculationService.GetPricingSnapshotOrActiveRuleAsync(ParkingSession session)
IFeeCalculationService.BuildFeeBreakdown(...)
```

Fee rule:

- Block tính phí là 4 tiếng.
- Chưa đủ 4 tiếng vẫn tính 1 block.
- Nếu đi qua nhiều khung giờ, split duration theo khung.
- Monthly Pass valid: amount 0, payment `WAIVED` hoặc `NOT_REQUIRED`.
- Ưu tiên snapshot giá đã lưu lúc entry.

Test cases:

| Test ID   | Mô tả                         |
| --------- | ----------------------------- |
| TC-FEE-01 | Gửi dưới 4 tiếng tính 1 block |
| TC-FEE-02 | Gửi hơn 4 tiếng tính 2 block  |
| TC-FEE-03 | Gửi qua ngày/tối split đúng   |
| TC-FEE-04 | Lost card cộng fee            |
| TC-FEE-05 | Monthly pass tính 0đ          |

## 12.11 Module Payment

FR liên quan: FR-11, FR-09, FR-13.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                    | Role                |
| ------ | ------------------------------------------- | ------------------- |
| POST   | `/api/core/payments/cash`                   | STAFF/MANAGER/ADMIN |
| POST   | `/api/core/payments/waive`                  | MANAGER/ADMIN       |
| GET    | `/api/core/payments/{id}`                   | STAFF/MANAGER/ADMIN |
| GET    | `/api/core/payments/by-session/{sessionId}` | STAFF/MANAGER/ADMIN |

DTO:

```csharp
CashPaymentRequest { sessionId, amount, lostCardFee, totalAmount }
WaivePaymentRequest { sessionId, reason }
PaymentResponse { id, sessionId, totalAmount, method, status, paidAt, collectedBy }
```

Services:

```csharp
IPaymentService.CreateCashPaymentAsync(CashPaymentRequest request, long staffId)
IPaymentService.CreateWaivedPaymentAsync(long sessionId, string waiveReason, long userId)
IPaymentService.GetPaymentBySessionAsync(long sessionId)
IPaymentService.ValidatePaymentNotAlreadyFinalAsync(long sessionId)
IPaymentService.MarkPaymentCancelledForSessionAsync(long sessionId)
```

Business validation:

| Validation                   | Error                     |
| ---------------------------- | ------------------------- |
| Session không active         | `SESSION_NOT_ACTIVE`      |
| Payment đã final             | `PAYMENT_ALREADY_FINAL`   |
| Total amount không match fee | `PAYMENT_AMOUNT_MISMATCH` |
| Staff waive không được phép  | 403                       |

Test cases:

| Test ID   | Mô tả                           |
| --------- | ------------------------------- |
| TC-PAY-01 | Staff tạo cash payment          |
| TC-PAY-02 | Không tạo lại payment đã PAID   |
| TC-PAY-03 | Payment amount mismatch bị chặn |
| TC-PAY-04 | Waive payment cần Manager/Admin |

## 12.13 Module Monthly Pass

FR liên quan: FR-13, FR-09.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                               | Role                |
| ------ | -------------------------------------- | ------------------- |
| GET    | `/api/core/monthly-passes`             | MANAGER/ADMIN       |
| POST   | `/api/core/monthly-passes`             | MANAGER/ADMIN       |
| PUT    | `/api/core/monthly-passes/{id}`        | MANAGER/ADMIN       |
| PATCH  | `/api/core/monthly-passes/{id}/status` | MANAGER/ADMIN       |
| POST   | `/api/core/monthly-passes/{id}/renew`  | MANAGER/ADMIN       |
| GET    | `/api/core/monthly-passes/check`       | STAFF/MANAGER/ADMIN |

Services:

```csharp
IMonthlyPassService.CreateMonthlyPassAsync(CreateMonthlyPassRequest request, long userId)
IMonthlyPassService.UpdateMonthlyPassAsync(long id, UpdateMonthlyPassRequest request, long userId)
IMonthlyPassService.RenewAsync(long id, RenewMonthlyPassRequest request, long userId)
IMonthlyPassService.ChangeStatusAsync(long id, MonthlyPassStatus status, long userId)
IMonthlyPassService.FindValidPassAsync(string plateNumber, long vehicleTypeId, DateTimeOffset time)
IMonthlyPassService.IsValid(MonthlyPass pass, DateTimeOffset time)
```

Business validation:

| Validation              | Error                  |
| ----------------------- | ---------------------- |
| endDate < startDate     | `INVALID_DATE_RANGE`   |
| Pass LOCKED không valid | `MONTHLY_PASS_LOCKED`  |
| Pass hết hạn            | `MONTHLY_PASS_EXPIRED` |

Frontend:

| Page/Component            | Mô tả            |
| ------------------------- | ---------------- |
| MonthlyPassManagementPage | Quản lý vé tháng |
| MonthlyPassForm           | Tạo/sửa/gia hạn  |
| MonthlyPassStatusBadge    | Trạng thái       |

Test cases:

| Test ID   | Mô tả                            |
| --------- | -------------------------------- |
| TC-MON-01 | Manager tạo monthly pass         |
| TC-MON-02 | Renew tăng endDate               |
| TC-MON-03 | Entry detect monthly pass        |
| TC-MON-04 | Monthly pass exit không thu tiền |

## 12.14 Module Lost Card

FR liên quan: FR-14, FR-09, FR-10.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                 | Role                |
| ------ | ---------------------------------------- | ------------------- |
| POST   | `/api/core/lost-card-cases`              | STAFF/MANAGER/ADMIN |
| GET    | `/api/core/lost-card-cases`              | MANAGER/ADMIN       |
| GET    | `/api/core/lost-card-cases/{id}`         | MANAGER/ADMIN       |
| POST   | `/api/core/lost-card-cases/{id}/approve` | MANAGER/ADMIN       |
| POST   | `/api/core/lost-card-cases/{id}/reject`  | MANAGER/ADMIN       |

Services:

```csharp
ILostCardCaseService.CreateCaseAsync(CreateLostCardCaseRequest request, long staffId)
ILostCardCaseService.ApproveCaseAsync(long id, ApproveLostCardRequest request, long approverId)
ILostCardCaseService.RejectCaseAsync(long id, RejectLostCardRequest request, long approverId)
ILostCardCaseService.MarkSessionLostCardPendingAsync(long sessionId)
ILostCardCaseService.ApplyLostCardFeeAsync(long sessionId)
ILostCardCaseService.MarkCardLostIfConfirmedAsync(long cardId)
```

Business validation:

| Validation              | Error                            |
| ----------------------- | -------------------------------- |
| Session không active    | `SESSION_NOT_ACTIVE`             |
| Case pending đã tồn tại | `LOST_CARD_CASE_ALREADY_PENDING` |
| Staff approve           | 403                              |
| Reject thiếu reason     | `REJECTION_REASON_REQUIRED`      |

Transaction boundary:

- Create case: session `ACTIVE` -> `LOST_CARD_PENDING`, write audit.
- Approve: case APPROVED, apply lost fee, card LOST nếu xác nhận mất, write audit.
- Reject: case REJECTED, session back ACTIVE, write audit.

Frontend:

| Page/Component          | Mô tả               |
| ----------------------- | ------------------- |
| StaffLostCardPage       | Staff tạo hồ sơ     |
| LostCardApprovalPage    | Manager/Admin duyệt |
| LostCardCaseDetailModal | Chi tiết            |

Test cases:

| Test ID    | Mô tả                                 |
| ---------- | ------------------------------------- |
| TC-LOST-01 | Staff tạo lost card case              |
| TC-LOST-02 | Session chuyển LOST_CARD_PENDING      |
| TC-LOST-03 | Manager approve cộng phí              |
| TC-LOST-04 | Reject quay lại ACTIVE                |
| TC-LOST-05 | Pending chưa approved không exit được |

## 12.15 Module Plate Mismatch

FR liên quan: FR-15, FR-09.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                           | Role          |
| ------ | -------------------------------------------------- | ------------- |
| POST   | `/api/core/parking-sessions/{id}/mismatch/confirm` | MANAGER/ADMIN |
| POST   | `/api/core/parking-sessions/{id}/mismatch/reject`  | MANAGER/ADMIN |

Services:

```csharp
IPlateMismatchService.CheckPlateMismatchAsync(ParkingSession session, string exitPlateNumber)
IPlateMismatchService.MarkMismatchPendingAsync(long sessionId, string exitPlateNumber, long staffId)
IPlateMismatchService.ConfirmMismatchAsync(long sessionId, ConfirmMismatchRequest request, long managerId)
IPlateMismatchService.RejectMismatchAsync(long sessionId, RejectMismatchRequest request, long managerId)
```

Business validation:

| Validation                  | Error                              |
| --------------------------- | ---------------------------------- |
| Exit plate khác entry plate | `PLATE_MISMATCH_REQUIRES_APPROVAL` |
| Confirm thiếu reason        | `MISMATCH_REASON_REQUIRED`         |
| Staff confirm               | 403                                |

Frontend:

| Page/Component       | Mô tả               |
| -------------------- | ------------------- |
| MismatchWarningModal | Cảnh báo Staff      |
| MismatchApprovalPage | Manager/Admin duyệt |

Test cases:

| Test ID   | Mô tả                     |
| --------- | ------------------------- |
| TC-MIS-01 | Sai biển số tạo pending   |
| TC-MIS-02 | Staff không confirm được  |
| TC-MIS-03 | Manager confirm có reason |
| TC-MIS-04 | Rejected không cho exit   |

## 12.16 Module Session Administration And Cancellation

FR liên quan: FR-16, FR-17.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                                    | Role          |
| ------ | ------------------------------------------- | ------------- |
| POST   | `/api/core/parking-sessions/{id}/cancel`    | ADMIN         |
| POST   | `/api/core/parking-sessions/{id}/move-slot` | MANAGER/ADMIN |

Services:

```csharp
ISessionAdminService.CancelSessionAsync(long sessionId, CancelSessionRequest request, long adminId)
ISessionAdminService.ValidateSessionCanBeCancelledAsync(ParkingSession session)
ISessionAdminService.CancelPendingOrFailedPaymentsAsync(long sessionId)
ISessionAdminService.ReleaseSlotIfNeededAsync(ParkingSession session)
ISessionAdminService.ReleaseCardIfNeededAsync(ParkingSession session)
ISessionAdminService.WriteCancelAuditLogAsync(...)
```

Business validation:

| Validation          | Error                          |
| ------------------- | ------------------------------ |
| Session COMPLETED   | `SESSION_ALREADY_COMPLETED`    |
| Cancel thiếu reason | `CANCELLATION_REASON_REQUIRED` |
| Non-admin cancel    | 403                            |

Transaction boundary:

- Mark session `CANCELLED`.
- Release slot if needed.
- Release card if card can be available.
- Cancel pending/failed payment.
- Write audit.

Test cases:

| Test ID   | Mô tả                          |
| --------- | ------------------------------ |
| TC-CAN-01 | Admin cancel active session    |
| TC-CAN-02 | Cancel giải phóng slot/card    |
| TC-CAN-03 | Không cancel completed session |
| TC-CAN-04 | Cancel ghi audit log           |

## 12.17 Module Pricing Management

FR liên quan: FR-21, Pricing Specification.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                       | Role          |
| ------ | ------------------------------ | ------------- |
| GET    | `/api/core/pricing-rules`      | MANAGER/ADMIN |
| POST   | `/api/core/pricing-rules`      | MANAGER/ADMIN |
| PUT    | `/api/core/pricing-rules/{id}` | MANAGER/ADMIN |

Services:

```csharp
IPricingRuleService.GetPricingRulesAsync(PricingRuleSearchRequest request)
IPricingRuleService.GetActivePricingRuleAsync(long vehicleTypeId)
IPricingRuleService.CreatePricingRuleAsync(CreatePricingRuleRequest request, long userId)
IPricingRuleService.UpdatePricingRuleAsync(long id, UpdatePricingRuleRequest request, long userId)
IPricingRuleService.ValidatePricesNonNegative(...)
IPricingRuleService.WritePricingAuditLogAsync(...)
```

Business validation:

| Validation                   | Error                        |
| ---------------------------- | ---------------------------- |
| Giá âm                       | `PRICE_MUST_NOT_BE_NEGATIVE` |
| Vehicle type inactive        | `VEHICLE_TYPE_INACTIVE`      |
| Không có active pricing rule | `PRICING_RULE_NOT_FOUND`     |

Frontend:

| Page/Component        | Mô tả                                     |
| --------------------- | ----------------------------------------- |
| PricingManagementPage | Quản lý bảng giá                          |
| PricingRuleForm       | Cập nhật giá                              |
| PublicPricingPage     | Driver xem bảng giá qua Spring public API |

Test cases:

| Test ID     | Mô tả                                  |
| ----------- | -------------------------------------- |
| TC-PRICE-01 | Manager xem bảng giá                   |
| TC-PRICE-02 | Không lưu giá âm                       |
| TC-PRICE-03 | Update giá ghi audit                   |
| TC-PRICE-04 | Entry sau khi update dùng snapshot mới |

## 12.18 Module Audit Writer

FR liên quan: FR-20.

Owner: `.NET Core API` ghi action core.

Service:

```csharp
IAuditWriterService.WriteAsync(AuditLogEntry entry)
IAuditWriterService.WriteEntityChangeAsync(...)
IAuditWriterService.WriteBusinessActionAsync(...)
```

Action bắt buộc:

```text
USER_CREATED
USER_STATUS_CHANGED
USER_ROLE_CHANGED
CARD_CREATED
CARD_STATUS_CHANGED
SESSION_CREATED
SESSION_COMPLETED
SESSION_CANCELLED
SLOT_STATUS_CHANGED
SESSION_MOVED_SLOT
PAYMENT_PAID
PAYMENT_WAIVED
MONTHLY_PASS_CREATED
MONTHLY_PASS_RENEWED
LOST_CARD_CREATED
LOST_CARD_APPROVED
LOST_CARD_REJECTED
MISMATCH_CREATED
MISMATCH_CONFIRMED
MISMATCH_REJECTED
PRICING_UPDATED
```

Rule:

- Audit failure trong transaction core nên rollback nếu action là bắt buộc cho nghiệp vụ nhạy cảm.
- `source_service = CORE_API`.

## 12.19 Module Reservation

FR liên quan: MF-05.

Owner: `.NET Core API`

APIs:

| Method | Endpoint                            | Role                   | Mô tả                                     |
| ------ | ----------------------------------- | ---------------------- | ----------------------------------------- |
| POST   | `/api/core/reservations`            | DRIVER, STAFF          | Tạo lượt đặt chỗ mới, giữ slot            |
| POST   | `/api/core/reservations/{id}/cancel` | DRIVER, STAFF, MANAGER | Hủy lượt đặt chỗ trước hạn                |
| GET    | `/api/core/reservations/active`     | DRIVER, STAFF          | Lấy lượt đặt chỗ đang có hiệu lực         |

Business validation:

- Chỉ cho phép đặt trước đối với xe ô tô và slot thuộc khu vực quy định (Tầng B2).
- Slot được chọn phải có trạng thái là `AVAILABLE`.
- Khi tạo thành công, phải cập nhật `slots.status = 'RESERVED'` và ghi nhận log `RESERVATION_CREATED`.
- Mọi thao tác ghi phải nằm gọn trong một Transaction duy nhất của .NET.

---

# 13. Spring Boot API Module Breakdown

## 13.1 Module Public Driver APIs

FR liên quan: FR-03.01 đến FR-03.05, FR-10.10.

Owner: `Spring Boot Support API`

APIs:

| Method | Endpoint                                     | Role   | DB access          |
| ------ | -------------------------------------------- | ------ | ------------------ |
| GET    | `/api/public/parking-info`                   | Public | Read               |
| GET    | `/api/public/available-slots`                | Public | Read               |
| GET    | `/api/public/pricing`                        | Public | Read               |
| GET    | `/api/public/rules`                          | Public | Static/config read |
| GET    | `/api/public/cards/{qrToken}/active-session` | Public | Read               |

Services:

```java
PublicInfoService.getParkingInfo()
PublicInfoService.getAvailableSlots(AvailableSlotRequest request)
PublicInfoService.getPricing()
PublicInfoService.getRules()
PublicCardLookupService.getActiveSessionByQrToken(String qrToken)
PublicCardLookupService.maskPlateNumber(String plateNumber)
PublicCardLookupService.calculateTemporaryFeePreview(...)
```

Repository queries:

```java
ParkingCardReadRepository.findByQrToken(String qrToken)
ParkingSessionReadRepository.findActiveByCardId(Long cardId)
SlotReadRepository.countAvailableByVehicleType(Long vehicleTypeId)
PricingRuleReadRepository.findActiveRules()
```

Public QR response:

```json
{
  "cardCode": "C001",
  "sessionCode": "PS202605210001",
  "maskedPlateNumber": "51A-***45",
  "vehicleType": "Xe máy",
  "entryTime": "2026-05-21T10:00:00+07:00",
  "areaCode": "A",
  "slotCode": "A-035",
  "temporaryFeePreview": 10000,
  "status": "ACTIVE"
}
```

Privacy rule:

- Không trả full phone/email/user nội bộ.
- Không trả full actor/staff info.
- Biển số nên mask: `51A-***45`.
- Fee preview phải ghi là preview, fee chính thức do .NET tính khi exit.

Test cases:

| Test ID   | Mô tả                               |
| --------- | ----------------------------------- |
| TC-PUB-01 | Guest xem thông tin bãi xe          |
| TC-PUB-02 | Guest xem slot trống                |
| TC-PUB-03 | Guest xem bảng giá                  |
| TC-PUB-04 | QR lookup active session            |
| TC-PUB-05 | QR lookup không lộ dữ liệu nhạy cảm |

## 13.2 Module Dashboard

FR liên quan: FR-18.

Owner: `Spring Boot Support API`

APIs:

| Method | Endpoint                         | Role          |
| ------ | -------------------------------- | ------------- |
| GET    | `/api/support/dashboard/summary` | MANAGER/ADMIN |

Response:

```json
{
  "totalSlots": 100,
  "availableSlots": 60,
  "occupiedSlots": 35,
  "lockedOrMaintenanceSlots": 5,
  "occupancyRate": 35.0,
  "todayEntries": 120,
  "todayExits": 100,
  "todayRevenue": 2500000,
  "cardsAvailable": 30,
  "cardsInUse": 35,
  "pendingLostCardCases": 2,
  "pendingMismatchCases": 1
}
```

Services:

```java
DashboardService.getSummary()
DashboardService.countTotalSlots()
DashboardService.countAvailableSlots()
DashboardService.countOccupiedSlots()
DashboardService.countTodayEntries()
DashboardService.countTodayExits()
DashboardService.sumTodayRevenue()
DashboardService.countCardsByStatus()
DashboardService.countPendingLostCardCases()
DashboardService.countPendingMismatchCases()
```

Repository queries:

```java
SlotReadRepository.countByStatus(String status)
ParkingSessionReadRepository.countByEntryTimeBetween(...)
ParkingSessionReadRepository.countByExitTimeBetween(...)
PaymentReadRepository.sumTotalAmountByPaidAtBetweenAndStatus(...)
ParkingCardReadRepository.countByStatus(String status)
LostCardCaseReadRepository.countByStatus(String status)
PlateMismatchCaseReadRepository.countByStatus(String status)
```

Test cases:

| Test ID    | Mô tả                                    |
| ---------- | ---------------------------------------- |
| TC-DASH-01 | Dashboard verify JWT                     |
| TC-DASH-02 | Số slot trống đúng sau entry             |
| TC-DASH-03 | Doanh thu hôm nay đúng sau payment       |
| TC-DASH-04 | Query phản hồi dưới 5 giây với seed demo |

## 13.3 Module Reports

FR liên quan: FR-19.

Owner: `Spring Boot Support API`

APIs:

| Method | Endpoint                            | Role          |
| ------ | ----------------------------------- | ------------- |
| GET    | `/api/support/reports/revenue`      | MANAGER/ADMIN |
| GET    | `/api/support/reports/traffic`      | MANAGER/ADMIN |
| GET    | `/api/support/reports/occupancy`    | MANAGER/ADMIN |
| GET    | `/api/support/reports/cards`        | MANAGER/ADMIN |
| GET    | `/api/support/reports/sessions`     | MANAGER/ADMIN |
| GET    | `/api/support/reports/export-excel` | MANAGER/ADMIN |

Query convention:

```text
from=2026-05-01T00:00:00+07:00
to=2026-05-21T23:59:59+07:00
vehicleTypeId=3
groupBy=DAY|VEHICLE_TYPE|STAFF|AREA
```

Services:

```java
ReportService.getRevenueReport(DateRange range, ReportFilter filter)
ReportService.getTrafficReport(DateRange range, ReportFilter filter)
ReportService.getOccupancyReport(DateRange range, ReportFilter filter)
ReportService.getCardStatusReport()
ReportService.getSessionReport(SessionReportRequest request)
ReportExportService.exportRevenueExcel(DateRange range)
ReportExportService.exportTrafficExcel(DateRange range)
ReportExportService.exportAuditExcel(...)
```

Output Excel:

- Dùng Apache POI.
- File tối thiểu: Revenue, Traffic, Card status.
- Audit log export nếu kịp.

Test cases:

| Test ID   | Mô tả                       |
| --------- | --------------------------- |
| TC-RPT-01 | Báo cáo doanh thu theo ngày |
| TC-RPT-02 | Báo cáo traffic vào/ra      |
| TC-RPT-03 | Báo cáo occupancy theo area |
| TC-RPT-04 | Báo cáo card status         |
| TC-RPT-05 | Excel export mở được        |

## 13.4 Module Audit Log Search

FR liên quan: FR-20.12.

Owner: `Spring Boot Support API`

APIs:

| Method | Endpoint                               | Role          |
| ------ | -------------------------------------- | ------------- |
| GET    | `/api/support/audit-logs`              | MANAGER/ADMIN |
| GET    | `/api/support/audit-logs/{id}`         | MANAGER/ADMIN |
| GET    | `/api/support/audit-logs/export-excel` | ADMIN         |

Services:

```java
AuditLogQueryService.searchLogs(AuditLogSearchRequest request)
AuditLogQueryService.getLogDetail(Long id)
AuditLogExportService.exportAuditLogs(AuditLogSearchRequest request)
AuditLogWriterService.writeSupportAction(...)
```

Search filters:

```text
actorUserId
sourceService
action
targetType
targetId
from
to
keyword
page
pageSize
```

Rule:

- Spring được đọc audit log.
- Spring được insert audit log cho report export, feedback update, mock device event nếu cần.
- Spring không update/delete audit log.
- `source_service = SUPPORT_API`.

Test cases:

| Test ID     | Mô tả                        |
| ----------- | ---------------------------- |
| TC-AUDIT-01 | Search theo action           |
| TC-AUDIT-02 | Search theo date range       |
| TC-AUDIT-03 | Detail hiển thị old/new JSON |
| TC-AUDIT-04 | Export audit chỉ ADMIN       |

## 13.5 Module Feedback - Could Have

FR liên quan: FR-22.

Owner: `Spring Boot Support API`

APIs:

| Method | Endpoint                            | Role          |
| ------ | ----------------------------------- | ------------- |
| POST   | `/api/support/feedback`             | DRIVER        |
| GET    | `/api/support/feedback`             | MANAGER/ADMIN |
| PATCH  | `/api/support/feedback/{id}/status` | MANAGER/ADMIN |

Services:

```java
FeedbackService.createFeedback(CreateFeedbackRequest request, Long driverId)
FeedbackService.searchFeedback(FeedbackSearchRequest request)
FeedbackService.changeStatus(Long id, FeedbackStatus status, Long managerId)
```

Rule:

- Feedback không bắt buộc cho MVP core.
- Nếu làm, Spring sở hữu `feedbacks`.
- Ghi audit khi Manager/Admin đổi trạng thái.

## 13.6 Module Mock Device - Optional

FR liên quan: FR-23.

Owner: `Spring Boot Support API` hoặc frontend mock.

APIs:

| Method | Endpoint                         | Role                |
| ------ | -------------------------------- | ------------------- |
| POST   | `/api/support/mock-camera/scan`  | STAFF/MANAGER/ADMIN |
| POST   | `/api/support/mock-barrier/open` | STAFF/MANAGER/ADMIN |
| GET    | `/api/support/cards/{id}/qr`     | MANAGER/ADMIN       |

Rule:

- Mock device không tự tạo session.
- Mock camera chỉ trả biển số mẫu.
- Mock barrier chỉ hiển thị trạng thái/nút open.
- Session vẫn tạo qua `.NET /api/core/parking-sessions/entry`.

---

# 14. Frontend Architecture

## 14.1 React Structure

```text
src
├── app
│   ├── App.jsx
│   ├── routes.jsx
│   └── providers.jsx
├── api
│   ├── coreAxiosClient.js
│   ├── supportAxiosClient.js
│   ├── publicAxiosClient.js
│   ├── authApi.js
│   ├── driverApi.js
│   ├── parkingSessionApi.js
│   ├── cardApi.js
│   ├── structureApi.js
│   ├── paymentApi.js
│   ├── reportApi.js
│   └── publicApi.js
├── components
│   ├── ui
│   └── layout
├── pages
│   ├── admin
│   ├── driver
│   ├── manager
│   ├── staff
│   ├── public
│   └── error
├── hooks
├── utils
└── constants
```

## 14.2 Axios Clients

```javascript
export const coreApi = axios.create({
  baseURL: "http://localhost:5000",
});

export const supportApi = axios.create({
  baseURL: "http://localhost:8080",
});

export const publicApi = axios.create({
  baseURL: "http://localhost:8080",
});
```

Token interceptor dùng cho `coreApi` và `supportApi`; public pages không bắt buộc token.

```javascript
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 14.3 API Ownership Frontend

| Frontend feature                        | API client                    |
| --------------------------------------- | ----------------------------- |
| Login/Auth                              | coreApi                       |
| User management                         | coreApi                       |
| Driver account/profile/vehicles/history | coreApi                       |
| Vehicle Type/Vehicle                    | coreApi                       |
| Card management                         | coreApi                       |
| Structure management                    | coreApi                       |
| Entry/Exit                              | coreApi                       |
| Fee/Payment                             | coreApi                       |
| Monthly Pass                            | coreApi                       |
| Lost Card/Mismatch/Cancel               | coreApi                       |
| Pricing Management                      | coreApi                       |
| Dashboard                               | supportApi                    |
| Reports/Excel                           | supportApi                    |
| Audit Log                               | supportApi                    |
| Public parking info/pricing/rules       | publicApi                     |
| Public QR lookup                        | publicApi                     |
| Feedback                                | supportApi                    |
| Mock Device                             | supportApi hoặc frontend mock |

---

# 15. Frontend Page Breakdown

## 15.1 Public Driver Pages

| Page               | Route              | Priority | API                                              | Backend         |
| ------------------ | ------------------ | -------- | ------------------------------------------------ | --------------- |
| ParkingInfoPage    | `/`                | Must     | `GET /api/public/parking-info`                   | Spring          |
| AvailableSlotsPage | `/available-slots` | Must     | `GET /api/public/available-slots`                | Spring          |
| PublicPricingPage  | `/pricing`         | Must     | `GET /api/public/pricing`                        | Spring          |
| RulesPage          | `/rules`           | Must     | `GET /api/public/rules` hoặc static              | Spring/Frontend |
| CardLookupPage     | `/card/:qrToken`   | Must     | `GET /api/public/cards/{qrToken}/active-session` | Spring          |
| DriverRegisterPage | `/driver/register` | Should   | `POST /api/core/driver/register`                 | .NET            |
| DriverProfilePage  | `/driver/profile`  | Should   | `/api/core/driver/me`                            | .NET            |
| MyVehiclesPage     | `/driver/vehicles` | Should   | `/api/core/driver/vehicles`                      | .NET            |
| ParkingHistoryPage | `/driver/history`  | Should   | `/api/core/driver/parking-history`               | .NET            |

## 15.2 Staff Pages

| Page                   | Route                       | Priority | API                                             | Backend |
| ---------------------- | --------------------------- | -------- | ----------------------------------------------- | ------- |
| StaffEntryPage         | `/staff/entry`              | Must     | `POST /api/core/parking-sessions/entry`         | .NET    |
| StaffExitPage          | `/staff/exit`               | Must     | by-card, calculate-fee, payment, exit           | .NET    |
| StaffLostCardPage      | `/staff/lost-card`          | Must     | `POST /api/core/lost-card-cases`                | .NET    |
| StaffSessionSearchPage | `/staff/sessions`           | Must     | `GET /api/core/parking-sessions/search`         | .NET    |

## 15.3 Manager Pages

| Page                      | Route                      | Priority | API                                  | Backend |
| ------------------------- | -------------------------- | -------- | ------------------------------------ | ------- |
| ManagerDashboardPage      | `/manager/dashboard`       | Must     | `GET /api/support/dashboard/summary` | Spring  |
| CardManagementPage        | `/manager/cards`           | Must     | `/api/core/cards`                    | .NET    |
| StructureManagementPage   | `/manager/structure`       | Must     | floors/areas/slots/gates             | .NET    |
| PricingManagementPage     | `/manager/pricing`         | Must     | `/api/core/pricing-rules`            | .NET    |
| MonthlyPassManagementPage | `/manager/monthly-passes`  | Must     | `/api/core/monthly-passes`           | .NET    |
| LostCardApprovalPage      | `/manager/lost-card-cases` | Must     | `/api/core/lost-card-cases`          | .NET    |
| MismatchApprovalPage      | `/manager/mismatch`        | Must     | mismatch APIs                        | .NET    |
| ReportsPage               | `/manager/reports`         | Must     | `/api/support/reports/*`             | Spring  |
| AuditLogPage              | `/manager/audit-logs`      | Must     | `/api/support/audit-logs`            | Spring  |
| FeedbackPage              | `/manager/feedback`        | Could    | `/api/support/feedback`              | Spring  |

## 15.4 Admin Pages

| Page                      | Route               | Priority | API                        | Backend |
| ------------------------- | ------------------- | -------- | -------------------------- | ------- |
| UserManagementPage        | `/admin/users`      | Must     | `/api/core/users`          | .NET    |
| SessionAdministrationPage | `/admin/sessions`   | Must     | search + cancel            | .NET    |
| AdminAuditLogPage         | `/admin/audit-logs` | Must     | `/api/support/audit-logs`  | Spring  |
| SystemConfigurationPage   | `/admin/config`     | Could    | `/api/core/system-configs` | .NET    |

---

# 16. FR To API To Code Mapping Summary

| FR    | Module          | Main APIs                                        | Backend Owner                     | Frontend chính          | Test chính    |
| ----- | --------------- | ------------------------------------------------ | --------------------------------- | ----------------------- | ------------- |
| FR-01 | Auth            | `/api/core/auth/login`, `/me`                    | .NET                              | LoginPage               | TC-AUTH       |
| FR-02 | User            | `/api/core/users`                                | .NET                              | UserManagementPage      | TC-USER       |
| FR-03 | Driver/Public   | `/api/public/*`, `/api/core/driver/*`            | Spring public + .NET driver write | Driver pages            | TC-DRV/TC-PUB |
| FR-04 | Card            | `/api/core/cards/*`                              | .NET                              | CardManagementPage      | TC-CARD       |
| FR-05 | Vehicle         | `/api/core/vehicle-types`, `/api/core/vehicles`  | .NET                              | VehicleTypeSelect       | TC-VEH        |
| FR-06 | Structure       | `/api/core/floors`, `/areas`, `/slots`, `/gates` | .NET                              | StructureManagementPage | TC-STRUCT     |
| FR-07 | Entry           | `/api/core/parking-sessions/entry`               | .NET                              | StaffEntryPage          | TC-ENTRY      |
| FR-08 | Suggestion      | `/api/core/parking-sessions/suggest-slot`        | .NET                              | SuggestionPanel         | TC-SUG        |
| FR-09 | Exit            | `/exit`, `/monthly-pass-exit`                    | .NET                              | StaffExitPage           | TC-EXIT       |
| FR-10 | Fee             | `/calculate-fee`                                 | .NET                              | FeeSummaryPanel         | TC-FEE        |
| FR-11 | Payment         | `/api/core/payments/cash`, `/waive`              | .NET                              | CashPaymentPanel        | TC-PAY        |
| FR-13 | Monthly Pass    | `/api/core/monthly-passes`                       | .NET                              | MonthlyPassPage         | TC-MON        |
| FR-14 | Lost Card       | `/api/core/lost-card-cases`                      | .NET                              | LostCardPage            | TC-LOST       |
| FR-15 | Mismatch        | `/mismatch/confirm`, `/mismatch/reject`          | .NET                              | MismatchApprovalPage    | TC-MIS        |
| FR-16 | Cancel Session  | `/cancel`                                        | .NET                              | SessionAdminPage        | TC-CAN        |
| FR-17 | Slot Adjustment | `/slots/{id}/status`, `/move-slot`               | .NET                              | StructureManagementPage | TC-SLOT       |
| FR-18 | Dashboard       | `/api/support/dashboard/summary`                 | Spring                            | DashboardPage           | TC-DASH       |
| FR-19 | Reports         | `/api/support/reports/*`                         | Spring                            | ReportsPage             | TC-RPT        |
| FR-20 | Audit           | `/api/support/audit-logs`                        | .NET write + Spring search        | AuditLogPage            | TC-AUDIT      |
| FR-21 | Pricing         | `/api/core/pricing-rules`, `/api/public/pricing` | .NET write + Spring public read   | PricingPage             | TC-PRICE      |
| FR-22 | Feedback        | `/api/support/feedback`                          | Spring                            | FeedbackPage            | TC-FEED       |
| FR-23 | Mock Device     | `/api/support/mock-*`                            | Spring/Frontend                   | Mock buttons            | TC-MOCK       |
| FR-24 | Config          | `/api/core/system-configs`                       | .NET                              | ConfigPage              | TC-CONFIG     |

---

# 17. API Priority List By Backend

## 17.1 .NET Must Have APIs

```text
POST   /api/core/auth/login
POST   /api/core/auth/logout
GET    /api/core/auth/me

GET    /api/core/users
POST   /api/core/users
GET    /api/core/users/{id}
PUT    /api/core/users/{id}
PATCH  /api/core/users/{id}/status
PATCH  /api/core/users/{id}/role

GET    /api/core/vehicle-types
POST   /api/core/vehicle-types
PATCH  /api/core/vehicle-types/{id}/active
GET    /api/core/vehicles
POST   /api/core/vehicles

GET    /api/core/cards
POST   /api/core/cards
GET    /api/core/cards/available
GET    /api/core/cards/{id}
PATCH  /api/core/cards/{id}/status
GET    /api/core/cards/by-code/{cardCode}/active-session

GET    /api/core/floors
POST   /api/core/floors
PUT    /api/core/floors/{id}
GET    /api/core/areas
POST   /api/core/areas
PUT    /api/core/areas/{id}
GET    /api/core/slots
POST   /api/core/slots
PATCH  /api/core/slots/{id}/status
POST   /api/core/parking-sessions/{id}/move-slot
GET    /api/core/gates

POST   /api/core/parking-sessions/suggest-slot
POST   /api/core/parking-sessions/entry
GET    /api/core/parking-sessions/{id}
GET    /api/core/parking-sessions/search
GET    /api/core/parking-sessions/by-card-code/{cardCode}
POST   /api/core/parking-sessions/{id}/calculate-fee
POST   /api/core/parking-sessions/{id}/exit
POST   /api/core/parking-sessions/{id}/monthly-pass-exit
POST   /api/core/parking-sessions/{id}/cancel

GET    /api/core/pricing-rules
POST   /api/core/pricing-rules
PUT    /api/core/pricing-rules/{id}

POST   /api/core/payments/cash
POST   /api/core/payments/waive
GET    /api/core/payments/{id}
GET    /api/core/payments/by-session/{sessionId}

GET    /api/core/monthly-passes
POST   /api/core/monthly-passes
PUT    /api/core/monthly-passes/{id}
PATCH  /api/core/monthly-passes/{id}/status
POST   /api/core/monthly-passes/{id}/renew
GET    /api/core/monthly-passes/check

POST   /api/core/lost-card-cases
GET    /api/core/lost-card-cases
GET    /api/core/lost-card-cases/{id}
POST   /api/core/lost-card-cases/{id}/approve
POST   /api/core/lost-card-cases/{id}/reject

POST   /api/core/parking-sessions/{id}/mismatch/confirm
POST   /api/core/parking-sessions/{id}/mismatch/reject
```

## 17.2 .NET Should Have APIs

```text
POST   /api/core/driver/register
GET    /api/core/driver/me
PUT    /api/core/driver/me
GET    /api/core/driver/vehicles
POST   /api/core/driver/vehicles
GET    /api/core/driver/parking-history
```

## 17.3 Spring Boot Must Have APIs

```text
GET    /api/public/parking-info
GET    /api/public/available-slots
GET    /api/public/pricing
GET    /api/public/rules
GET    /api/public/cards/{qrToken}/active-session

GET    /api/support/dashboard/summary
GET    /api/support/reports/revenue
GET    /api/support/reports/traffic
GET    /api/support/reports/occupancy
GET    /api/support/reports/cards
GET    /api/support/reports/sessions
GET    /api/support/audit-logs
GET    /api/support/audit-logs/{id}
```

## 17.4 Spring Boot Should/Could APIs

```text
GET    /api/support/reports/export-excel
GET    /api/support/audit-logs/export-excel

POST   /api/support/feedback
GET    /api/support/feedback
PATCH  /api/support/feedback/{id}/status

POST   /api/support/mock-camera/scan
POST   /api/support/mock-barrier/open
GET    /api/support/cards/{id}/qr
```

---

# 18. Integration Rules Để Không Xung Đột

## 18.1 Không Duplicate Business Logic Core

Spring Boot không viết lại logic chính thức:

- Tạo parking session.
- Gán card cho session.
- Chuyển card `IN_USE/AVAILABLE`.
- Chuyển slot `OCCUPIED/AVAILABLE`.
- Tính phí chính thức khi xe ra.
- Tạo payment chính thức.
- Complete session.
- Lost card approval effect.
- Mismatch confirmation effect.
- Cancel session effect.
- Driver register/profile/vehicle write.

Spring Boot được:

- Đọc dữ liệu.
- Tính phí preview public nếu ghi rõ là preview.
- Xuất report.
- Search audit.
- Insert audit cho support action.
- Tạo feedback/notification/mock event nếu module đó làm.

## 18.2 Support API Không Ghi Trực Tiếp Core Tables

Support API không ghi trực tiếp:

```text
users
driver_profiles
vehicles
parking_sessions
parking_cards
slots
payments
monthly_passes
lost_card_cases
plate_mismatch_cases
pricing_rules
```

Nếu cần thay đổi core, frontend hoặc Spring gọi API `.NET`.

## 18.3 Audit Log Append-Only

Cả hai backend có thể insert audit log.

Field bắt buộc:

```text
CORE_API
SUPPORT_API
```

Không backend nào được update/delete audit log.

## 18.4 Transaction Boundary

Các nghiệp vụ sau phải transaction trong `.NET`:

- Entry.
- Exit.
- Monthly pass exit.
- Cash payment.
- Lost card create/approve/reject.
- Mismatch create/confirm/reject.
- Cancel session.
- Move session slot.
- Slot status change nếu slot đang liên quan session.

Spring Boot report/export không cần transaction ghi core.

---

# 19. Student Implementation Guide - Hướng Dẫn Code Cho Sinh Viên

Section này dành cho sinh viên vừa học vừa làm. Mục tiêu là biết **đọc spec theo thứ tự nào**, **bắt đầu code từ đâu**, **một module cần những file nào**, **test ra sao**, và **debug lỗi thường gặp thế nào**.

## 19.1 Zero-To-First-Run Checklist

Phần này dành cho bạn chưa quen chạy project web. Làm đúng thứ tự, không nhảy bước.

### Bước 0 - Clone Repo Và Tạo Branch

```bash
git clone <repo-url>
cd SWP301
git checkout dev
git pull
git checkout -b feature/your-module-name
```

Ví dụ branch:

```text
feature/auth-api
feature/card-management
feature/staff-entry-ui
feature/support-dashboard
```

Không code trực tiếp trên `main`.

### Bước 1 - Kiểm Tra Tool

Chạy các lệnh sau:

```bash
dotnet --version
java -version
mvn -version
node -v
npm -v
git --version
```

Nếu lệnh không chạy, chưa cài tool hoặc chưa cấu hình PATH.

### Bước 2 - Cấu Hình Supabase Database

Lấy thông tin kết nối trong Supabase Project Settings > Database.
Cấu hình trực tiếp trong file config của từng backend.

Ví dụ Spring Boot `application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: your-supabase-db-password
```

Repo này dùng Supabase PostgreSQL, không cần PostgreSQL local.

### Bước 3 - Chạy .NET Core API Trước

```bash
cd backend/ParkingBuilding.CoreApi
dotnet restore
dotnet run
```

Truoc khi chay backend, tao database bang SQL scripts theo thu tu:

```text
database/01_schema.sql
database/02_seed.sql
database/03_indexes_constraints.sql
```

Kỳ vọng:

```text
Now listening on: http://localhost:5000
Swagger mở được ở /swagger
```

### Bước 4 - Chạy Spring Boot Sau

```bash
cd backend/parking-building-support-api
mvn spring-boot:run
```

Kỳ vọng:

```text
Tomcat started on port 8080
Không báo missing table/column
```

Neu Spring bao thieu table, nghia la chua chay dung `database/*.sql`.

### Bước 5 - Chạy React

```bash
cd frontend
npm install
npm run dev
```

Kỳ vọng:

```text
Local: http://localhost:5173
```

### Bước 6 - Test API Đầu Tiên

1. Mở Swagger .NET.
2. Gọi `POST /api/core/auth/login`.
3. Copy token.
4. Gọi `GET /api/core/auth/me`.
5. Mở Swagger Spring.
6. Dùng token gọi `GET /api/support/dashboard/summary`.

Nếu bước này pass, 3 phần DB + .NET + Spring đã kết nối được.

## 19.2 Cách Đọc Tài Liệu Theo Vai Trò

Không nên đọc từ đầu đến cuối rồi mới code. Hãy đọc theo vai trò được giao.

| Vai trò      | Đọc trước                           | Đọc tiếp                           | Khi code cần mở song song            |
| ------------ | ----------------------------------- | ---------------------------------- | ------------------------------------ |
| .NET dev     | Section 3, 5, 6, 7, 8, 9            | Section 10, 12, 17, 18             | Module mình làm + DB table liên quan |
| Spring dev   | Section 3, 5, 6, 7, 11              | Section 13, 17, 18                 | Read-only rule + report/public API   |
| Frontend dev | Section 5, 6, 14, 15, 17            | Section 12/13 API module liên quan | API request/response + role check    |
| Tester       | Section 2, 9, 16, 17, 21, 22        | Section 23, 24                     | Demo script + test mapping           |
| Team lead    | Section 1, 2, 3, 18, 19, 20, 24, 25 | Toàn bộ phần module                | Ownership + sprint plan              |

Quy tắc học/làm:

- Mỗi bạn chỉ cần hiểu sâu module mình làm, nhưng phải hiểu ownership và transaction boundary.
- Khi làm API, luôn tìm đủ 4 chỗ: API table, DTO/request/response, DB table, test case.
- Nếu một requirement chưa rõ, không tự chế thêm flow mới; hỏi team lead và cập nhật spec trước.

## 19.3 Local Setup Reference - Tham Khảo Cấu Hình

Phần `19.1` là quy trình chạy lần đầu. Phần này chỉ là bảng công cụ và config mẫu để tra lại khi setup lỗi.

### Công Cụ Cần Cài

| Công cụ                | Gợi ý version | Dùng để                                  |
| ---------------------- | ------------- | ---------------------------------------- |
| PostgreSQL             | 15+ hoặc 16+  | Database chung                           |
| pgAdmin hoặc DBeaver   | Bản mới       | Xem bảng/query data                      |
| .NET SDK               | 8.x           | Chạy ASP.NET Core API                    |
| Java JDK               | 17 hoặc 21    | Chạy Spring Boot                         |
| Maven                  | 3.9+          | Build Spring Boot nếu không dùng wrapper |
| Node.js                | 20+           | Chạy React                               |
| Git                    | Bản mới       | Quản lý source                           |
| Postman/Bruno/Insomnia | Bản mới       | Test API                                 |

### Thứ Tự Chạy Hệ Thống

Luôn chạy theo thứ tự:

```text
1. PostgreSQL
2. .NET Core API
3. Spring Boot Support API
4. React Frontend
```

Lý do:

- Chay `database/*.sql` de tao schema va seed data.
- Spring Boot cần database schema có sẵn để `ddl-auto=validate`.
- React cần biết base URL của 2 backend.

### Supabase Database

Database dùng Supabase PostgreSQL. Lấy connection string trong Supabase Project Settings > Database rồi cấu hình trực tiếp cho cả .NET và Spring Boot.

Thông tin mẫu:

```text
Host: db.your-project-ref.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: your-supabase-db-password
SSL: require
```

Nếu dùng Supabase pooler, dùng đúng host/port/user từ connection string Supabase cung cấp.

### .NET Core API Local

File config mẫu:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.your-project-ref.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your-supabase-db-password;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Jwt": {
    "Issuer": "parking-building-auth",
    "Audience": "parking-building-api",
    "Secret": "dev-secret-key-change-in-production"
  }
}
```

Lệnh chạy mẫu:

```bash
dotnet restore
database/02_seed.sql
dotnet run
```

Swagger thường ở:

```text
http://localhost:5000/swagger
```

### Spring Boot Support API Local

File `application.yml` mẫu:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: your-supabase-db-password
  jpa:
    hibernate:
      ddl-auto: validate

jwt:
  issuer: parking-building-auth
  audience: parking-building-api
  secret: dev-secret-key-change-in-production
```

Lệnh chạy mẫu:

```bash
mvn spring-boot:run
```

Swagger thường ở:

```text
http://localhost:8080/swagger-ui/index.html
```

### React Local

Base URL API có thể đặt trực tiếp trong file client:

```javascript
export const coreApiBaseUrl = "http://localhost:5000";
export const supportApiBaseUrl = "http://localhost:8080";
export const publicApiBaseUrl = "http://localhost:8080";
```

Lệnh chạy:

```bash
npm install
npm run dev
```

## 19.4 Supabase PostgreSQL

Repo này dùng Supabase PostgreSQL làm database chính.

Điền thông tin kết nối Supabase trực tiếp trong file config backend.

Spring Boot:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: your-supabase-db-password
```

Nếu dùng Supabase pooler, thay host/port/user theo connection string Supabase cung cấp.

Không đưa database dump hoặc dữ liệu nhạy cảm lên repo.

## 19.5 Git Workflow Cho Sinh Viên

### Quy Tắc Branch

```text
main  = bản ổn định
dev   = nhánh tích hợp
feature/... = nhánh cá nhân
```

Mỗi task tạo một branch:

```bash
git checkout dev
git pull
git checkout -b feature/card-create-api
```

### Commit Message

Format dễ đọc:

```text
feat(card): add create card API
fix(auth): handle locked account login
docs(spec): update entry flow
test(payment): add cash payment tests
```

### Trước Khi Push

```bash
git status
git add .
git commit -m "feat(card): add create card API"
git pull origin dev
git push origin feature/card-create-api
```

Nếu conflict:

1. Không bấm lung tung trong IDE.
2. Mở file bị conflict.
3. Giữ phần code đúng.
4. Chạy lại build/test.
5. Commit phần resolve.

### Không Được Commit

```text
bin/
obj/
target/
node_modules/
dist/
*.user
log files
password thật
database dump có dữ liệu nhạy cảm
```

## 19.6 Scaffold Project Commands

Nếu repo chưa có backend code, tạo project bằng các lệnh dưới đây.

### Tạo ASP.NET Core Project

```bash
cd backend
dotnet new sln -n ParkingBuilding
dotnet new webapi -n ParkingBuilding.CoreApi
dotnet sln ParkingBuilding.sln add ParkingBuilding.CoreApi/ParkingBuilding.CoreApi.csproj
cd ParkingBuilding.CoreApi
```

Cài package:

```bash
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package FluentValidation.AspNetCore
dotnet add package Swashbuckle.AspNetCore
```

Tạo folder:

```text
Controllers
Application
Application/Auth
Application/Cards
Application/Audit
Domain
Domain/Entities
Domain/Enums
Infrastructure
Infrastructure/Persistence
Infrastructure/Repositories
Contracts
Contracts/Requests
Contracts/Responses
Contracts/Common
```

Quy tac SQL scripts:

Khong cai dat cong cu EF schema tooling cho scope hien tai.

Cap nhat SQL scripts sau khi chot entity/config:

```text
database/01_schema.sql
database/02_seed.sql
database/03_indexes_constraints.sql
```

### Tạo Spring Boot Project

Cách dễ nhất cho sinh viên mới:

1. Mở Spring Initializr.
2. Chọn Maven.
3. Chọn Java 17 hoặc 21.
4. Group: `com.parkingbuilding`.
5. Artifact: `parking-building-support-api`.
6. Dependencies:
   - Spring Web
   - Spring Security
   - Spring Data JPA
   - PostgreSQL Driver
   - Lombok
   - Validation
7. Generate, giải nén vào `backend/parking-building-support-api`.

Tạo folder:

```text
src/main/java/com/parkingbuilding/support/common
src/main/java/com/parkingbuilding/support/config
src/main/java/com/parkingbuilding/support/security
src/main/java/com/parkingbuilding/support/publicapi
src/main/java/com/parkingbuilding/support/dashboard
src/main/java/com/parkingbuilding/support/report
src/main/java/com/parkingbuilding/support/auditlog
src/main/java/com/parkingbuilding/support/sharedreadmodel
```

### Tạo React Project Nếu Chưa Có

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom lucide-react
```

Tạo folder:

```text
src/api
src/app
src/components/ui
src/components/layout
src/pages
src/pages/public
src/pages/error
src/hooks
src/utils
src/constants
```

## 19.7 Starter Code Bắt Buộc Cho .NET

Các file này nên có trước khi code module nghiệp vụ. Nếu thiếu, sinh viên sẽ viết mỗi module một kiểu và rất khó tích hợp.

### ApiResponse

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public object? Errors { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.Now;

    public static ApiResponse<T> Ok(T data, string message = "OK")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            Errors = null
        };
    }

    public static ApiResponse<T> Fail(string message, object? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Data = default,
            Errors = errors
        };
    }
}
```

### BusinessException

```csharp
public class BusinessException : Exception
{
    public string ErrorCode { get; }
    public int StatusCode { get; }

    public BusinessException(string errorCode, int statusCode = 400)
        : base(errorCode)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
    }
}
```

### GlobalExceptionMiddleware

```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (BusinessException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(ex.ErrorCode));
        }
        catch (Exception)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail("INTERNAL_SERVER_ERROR"));
        }
    }
}
```

### Program.cs Mẫu

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ParkingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });

builder.Services.AddAuthorization();

// TODO: register repositories and services here.

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### UserId Helper

```csharp
using System.Security.Claims;

public static class ClaimsPrincipalExtensions
{
    public static long GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        if (long.TryParse(value, out var id))
            return id;

        throw new BusinessException("INVALID_TOKEN", 401);
    }
}
```

### Transaction Mẫu Trong Service

```csharp
public async Task<EntryResponse> CreateEntrySessionAsync(CreateEntryRequest request, long staffId)
{
    await using var transaction = await _db.Database.BeginTransactionAsync();

    try
    {
        // 1. validate card
        // 2. validate slot
        // 3. create session
        // 4. update card
        // 5. update slot
        // 6. write audit

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        return response;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

## 19.8 Spring Starter Code Bắt Buộc

### ApiResponse

```java
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Getter
@Setter
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private Object errors;
    private OffsetDateTime timestamp = OffsetDateTime.now();

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.message = "OK";
        response.data = data;
        return response;
    }

    public static <T> ApiResponse<T> fail(String message, Object errors) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = errors;
        return response;
    }
}
```

Nếu không dùng Lombok, phải tự tạo getter/setter cho tất cả field, nếu không JSON response có thể bị rỗng hoặc serialize sai.

### BusinessException

```java
public class BusinessException extends RuntimeException {
    private final String errorCode;

    public BusinessException(String errorCode) {
        super(errorCode);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
```

### GlobalExceptionHandler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusiness(BusinessException ex) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.fail(ex.getErrorCode(), null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnknown(Exception ex) {
        return ResponseEntity.status(500)
            .body(ApiResponse.fail("INTERNAL_SERVER_ERROR", null));
    }
}
```

### SecurityConfig Tối Thiểu

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
            .requestMatchers("/api/support/**").authenticated()
            .anyRequest().authenticated()
        );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### JwtAuthenticationFilter Mẫu Đơn Giản

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenValidator validator;

    public JwtAuthenticationFilter(JwtTokenValidator validator) {
        this.validator = validator;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Authentication authentication = validator.validate(token);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
```

### Read-Only Service Mẫu

```java
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final SlotReadRepository slots;

    public DashboardService(SlotReadRepository slots) {
        this.slots = slots;
    }

    public DashboardSummaryResponse getSummary() {
        long available = slots.countByStatus("AVAILABLE");
        long occupied = slots.countByStatus("OCCUPIED");
        return new DashboardSummaryResponse(available, occupied);
    }
}
```

Không dùng `@Transactional` ghi trong service đọc report/public.

## 19.9 Frontend Beginner Flow

Sinh viên mới thường không biết bắt đầu page từ đâu. Làm theo thứ tự sau.

### Bước 1 - Tạo API Client

```javascript
import axios from "axios";

export const coreApi = axios.create({
  baseURL: "http://localhost:5000",
});

coreApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Bước 2 - Tạo API Module

```javascript
export const vehicleTypeApi = {
  getAll: () => coreApi.get("/api/core/vehicle-types"),
};
```

### Bước 3 - Tạo Page Đọc Dữ Liệu

```javascript
function VehicleTypesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    vehicleTypeApi
      .getAll()
      .then((res) => setItems(res.data.data))
      .catch(() => setError("Không tải được loại xe"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Bước 4 - Tạo Form Submit

```javascript
async function handleSubmit(event) {
  event.preventDefault();
  setError("");

  if (!cardCode.trim()) {
    setError("Card code is required");
    return;
  }

  try {
    await cardApi.createCard({ cardCode, note });
    setCardCode("");
    await loadCards();
  } catch (e) {
    setError(e.response?.data?.message ?? "Create failed");
  }
}
```

### Bước 5 - Tự Kiểm Tra Page

```text
[ ] Mở page không trắng màn hình
[ ] Loading hiển thị khi chờ API
[ ] API fail có error
[ ] Submit thiếu field có validation
[ ] Submit thành công reload list
[ ] Token hết hạn điều hướng về login
```

## 19.10 Workflow Code Một Module Backend Từ A-Z

Khi được giao một module, không code Controller trước. Làm theo thứ tự này.

Ví dụ module `Parking Card`:

1. Đọc DB table: `parking_cards`.
2. Đọc enum liên quan: `CardStatus`.
3. Tạo Entity.
4. Tạo Entity Configuration hoặc annotation mapping.
5. Tạo DTO request/response.
6. Tạo Validator.
7. Tạo Repository query.
8. Tạo Service business logic.
9. Tạo Controller endpoint.
10. Thêm role authorization.
11. Thêm audit log nếu action quan trọng.
12. Test Swagger/Postman.
13. Test lỗi validation.
14. Gửi frontend API contract.

Checklist module backend:

```text
[ ] Entity map đúng column
[ ] Enum lưu string
[ ] DTO không expose password_hash hoặc field nhạy cảm
[ ] Validate input
[ ] Check role
[ ] Service không chứa code HTTP
[ ] Controller không chứa business logic dài
[ ] Repository không xử lý business rule
[ ] Có audit log nếu create/update/status/action quan trọng
[ ] Có test success case
[ ] Có test failure case
```

## 19.11 Skeleton ASP.NET Core

### Enum Mẫu

```csharp
public enum CardStatus
{
    AVAILABLE,
    IN_USE,
    LOST,
    DAMAGED,
    INACTIVE
}
```

### Entity Mẫu

```csharp
public class ParkingCard
{
    public long Id { get; set; }
    public string CardCode { get; set; } = string.Empty;
    public string QrToken { get; set; } = string.Empty;
    public CardStatus Status { get; set; }
    public long? CurrentSessionId { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
```

### EF Core Configuration Mẫu

```csharp
public class ParkingCardConfiguration : IEntityTypeConfiguration<ParkingCard>
{
    public void Configure(EntityTypeBuilder<ParkingCard> builder)
    {
        builder.ToTable("parking_cards");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CardCode)
            .HasColumnName("card_code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.QrToken)
            .HasColumnName("qr_token")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(x => x.CardCode).IsUnique();
        builder.HasIndex(x => x.QrToken).IsUnique();
    }
}
```

### DTO Mẫu

```csharp
public record CreateCardRequest(string CardCode, string? Note);

public record CardResponse(
    long Id,
    string CardCode,
    string QrToken,
    string Status,
    long? CurrentSessionId
);
```

### Repository Mẫu

```csharp
public interface IParkingCardRepository
{
    Task<ParkingCard?> FindByCardCodeAsync(string cardCode);
    Task<bool> ExistsByCardCodeAsync(string cardCode);
    Task AddAsync(ParkingCard card);
    Task SaveChangesAsync();
}
```

### Service Mẫu

```csharp
public class ParkingCardService : IParkingCardService
{
    private readonly IParkingCardRepository _cards;
    private readonly IAuditWriterService _audit;

    public async Task<CardResponse> CreateCardAsync(CreateCardRequest request, long userId)
    {
        if (await _cards.ExistsByCardCodeAsync(request.CardCode))
            throw new BusinessException("CARD_CODE_ALREADY_EXISTS");

        var card = new ParkingCard
        {
            CardCode = request.CardCode.Trim(),
            QrToken = GenerateQrToken(),
            Status = CardStatus.AVAILABLE,
            Note = request.Note,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await _cards.AddAsync(card);
        await _cards.SaveChangesAsync();
        await _audit.WriteBusinessActionAsync(userId, "CARD_CREATED", "ParkingCard", card.Id.ToString());

        return MapToResponse(card);
    }
}
```

### Controller Mẫu

```csharp
[ApiController]
[Route("api/core/cards")]
public class CardsController : ControllerBase
{
    private readonly IParkingCardService _service;

    [HttpPost]
    [Authorize(Roles = "MANAGER,ADMIN")]
    public async Task<IActionResult> Create(CreateCardRequest request)
    {
        var userId = User.GetUserId();
        var result = await _service.CreateCardAsync(request, userId);
        return Created($"/api/core/cards/{result.Id}", ApiResponse<CardResponse>.Ok(result));
    }
}
```

## 19.12 Skeleton Spring Boot Read-Only

### Read Entity Mẫu

```java
@Entity
@Table(name = "parking_sessions")
public class ParkingSessionReadEntity {
    @Id
    private Long id;

    @Column(name = "session_code")
    private String sessionCode;

    @Column(name = "card_id")
    private Long cardId;

    @Column(name = "status")
    private String status;

    @Column(name = "entry_time")
    private OffsetDateTime entryTime;
}
```

### Repository Read-Only Mẫu

```java
public interface ParkingSessionReadRepository
        extends JpaRepository<ParkingSessionReadEntity, Long> {

    Optional<ParkingSessionReadEntity> findFirstByCardIdAndStatusIn(
        Long cardId,
        Collection<String> statuses
    );
}
```

Quy tắc cho Spring repository core:

- Được dùng `find`, `count`, `sum`, query report.
- Không gọi `save`.
- Không gọi `delete`.
- Không tự sửa status session/card/slot/payment.

### Controller Mẫu

```java
@RestController
@RequestMapping("/api/public/cards")
public class PublicCardLookupController {
    private final PublicCardLookupService service;

    @GetMapping("/{qrToken}/active-session")
    public ApiResponse<PublicCardLookupResponse> lookup(@PathVariable String qrToken) {
        return ApiResponse.ok(service.getActiveSessionByQrToken(qrToken));
    }
}
```

## 19.13 Skeleton React

### API File Mẫu

```javascript
import { coreApi } from "./coreAxiosClient";

export const cardApi = {
  getCards: (params) => coreApi.get("/api/core/cards", { params }),
  createCard: (payload) => coreApi.post("/api/core/cards", payload),
  changeStatus: (id, payload) =>
    coreApi.patch(`/api/core/cards/${id}/status`, payload),
};
```

### Page Flow Mẫu

```javascript
function CardManagementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadCards() {
    setLoading(true);
    setError(null);
    try {
      const res = await cardApi.getCards({ page: 1, pageSize: 20 });
      setItems(res.data.data.items);
    } catch (e) {
      setError(e.response?.data?.message ?? "Load cards failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, []);

  return null;
}
```

Frontend checklist:

```text
[ ] Gọi đúng API client
[ ] Có loading state
[ ] Có error state
[ ] Có success message
[ ] Có role guard
[ ] Form validate required field
[ ] Sau create/update reload list
```

## 19.14 ERD Giải Thích Bằng Lời

Quan hệ chính:

- `users` lưu tài khoản đăng nhập cho Admin/Manager/Staff/Driver.
- `driver_profiles` là hồ sơ Driver, nối 1-1 hoặc 0-1 với `users`.
- `vehicles` là xe, có thể thuộc Driver hoặc là xe guest được tạo khi entry.
- `vehicle_types` là loại phương tiện, được dùng bởi vehicle, slot, pricing, monthly pass.
- `floors -> areas -> slots` là cấu trúc bãi xe.
- `area_vehicle_types` cho biết khu vực nào nhận loại xe nào.
- `gates` là cổng vào/ra.
- `parking_cards` là thẻ vật lý/static QR.
- `parking_sessions` là lượt gửi xe, nối card, vehicle, slot, staff, gate, pricing snapshot.
- `pricing_rules` là bảng giá hiện hành; khi entry thì copy giá vào session snapshot.
- `payments` là thanh toán của session.
- `monthly_passes` là vé tháng theo biển số và loại xe.
- `lost_card_cases` là hồ sơ mất thẻ, gắn với session.
- `plate_mismatch_cases` là hồ sơ sai biển số, gắn với session.
- `audit_logs` ghi lại action quan trọng, chỉ insert, không sửa/xóa.

Điểm dễ nhầm:

- `parking_cards` không phải `parking_sessions`. Card là thẻ; session là một lượt gửi xe.
- `slots.status = OCCUPIED` phải khớp với một active session.
- `payments.status = PAID` không có nghĩa session đã completed; exit service mới complete session.
- `pricing_rules` có thể đổi, nhưng session active dùng snapshot giá đã lưu lúc entry.

## 19.15 Sequence Flow Chi Tiết

### Entry Flow

```text
1. Staff login lấy JWT.
2. Frontend load vehicle types, available cards, gates.
3. Staff nhập biển số hoặc bật noPlate.
4. Frontend gọi suggest-slot.
5. .NET lọc area/slot theo vehicle type và status.
6. Staff xác nhận card + slot.
7. Frontend gọi entry.
8. .NET mở transaction.
9. .NET validate card AVAILABLE.
10. .NET validate vehicle chưa có active session.
11. .NET validate slot AVAILABLE.
12. .NET detect monthly pass nếu có.
13. .NET lấy pricing rule và lưu snapshot.
14. .NET tạo parking_session ACTIVE.
15. .NET update card IN_USE.
16. .NET update slot OCCUPIED.
17. .NET ghi audit log.
18. .NET commit transaction.
19. Frontend hiển thị session code.
```

### Exit Casual Flow

```text
1. Staff nhập card code.
2. Frontend gọi by-card-code.
3. .NET trả active session.
4. Staff nhập biển số lúc ra nếu có.
5. Frontend gọi calculate-fee.
6. .NET tính phí bằng snapshot.
7. Staff thu tiền mặt.
8. Frontend gọi payments/cash.
9. .NET tạo payment PAID.
10. Frontend gọi exit.
11. .NET mở transaction.
12. .NET validate session active.
13. .NET validate payment PAID.
14. .NET validate mismatch/lost-card state.
15. .NET mark session COMPLETED.
16. .NET release slot.
17. .NET release card.
18. .NET ghi audit log.
19. .NET commit transaction.
```

### Monthly Pass Exit Flow

```text
1. Staff tìm session.
2. .NET xác định customerType MONTHLY hoặc monthly pass valid.
3. Frontend gọi monthly-pass-exit.
4. .NET tạo payment WAIVED hoặc NOT_REQUIRED.
5. .NET complete session.
6. .NET release slot/card.
```

### Lost Card Flow

```text
1. Staff tìm session bằng biển số/thời gian/khu vực.
2. Staff tạo lost card case.
3. .NET chuyển session sang LOST_CARD_PENDING.
4. Manager/Admin mở danh sách pending.
5. Manager/Admin approve hoặc reject.
6. Nếu approve: áp phí mất thẻ, card LOST nếu xác nhận mất.
7. Nếu reject: session quay lại ACTIVE.
8. Mọi bước ghi audit log.
```

### Plate Mismatch Flow

```text
1. Staff exit với biển số khác lúc vào.
2. .NET tạo mismatch case PENDING và chặn exit.
3. Manager/Admin xem case.
4. Manager/Admin confirm kèm reason hoặc reject.
5. Confirm xong Staff mới tiếp tục exit.
```

### Cancel Session Flow

```text
1. Admin tìm session active/pending.
2. Admin nhập cancellation reason.
3. .NET mở transaction.
4. .NET mark session CANCELLED.
5. .NET release slot.
6. .NET release card nếu card không LOST/DAMAGED/INACTIVE.
7. .NET cancel pending/failed payment nếu có.
8. .NET ghi audit log.
9. .NET commit.
```

### Dashboard/Report Read Flow

```text
1. .NET hoàn tất entry/exit/payment và commit.
2. Manager mở dashboard/report.
3. Frontend gọi Spring Support API.
4. Spring verify JWT.
5. Spring query read-only từ PostgreSQL.
6. Spring trả số liệu.
```

## 19.16 Seed Data Guide

Seed tối thiểu để demo không bị kẹt:

### Accounts

| Username  | Password demo | Role    |
| --------- | ------------- | ------- |
| admin01   | 123456        | ADMIN   |
| manager01 | 123456        | MANAGER |
| staff01   | 123456        | STAFF   |
| driver01  | 123456        | DRIVER  |

Password trong database phải hash bằng BCrypt, không lưu plain text.

### Vehicle Types

```text
1. Xe đạp
2. Xe đạp điện
3. Xe máy
4. Xe máy điện
5. Ô tô
6. Ô tô điện
7. Xe vận chuyển hàng hóa
```

### Floors, Areas, Slots, Gates

Seed gợi ý:

```text
Floors:
- B1
- B2
- B3

Areas:
- B1-A, B1-B
- B2-A, B2-B
- B3-A, B3-B

Slots:
- Mỗi area 10 slot demo
- Slot xe máy: A-M01 -> A-M10
- Slot ô tô: B-C01 -> B-C10

Gates:
- B1-IN, B1-OUT
- B2-IN, B2-OUT
- B3-IN, B3-OUT
```

### Cards

```text
C001 -> C020
status = AVAILABLE
qr_token = chuỗi random khó đoán
```

### Pricing Rules

Seed mỗi loại xe một pricing rule active:

| Loại xe | Day price | Night price | Monthly price | Lost card fee |
| ------- | --------: | ----------: | ------------: | ------------: |
| Xe đạp  |      2000 |        3000 |         50000 |         30000 |
| Xe máy  |      5000 |        7000 |        150000 |         50000 |
| Ô tô    |     20000 |       30000 |       1200000 |        200000 |

### Monthly Pass Mẫu

```text
owner_name = Nguyen Van Monthly
plate_number = 51A-99999
vehicle_type = Xe máy
start_date = hôm nay - 5 ngày
end_date = hôm nay + 25 ngày
status = ACTIVE
```

## 19.17 Seed Data

Seed data chinh thuc nam trong `database/02_seed.sql`.

.NET khong duoc dung seeder C# de thay the baseline seed. Neu sau nay can runtime-only seeder cho du lieu phu, seeder do khong duoc tao/sua schema va phai duoc ghi ro trong README cua backend.

### Thứ Tự Seed Bắt Buộc

```text
1. users
2. vehicle_types
3. floors
4. areas
5. area_vehicle_types
6. slots
7. gates
8. parking_cards
9. pricing_rules
10. monthly_passes demo nếu cần
```

Nếu seed sai thứ tự sẽ lỗi foreign key.

## 19.18 Postman Và cURL Examples

Thay `TOKEN_HERE` bằng JWT nhận từ login.

### Login

```bash
curl -X POST http://localhost:5000/api/core/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"usernameOrEmailOrPhone\":\"staff01\",\"password\":\"123456\"}"
```

### Create Card

```bash
curl -X POST http://localhost:5000/api/core/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"cardCode\":\"C001\",\"note\":\"Demo card\"}"
```

### Suggest Slot

```bash
curl -X POST http://localhost:5000/api/core/parking-sessions/suggest-slot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"vehicleTypeId\":3,\"preferredFloorId\":null}"
```

### Entry

```bash
curl -X POST http://localhost:5000/api/core/parking-sessions/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"entryGateId\":1,\"plateNumber\":\"51A-12345\",\"noPlate\":false,\"vehicleDescription\":null,\"vehicleTypeId\":3,\"cardId\":1,\"selectedAreaId\":1,\"selectedSlotId\":1,\"overrideReason\":null}"
```

### Calculate Fee

```bash
curl -X POST http://localhost:5000/api/core/parking-sessions/1/calculate-fee \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"exitTime\":\"2026-05-21T14:30:00+07:00\",\"includeLostCardFee\":false}"
```

### Cash Payment

```bash
curl -X POST http://localhost:5000/api/core/payments/cash \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"sessionId\":1,\"amount\":10000,\"lostCardFee\":0,\"totalAmount\":10000}"
```

### Exit

```bash
curl -X POST http://localhost:5000/api/core/parking-sessions/1/exit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d "{\"exitGateId\":2,\"exitPlateNumber\":\"51A-12345\",\"exitTime\":\"2026-05-21T14:30:00+07:00\",\"paymentId\":1}"
```

### Public QR Lookup

```bash
curl http://localhost:8080/api/public/cards/QR_TOKEN_HERE/active-session
```

### Dashboard

```bash
curl http://localhost:8080/api/support/dashboard/summary \
  -H "Authorization: Bearer TOKEN_HERE"
```

### PowerShell Trên Windows

Các ví dụ `curl` phía trên dùng cú pháp Git Bash/Linux. Nếu chạy trong PowerShell, dùng mẫu dưới đây.

Login:

```powershell
$loginBody = @{
  usernameOrEmailOrPhone = "staff01"
  password = "123456"
} | ConvertTo-Json

$loginResult = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5000/api/core/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResult.data.accessToken
```

Gọi API cần token:

```powershell
$headers = @{
  Authorization = "Bearer $token"
}

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:8080/api/support/dashboard/summary" `
  -Headers $headers
```

POST có body:

```powershell
$cardBody = @{
  cardCode = "C001"
  note = "Demo card"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5000/api/core/cards" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $cardBody
```

## 19.19 Common Mistakes Và Debug Guide

| Lỗi                          | Dấu hiệu                               | Cách kiểm tra                          | Cách sửa                                                                   |
| ---------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Sai connection string        | Backend không connect DB               | Log báo connection refused/auth failed | Sửa host/port/user/password ở cả .NET và Spring                            |
| Chua chay SQL scripts        | Spring start fail validate             | Bao missing table/column               | Chay `database/01_schema.sql`, `02_seed.sql`, `03_indexes_constraints.sql` |
| Spring tự sửa schema         | Schema lệch khó debug                  | Thấy `ddl-auto=update`                 | Đổi về `validate`                                                          |
| JWT mismatch                 | Spring trả 401                         | Issuer/audience/secret khác .NET       | Copy cùng config JWT                                                       |
| CORS lỗi                     | Browser chặn request                   | Console có CORS error                  | Cho phép origin frontend trong cả 2 backend                                |
| Card không entry được        | API trả `CARD_NOT_AVAILABLE`           | Query `parking_cards.status`           | Dùng card AVAILABLE hoặc exit/cancel session cũ                            |
| Slot không entry được        | API trả `SLOT_NOT_AVAILABLE`           | Query `slots.status`                   | Dùng slot AVAILABLE hoặc release session cũ                                |
| Duplicate active plate       | API trả `VEHICLE_HAS_ACTIVE_SESSION`   | Search active session theo plate       | Exit/cancel session cũ trước                                               |
| Exit fail vì payment         | API trả `PAYMENT_REQUIRED_BEFORE_EXIT` | Check payments by session              | Tạo cash payment trước exit                                                |
| Dashboard sai số             | Spring đọc số cũ                       | Check .NET transaction đã success chưa | Gọi lại dashboard sau API .NET success                                     |
| Public QR không thấy session | Card AVAILABLE hoặc QR sai             | Check card qr_token/current_session    | Dùng QR của card IN_USE                                                    |

Debug theo thứ tự:

```text
1. Xem HTTP status.
2. Xem response message/error code.
3. Xem backend log.
4. Query DB table liên quan.
5. Kiểm tra role/JWT.
6. Kiểm tra status transition.
7. Kiểm tra transaction có rollback không.
```

## 19.20 Debug Theo Từng Lỗi Cụ Thể

### .NET Không Chạy

Log thường gặp:

```text
Unable to connect to any of the specified PostgreSQL hosts
```

Cách sửa:

```text
1. Kiểm tra Supabase project đang hoạt động.
2. Kiểm tra host/port trong file config đúng với connection string Supabase.
3. Kiểm tra username/password và `sslmode=require`.
4. Thử login bằng DBeaver/pgAdmin với SSL enabled.
```

### SQL Schema Loi

Log thường gặp:

```text
The entity type requires a primary key to be defined
```

Cách sửa:

```text
1. Kiểm tra entity có Id chưa.
2. Kiểm tra configuration có HasKey chưa.
3. Kiểm tra DbSet đã thêm vào DbContext chưa.
```

### Spring Validate Lỗi

Log thường gặp:

```text
Schema-validation: missing table [parking_sessions]
```

Cách sửa:

```text
1. Chay database SQL scripts truoc.
2. Kiểm tra đúng database/schema Supabase mà hai backend cùng kết nối.
3. Không đổi ddl-auto thành update.
```

### Spring JWT 401

Cách kiểm tra:

```text
1. Token có prefix Bearer chưa.
2. Secret/issuer/audience Spring có giống .NET không.
3. Token hết hạn chưa.
4. Role trong token có đúng không.
```

### React Gọi API Bị CORS

Dấu hiệu browser console:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

Cách sửa:

```text
1. .NET cho phép origin http://localhost:5173.
2. Spring cho phép origin http://localhost:5173.
3. Không gọi nhầm http/https.
4. Không gọi nhầm port.
```

### React `Cannot read properties of undefined`

Cách sửa:

```text
1. Kiểm tra response shape: res.data.data.
2. Thêm optional chaining.
3. Set initial state là [] hoặc null đúng kiểu.
4. Render loading trước khi data về.
```

### Entry Fail Nhưng Không Biết Vì Sao

Kiểm tra theo thứ tự:

```sql
SELECT id, card_code, status, current_session_id FROM parking_cards WHERE id = 1;
SELECT id, slot_code, status, current_session_id FROM slots WHERE id = 1;
SELECT id, session_code, status, card_id, slot_id FROM parking_sessions WHERE status IN ('ACTIVE', 'LOST_CARD_PENDING', 'MISMATCH_PENDING');
```

Nếu card `IN_USE` hoặc slot `OCCUPIED`, phải exit/cancel session cũ trước.

## 19.21 Test Cơ Bản Cho Sinh Viên

Không cần viết test phức tạp ngay. Bắt đầu bằng service test nhỏ.

### xUnit Test Mẫu Cho .NET

```csharp
public class FeeCalculationServiceTests
{
    [Fact]
    public void CalculateBlocks_LessThanFourHours_ReturnsOneBlock()
    {
        var duration = TimeSpan.FromHours(2);

        var blocks = FeeCalculationHelper.CalculateBlocks(duration);

        Assert.Equal(1, blocks);
    }
}
```

### JUnit Test Mẫu Cho Spring

```java
class PlateMaskingTests {

    @Test
    void maskPlateNumber_shouldHideMiddleCharacters() {
        String result = PublicCardLookupService.maskPlateNumber("51A-12345");
        assertEquals("51A-***45", result);
    }
}
```

### Manual Test Template

Mỗi bạn khi test API phải ghi lại:

```text
Test ID:
API:
Role:
Input:
Expected:
Actual:
Result: PASS/FAIL
Screenshot hoặc response:
```

Ví dụ:

```text
Test ID: TC-CARD-01
API: POST /api/core/cards
Role: MANAGER
Input: cardCode C001
Expected: 201 Created
Actual: 201 Created
Result: PASS
```

## 19.22 Student Definition Of Done

### Backend .NET Task

```text
[ ] API xuất hiện trong Swagger
[ ] Gọi API success bằng Postman
[ ] Gọi API lỗi trả đúng error code
[ ] Role không đúng bị 403
[ ] Entity map đúng table/column
[ ] Enum lưu string
[ ] Có validate required/duplicate/status
[ ] Có audit log cho action quan trọng
[ ] Transaction rollback khi lỗi giữa chừng
[ ] Không làm logic core ở Controller
```

### Spring Read/Report Task

```text
[ ] API xuất hiện trong Swagger
[ ] Verify JWT .NET token được
[ ] Repository core chỉ đọc
[ ] Không gọi save/delete core table
[ ] Query đúng dữ liệu sau khi .NET ghi
[ ] Public API không lộ dữ liệu nhạy cảm
[ ] Report có filter date range
[ ] Excel export mở được nếu làm
```

### Frontend Task

```text
[ ] Route đúng
[ ] Gọi đúng coreApi/supportApi/publicApi
[ ] Có loading/error/success state
[ ] Có form validation
[ ] Có role guard
[ ] Không hardcode token
[ ] Sau create/update reload dữ liệu
[ ] UI đủ thao tác demo
```

### Test/Demo Task

```text
[ ] Có seed data cần thiết
[ ] Test success flow
[ ] Test failure flow
[ ] Chụp hoặc ghi lại request/response quan trọng
[ ] Demo script chạy từ đầu đến cuối không cần sửa DB thủ công
```

## 19.23 Module Dependency Order Cho Sinh Viên

Không làm module theo cảm hứng. Làm theo thứ tự phụ thuộc:

```text
1. PostgreSQL + SQL schema + seed base
2. Auth + User
3. Vehicle Type
4. Floor/Area/Slot/Gate
5. Parking Card
6. Pricing Rule
7. Slot Suggestion
8. Entry
9. Fee Calculation
10. Payment
11. Exit
12. Monthly Pass
13. Lost Card
14. Plate Mismatch
15. Cancel Session / Move Slot
16. Public QR Lookup
17. Dashboard
18. Reports / Audit
19. Driver Should Have / Feedback / Mock optional
```

Nếu module sau cần module trước mà module trước chưa xong, dùng mock data tạm nhưng phải thay bằng API thật trước integration test.

## 19.24 Bài Tập Làm Theo Thứ Tự Cho Sinh Viên Rất Mới

Không giao ngay Entry/Exit cho bạn mới. Đi từ dễ đến khó.

### Level 1 - Đọc Dữ Liệu

1. `GET /api/core/vehicle-types`
2. `GET /api/core/floors`
3. `GET /api/public/parking-info`
4. React render table vehicle types.

Mục tiêu: hiểu Controller -> Service -> Repository -> DB -> Response.

### Level 2 - Tạo Dữ Liệu Đơn Giản

1. `POST /api/core/cards`
2. `GET /api/core/cards`
3. React form tạo card.

Mục tiêu: hiểu DTO, validation duplicate, status enum.

### Level 3 - Đổi Trạng Thái

1. `PATCH /api/core/cards/{id}/status`
2. `PATCH /api/core/slots/{id}/status`

Mục tiêu: hiểu business validation và audit log.

### Level 4 - Flow Có Transaction Nhẹ

1. Suggest slot.
2. Entry.
3. Check DB: session active, card in use, slot occupied.

Mục tiêu: hiểu transaction và rollback.

### Level 5 - Flow Hoàn Chỉnh

1. Calculate fee.
2. Cash payment.
3. Exit.
4. Dashboard đọc số liệu mới.

Mục tiêu: hiểu liên kết giữa 2 backend.

### Level 6 - Exception Flow

1. Lost card.
2. Plate mismatch.
3. Cancel session.

Mục tiêu: hiểu trạng thái pending và approval.

## 19.25 Mini Glossary

| Thuật ngữ            | Giải thích ngắn                                            |
| -------------------- | ---------------------------------------------------------- |
| Core API             | ASP.NET Core backend, chịu trách nhiệm ghi nghiệp vụ chính |
| Support API          | Spring Boot backend, chủ yếu đọc public/report/audit       |
| Table owner          | Backend được phép ghi chính vào bảng                       |
| Transaction boundary | Ranh giới một transaction phải commit/rollback cùng nhau   |
| Active session       | Parking session đang `ACTIVE` hoặc pending exception       |
| Static QR            | QR cố định gắn với card, không chứa session id             |
| Pricing snapshot     | Bản copy giá tại lúc xe vào                                |
| Append-only audit    | Chỉ insert log, không update/delete                        |
| Read-only repository | Repository chỉ query, không save/delete                    |

## 19.26 Không Được Làm Gì

Danh sách này phải đọc trước khi code.

### Backend .NET Không Được

- Không viết business logic dài trong Controller.
- Không trả thẳng Entity có `password_hash`.
- Không lưu password plain text.
- Không complete session nếu payment chưa final.
- Không update card/slot ngoài transaction entry/exit/cancel/move.
- Không nuốt exception rồi trả success.
- Không tự ý đổi enum string đã chốt.
- Khong sua schema truc tiep trong database roi quen cap nhat `database/*.sql`.

### Spring Boot Không Được

- Không gọi `save` vào core tables.
- Không tạo parking session.
- Không update card/slot/session/payment.
- Không tự tính phí chính thức.
- Không tự login hoặc phát JWT riêng.
- Không đổi `ddl-auto` thành `update`.
- Không trả dữ liệu nhạy cảm ở public API.

### Frontend Không Được

- Không hardcode token trong code.
- Không gọi nhầm service vì thấy endpoint gần giống.
- Không bỏ qua loading/error state.
- Không để Staff thấy nút Manager/Admin.
- Không sửa trực tiếp database để demo qua lỗi.
- Không copy response mock rồi quên nối API thật.

### Team Không Được

- Không merge code chưa chạy.
- Không đổi API path mà không báo frontend/tester.
- Khong doi database field ma khong cap nhat SQL script/spec.
- Không để mỗi người tự đặt enum/status khác nhau.
- Không demo bằng cách sửa DB thủ công nếu flow có API.

---

# 20. Team Assignment

## 20.1 .NET Developer 1 - Core Foundation, Auth, User, Driver, Pricing

Phụ trách:

- Project setup .NET.
- SQL schema scripts trong `database/`.
- Shared entities/enums.
- Auth/JWT.
- User management.
- Driver account Should Have.
- Vehicle Type/Vehicle.
- Pricing Rules.
- Audit writer base service.

Deliverables:

```text
ParkingDbContext
Initial SQL Schema
Seed data
AuthController
UsersController
DriversController
VehicleTypesController
VehiclesController
PricingRulesController
JwtTokenService
AuditWriterService
```

## 20.2 .NET Developer 2 - Parking Operation Core, Payment, Monthly Pass, Exceptions

Phụ trách:

- Parking Card.
- Floor/Area/Slot/Gate.
- Slot Suggestion.
- Entry Processing.
- Exit Processing.
- Card/Slot state transition.
- Slot move/status adjustment.
- Fee Calculation.
- Payment.
- Monthly Pass.
- Lost Card.
- Plate Mismatch.
- Admin Cancel Session.

Deliverables:

```text
CardsController
FloorsController
AreasController
SlotsController
GatesController
ParkingSessionsController
EntryService
ExitService
SlotSuggestionService
ParkingCardService
SlotService
PaymentsController
MonthlyPassesController
LostCardCasesController
PlateMismatchController
SessionAdminService
FeeCalculationService
PaymentService
MonthlyPassService
LostCardCaseService
PlateMismatchService
```

## 20.3 Spring Boot Developer 1 - Public And Dashboard

Phụ trách:

- Project setup Spring Boot.
- JWT validation.
- Read-only JPA mapping.
- Public Driver APIs.
- Available slots public.
- Public pricing/rules.
- Public card QR lookup.
- Dashboard summary.

Deliverables:

```text
SecurityConfig
JwtAuthenticationFilter
PublicInfoController
PublicCardLookupController
DashboardController
PublicInfoService
PublicCardLookupService
DashboardService
Read-only JPA entities
```

## 20.4 Spring Boot Developer 2 - Reports, Audit, Support

Phụ trách:

- Reports.
- Excel export.
- Audit log search.
- Feedback nếu làm.
- Mock device optional.

Deliverables:

```text
ReportController
AuditLogController
FeedbackController
MockDeviceController
ReportService
ReportExportService
AuditLogQueryService
FeedbackService
Apache POI Excel export
```

---

# 21. Sprint Plan 60 Ngày

| Tuần   | .NET Team                                    | Spring Boot Team                                      | Frontend Team                           | Output                      |
| ------ | -------------------------------------------- | ----------------------------------------------------- | --------------------------------------- | --------------------------- |
| Tuan 1 | Setup .NET, SQL schema, seed data            | Setup Spring Boot, connect DB read-only, JWT validate | Setup React, routing, layout            | 3 project chay duoc         |
| Tuần 2 | Auth, User, VehicleType, Pricing base        | Public info read API, dashboard skeleton              | Login, protected route, layout          | Đăng nhập + đọc public info |
| Tuần 3 | Card, Structure, MonthlyPass CRUD            | Public available slots, public pricing/rules          | Card/Structure/Pricing UI               | Quản lý dữ liệu nền         |
| Tuần 4 | Suggestion + Entry transaction               | Public QR lookup                                      | Staff Entry UI + QR lookup page         | Demo xe vào + QR tra cứu    |
| Tuần 5 | Fee, Payment, Exit                           | Dashboard summary                                     | Staff Exit UI                           | Demo xe ra                  |
| Tuần 6 | Lost Card, Mismatch, Cancel, Move Slot       | Audit log search, report base                         | Manager approval UI, Admin cancel UI    | Demo exception              |
| Tuần 7 | Driver Should Have, harden transaction       | Reports, Excel export                                 | Dashboard, Reports, Audit, Driver pages | Demo quản lý                |
| Tuần 8 | Integration test, seed demo, Swagger cleanup | Report polish, support bugfix                         | UI polish, responsive, demo script      | Sẵn sàng bảo vệ             |

---

# 22. Test Case Mapping By Backend

| Test ID | Module                | Backend     | Expected Result                             |
| ------- | --------------------- | ----------- | ------------------------------------------- |
| TC-01   | Auth login            | .NET        | Staff login thành công, nhận JWT            |
| TC-02   | Spring verify JWT     | Spring Boot | Gọi dashboard bằng JWT hợp lệ thành công    |
| TC-03   | User create           | .NET        | Admin tạo Staff/Manager                     |
| TC-04   | Driver register       | .NET        | Driver tạo user/profile nếu làm Should Have |
| TC-05   | Vehicle type          | .NET        | Lấy loại xe active                          |
| TC-06   | Structure CRUD        | .NET        | Manager tạo floor/area/slot                 |
| TC-07   | Card create           | .NET        | Tạo Parking Card C001                       |
| TC-08   | Suggestion            | .NET        | Đề xuất đúng khu theo loại xe               |
| TC-09   | Entry                 | .NET        | Tạo session với Card AVAILABLE              |
| TC-10   | Card status           | .NET        | Card chuyển IN_USE                          |
| TC-11   | Slot status           | .NET        | Slot chuyển OCCUPIED                        |
| TC-12   | Active conflict card  | .NET + DB   | Card IN_USE không dùng cho session mới      |
| TC-13   | Active conflict plate | .NET + DB   | Plate đang active không tạo session mới     |
| TC-14   | Active conflict slot  | .NET + DB   | Slot đang active không gán session mới      |
| TC-15   | Public QR lookup      | Spring Boot | Driver xem session active qua QR Token      |
| TC-16   | Public lookup privacy | Spring Boot | Không lộ dữ liệu nhạy cảm                   |
| TC-17   | Fee calculation       | .NET        | Tính đúng block 4 tiếng                     |
| TC-18   | Payment cash          | .NET        | Payment PAID                                |
| TC-20   | Exit casual           | .NET        | Session completed, card/slot available      |
| TC-21   | Monthly pass exit     | .NET        | Payment WAIVED/NOT_REQUIRED                 |
| TC-22   | Dashboard update      | Spring Boot | Dashboard đọc đúng số liệu mới              |
| TC-23   | Lost card create      | .NET        | Staff tạo hồ sơ, session pending            |
| TC-24   | Lost card approve     | .NET        | Manager duyệt, fee/card update              |
| TC-25   | Mismatch create       | .NET        | Sai biển số bị chặn                         |
| TC-26   | Mismatch confirm      | .NET        | Manager xác nhận kèm lý do                  |
| TC-27   | Cancel session        | .NET        | Admin hủy session và giải phóng card/slot   |
| TC-28   | Move slot             | .NET        | Slot cũ available, slot mới occupied        |
| TC-29   | Pricing snapshot      | .NET        | Entry lưu snapshot giá                      |
| TC-30   | Audit search          | Spring Boot | Tìm log action quan trọng                   |
| TC-31   | Revenue report        | Spring Boot | Báo cáo doanh thu đúng                      |
| TC-32   | Excel export          | Spring Boot | Xuất file Excel nếu làm                     |
| TC-33   | Cross-backend data    | Both        | .NET ghi xong, Spring đọc được đúng         |
| TC-34   | Schema safety         | Both        | Spring ddl-auto validate khong sua schema   |

---

# 23. Minimum Demo Script Support

## Demo 1: Xe Vãng Lai Vào

Backend chính: `.NET`

1. Staff login qua `/api/core/auth/login`.
2. Staff mở Entry.
3. Nhập biển số `51A-12345`.
4. Chọn loại xe `Xe máy`.
5. Chọn Card `C001`.
6. Gọi `/api/core/parking-sessions/suggest-slot`.
7. Gọi `/api/core/parking-sessions/entry`.
8. Session `ACTIVE`.
9. Card `IN_USE`.
10. Slot `OCCUPIED`.
11. Pricing snapshot được lưu.

## Demo 2: Driver Quét QR

Backend chính: `Spring Boot`

1. Mở `/card/{qrToken-of-C001}`.
2. Frontend gọi `/api/public/cards/{qrToken}/active-session`.
3. Spring Boot đọc card/session từ PostgreSQL.
4. Hiển thị session active, masked plate và phí tạm tính preview.

## Demo 3: Xe Vãng Lai Ra

Backend chính: `.NET`

1. Staff mở Exit.
2. Nhập Card `C001`.
3. Gọi `/api/core/parking-sessions/by-card-code/C001`.
4. Gọi calculate fee.
5. Gọi `/api/core/payments/cash`.
6. Gọi exit.
7. Payment `PAID`.
8. Session `COMPLETED`.
9. Card `AVAILABLE`.
10. Slot `AVAILABLE`.

## Demo 4: Monthly Pass Exit

Backend chính: `.NET`

1. Manager tạo monthly pass cho biển số `51A-99999`.
2. Staff entry xe đó.
3. Hệ thống detect `customerType = MONTHLY`.
4. Staff exit bằng `/api/core/parking-sessions/{id}/monthly-pass-exit`.
5. Payment `WAIVED` hoặc `NOT_REQUIRED`.

## Demo 5: Dashboard Cập Nhật

Backend chính: `Spring Boot`

1. Manager mở dashboard.
2. Frontend gọi `/api/support/dashboard/summary`.
3. Spring Boot đọc số liệu mới từ PostgreSQL.
4. Hiển thị tổng slot, slot trống, card in use, doanh thu hôm nay.

## Demo 6: Lost Card

Backend chính: `.NET`

1. Staff tạo lost card case.
2. Session chuyển `LOST_CARD_PENDING`.
3. Manager duyệt.
4. .NET cập nhật case, session/card/fee.
5. Spring Boot audit log page đọc được log.

## Demo 7: Sai Biển Số

Backend chính: `.NET`

1. Staff exit với biển số khác lúc vào.
2. .NET tạo mismatch pending và chặn exit.
3. Manager confirm kèm lý do.
4. Staff tiếp tục exit.
5. Audit log có action mismatch.

## Demo 8: Admin Hủy Session

Backend chính: `.NET`

1. Admin tìm active session.
2. Admin nhập lý do hủy.
3. Gọi `/api/core/parking-sessions/{id}/cancel`.
4. Session `CANCELLED`.
5. Card/slot được giải phóng.
6. Audit log ghi action cancel.

## Demo 9: Reports Và Audit

Backend chính: `Spring Boot`

1. Manager mở Reports.
2. Gọi revenue/traffic/card reports.
3. Nếu kịp, export Excel.
4. Admin mở Audit Log.
5. Search action `SESSION_CREATED`, `PAYMENT_PAID`, `SESSION_CANCELLED`.

---

# 24. Risks And Mitigation

| Rủi ro                               | Nguyên nhân                          | Cách xử lý                                                              |
| ------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------- |
| Hai backend cung sua DB schema       | Runtime auto schema update           | Chi `database/*.sql` tao schema, Spring `ddl-auto=validate`             |
| Enum lệch                            | .NET dùng enum int, Java dùng string | Database lưu enum string                                                |
| Spring update nhầm bảng core         | Dev support viết repository save     | Quy định read-only repository cho bảng core                             |
| Driver register conflict             | Support API tự ghi dữ liệu Driver    | Driver write thuộc .NET                                                 |
| JWT không verify được giữa 2 backend | Khác secret/issuer/audience          | Dùng chung JWT config                                                   |
| Dashboard đọc dữ liệu chưa commit    | Gọi report quá sớm                   | Chỉ đọc sau khi .NET API success                                        |
| Report query nặng                    | Join nhiều bảng                      | Thêm index, giới hạn date range                                         |
| Logic tính phí bị duplicate          | Spring tự tính khác .NET             | Fee chính thức chỉ .NET, Spring chỉ preview                             |
| Frontend gọi nhầm service            | API path không rõ                    | Prefix `/api/core`, `/api/support`, `/api/public`                       |
| Audit log thiếu                      | Dev quên ghi log                     | Tạo AuditWriterService trong .NET và AuditLogWriterService trong Spring |
| Giá đổi khi session active           | Tính theo giá mới gây tranh cãi      | Snapshot giá lúc entry                                                  |

---

# 25. Definition Of Done

## 25.1 Backend .NET Task Done Khi

- Có API endpoint chạy được.
- Có DTO request/response.
- Có validation.
- Có role authorization.
- Có service logic đúng rule.
- Có EF repository/query.
- Có transaction cho nghiệp vụ core.
- Có audit log nếu là action quan trọng.
- Có Swagger/OpenAPI.
- Có test bằng Postman/Swagger.
- Không dùng endpoint unprefixed cũ.

## 25.2 Backend Spring Boot Task Done Khi

- Có API endpoint chạy được.
- Verify JWT được từ token .NET.
- Không tự sửa schema database.
- Repository core là read-only.
- Không update core tables trừ append-only audit log.
- Query report/public đúng dữ liệu.
- Response format giống .NET.
- Có Swagger/OpenAPI.
- Có test bằng Postman/Swagger.

## 25.3 Frontend Task Done Khi

- Có page/component đúng route.
- Gọi đúng `coreApi`, `supportApi`, `publicApi`.
- Có loading/error/success state.
- Có role guard.
- Có form validation cơ bản.
- UI đủ demo.
- Driver public web responsive cơ bản.

---

# 26. Checklist Trước Khi Code

## 26.1 Cần Chốt Chung

- [ ] PostgreSQL là database duy nhất.
- [ ] ID mặc định dùng `BIGSERIAL`.
- [ ] `database/*.sql` la database source of truth.
- [ ] Spring Boot `ddl-auto=validate`.
- [ ] JWT secret/issuer/audience dùng chung.
- [ ] Timezone lưu `TIMESTAMPTZ`.
- [ ] Enum lưu string.
- [ ] API prefix `/api/core`, `/api/support`, `/api/public`.
- [ ] Role model MVP dùng enum trong `users`.
- [ ] Driver write thuộc .NET.
- [ ] Seed data demo.

## 26.2 .NET Cần Chuẩn Bị

- [ ] Solution ASP.NET Core Web API.
- [ ] EF Core + Npgsql.
- [ ] ParkingDbContext.
- [ ] Initial SQL schema.
- [ ] Seed Admin, Staff, Manager.
- [ ] Seed vehicle types.
- [ ] Seed floors/areas/slots/gates.
- [ ] Seed cards C001-C020.
- [ ] Seed pricing rules.
- [ ] Swagger.
- [ ] AuditWriterService.

## 26.3 Spring Boot Cần Chuẩn Bị

- [ ] Spring Boot REST API.
- [ ] PostgreSQL connection.
- [ ] JPA read entity mapping.
- [ ] `ddl-auto=validate`.
- [ ] JWT validation compatible với .NET.
- [ ] Public API skeleton.
- [ ] Dashboard/report skeleton.
- [ ] Apache POI nếu làm Excel.
- [ ] Read-only repository convention.

## 26.4 Frontend Cần Chuẩn Bị

- [ ] React Router.
- [ ] `coreAxiosClient`.
- [ ] `supportAxiosClient`.
- [ ] `publicAxiosClient`.
- [ ] AuthProvider.
- [ ] ProtectedRoute.
- [ ] RoleBasedRoute.
- [ ] Staff layout.
- [ ] Manager/Admin layout.
- [ ] Driver public layout.

---

# 27. Verification Checklist Cho Tài Liệu

Sau khi chỉnh tài liệu hoặc code, kiểm tra:

Chạy `rg` để rà các chuỗi cũ có nguy cơ gây mâu thuẫn: bảng RBAC tách riêng, package Excel phía .NET, quyền ghi core table ở Support API, và endpoint thiếu prefix.

Kết quả mong muốn:

- Không có hướng dẫn dùng RBAC table cho MVP.
- Không có package Excel trong .NET package.
- Không có rule cho Spring ghi core tables.
- Không còn endpoint cũ unprefixed ngoài phần cảnh báo "không dùng".

---

# 28. Kết Luận

Bản thiết kế này là spec triển khai chính cho mô hình dual-backend:

```text
.NET Core API = core transaction owner + auth + driver write + maps existing SQL schema
Spring Boot API = support/read/report/public owner
database/*.sql = database source of truth
React = gọi đúng API theo module
```

Phân bổ theo nhân lực:

```text
2 dev .NET       -> chịu trách nhiệm nghiệp vụ ghi chính và nhiều module core
2 dev Spring Boot -> public, dashboard, report, audit, support module
```

Luồng demo core cần đạt:

```text
.NET: Login -> Entry -> Card/Slot update -> Fee -> Payment -> Exit
Spring: Public QR lookup -> Dashboard -> Reports -> Audit search
PostgreSQL: Dữ liệu chung, enum chung, schema chung, owner rõ ràng
```

Nếu tuân thủ ownership bảng, SQL schema rule, API prefix, JWT config và transaction boundary trong tài liệu này, hai backend có thể phát triển song song mà không xung đột dữ liệu.

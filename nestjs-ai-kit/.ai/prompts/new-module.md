# Prompt Template: Tạo module DDD mới

## Cách dùng
1. Copy toàn bộ phần giữa `---START---` và `---END---`
2. Điền thông tin vào các mục `[...]`
3. Paste vào chat với AI
4. Chờ AI hỏi clarifying questions
5. Review implementation_plan → approve trước khi AI code

---START---
/create module [tên module]

**Mô tả:** [1-2 câu mô tả chức năng chính]

**Domain entities:**
- [Entity 1]: [liệt kê fields và types, ví dụ: id (uuid), name (string), status (enum), amount (decimal)]
- [Entity 2 nếu có]

**Business invariants (rules mà create() phải validate):**
1. [Invariant 1, ví dụ: email phải valid format]
2. [Invariant 2, ví dụ: amount phải > 0]
3. [Hoặc: Không có invariant đặc biệt — CRUD cơ bản]

**Use cases (operations):**
1. [Use case 1, ví dụ: Tạo notification mới với channel và payload]
2. [Use case 2]
3. [Use case 3]

**Domain enums (nếu có):**
- [EnumName]: [VALUE_1, VALUE_2, VALUE_3]

**Cross-module dependencies:**
- Cần data từ module `[tên]`: cần [loại data cụ thể, ví dụ: userId, email, name của user]
- [Hoặc: Không có — module độc lập]

**API endpoints:**
- `POST /[module]s` — [mô tả]
- `GET  /[module]s` — list paginated
- `GET  /[module]s/:id` — get by id
- [Thêm endpoints nếu có]

**Prisma schema (nếu đã có ý tưởng):**
```prisma
model [Entity] {
  id        String    @id @default(uuid())
  [field]   [type]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  @@map("[table_name]")
}
```
[Hoặc: Để AI đề xuất schema]

---END---

---

## Ví dụ đã điền

---START---
/create module notification

**Mô tả:** Gửi thông báo đa kênh (email, in-app) khi có sự kiện trong hệ thống.

**Domain entities:**
- Notification: id (uuid), userId (string), type (string), channel (enum), status (enum), payload (json string), sentAt (datetime nullable)

**Business invariants:**
1. userId phải tham chiếu đến user tồn tại
2. payload không được empty
3. channel chỉ được là các giá trị hợp lệ của NotificationChannel enum

**Use cases:**
1. Tạo notification và đưa vào queue gửi async
2. Liệt kê notifications của user (paginated, lọc theo status)
3. Đánh dấu notification đã đọc (status = READ)

**Domain enums:**
- NotificationChannel: EMAIL, IN_APP, SMS
- NotificationStatus: PENDING, SENT, FAILED, READ

**Cross-module dependencies:**
- Cần data từ module `user`: userId, email, name của người nhận

**API endpoints:**
- `POST /notifications` — tạo notification (require auth)
- `GET /notifications` — list notifications của current user (paginated)
- `PATCH /notifications/:id/read` — đánh dấu đã đọc

**Prisma schema:**
```prisma
model Notification {
  id        String              @id @default(uuid())
  userId    String              @map("user_id")
  type      String
  channel   NotificationChannel
  status    NotificationStatus  @default(PENDING)
  payload   String              @db.Text
  sentAt    DateTime?           @map("sent_at")
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")
  deletedAt DateTime?           @map("deleted_at")
  @@index([userId])
  @@map("notifications")
}
enum NotificationChannel { EMAIL IN_APP SMS }
enum NotificationStatus { PENDING SENT FAILED READ }
```
---END---

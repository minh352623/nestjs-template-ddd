# Prompt Template: Thêm API endpoint vào module đã có

## Cách dùng
Copy phần giữa `---START---` và `---END---`, điền thông tin, paste vào chat.

---START---
/create endpoint

**Module:** `src/modules/[tên module]/`
**Method + Path:** `[GET/POST/PUT/PATCH/DELETE] /[path]`
**Mô tả:** [Endpoint này làm gì?]

**Request:**
- Body (JSON): [mô tả fields, hoặc "Không có body"]
  - `[field]` ([type], [required/optional]): [mô tả]
- Query params: [mô tả, hoặc "Không có"]
- Path params: `:id` ([type]) [hoặc không có]

**Response success:**
- Status: [200/201/204]
- Body: [mô tả data trả về, hoặc "Không có body (204)"]

**Business rules / invariants:**
1. [Rule 1]
2. [Hoặc: CRUD đơn giản, không có business rule đặc biệt]

**Transaction needed?**
- [Có — ghi rõ các models Prisma nào được write]
- [Không — chỉ update 1 model]

**Auth:** [JWT required / Public]

---END---

## Ví dụ đã điền

---START---
/create endpoint

**Module:** `src/modules/payment/`
**Method + Path:** `PATCH /payments/:id/complete`
**Mô tả:** Đánh dấu một payment đã hoàn thành.

**Request:**
- Body: Không có body
- Path params: `:id` (UUID) — ID của payment

**Response success:**
- Status: 200
- Body: PaymentOutputDto `{ id, userId, amount, currency, status: "COMPLETED", updatedAt }`

**Business rules:**
1. Payment phải đang ở trạng thái `PROCESSING` — không thể complete PENDING hoặc FAILED
2. Chỉ admin hoặc owner mới được complete (check ownership trong service)

**Transaction:** Không — chỉ update status của payment

**Auth:** JWT required
---END---

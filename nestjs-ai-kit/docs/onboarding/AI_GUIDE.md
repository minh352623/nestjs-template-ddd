# Hướng dẫn làm việc với AI — NestJS DDD Project

> **Đọc tài liệu này ngày đầu onboarding.**
> Guide thực tế, ngắn gọn — không phải lý thuyết.

---

## TL;DR — 5 điều phải nhớ

1. **Domain layer KHÔNG được import NestJS hay Prisma** — vi phạm là block PR
2. **Entity luôn có `create()` + `reconstitute()`** — không bao giờ `new Entity()` bên ngoài entity file
3. **Dùng `DomainException`, không dùng `new Error()` hay HTTP exceptions trong service**
4. **Mapper bắt buộc** — repository không bao giờ trả Prisma model ra ngoài
5. **`/plan` trước khi làm task lớn** — đừng để AI code ngay khi chưa có plan

---

## 1. Setup môi trường (15 phút)

### Bước 1: Cài AI tool

```bash
# Khuyến nghị: Claude Code
npm install -g @anthropic-ai/claude-code
claude  # chạy trong thư mục project

# Hoặc: Cursor (IDE với AI tích hợp)
# Download tại cursor.com, mở project folder
```

### Bước 2: Verify AI hiểu project

Gõ vào chat:
```
Đọc AGENTS.md và tóm tắt:
1. Project dùng ORM gì?
2. 5 Critical Rules là gì?
3. Entity có pattern gì đặc biệt?
```

✅ AI trả lời: Prisma, factory method, result pattern, DomainException hierarchy
❌ AI trả lời chung chung → AI chưa đọc được AGENTS.md — kiểm tra lại

### Bước 3: Đọc tài liệu quan trọng (~30-40 phút)

```bash
# Bắt buộc đọc trước khi code bất cứ thứ gì
cat AGENTS.md                          # ~10 phút — 5 Critical Rules
cat .ai/context/ARCHITECTURE.md        # ~10 phút — project structure
cat .ai/context/PATTERNS.md            # ~15 phút — code patterns thực tế
# Nhìn lướt qua
cat .ai/context/ADR.md                 # decisions đã được lock
cat .ai/context/MODULES.md             # modules đang có + cross-module deps
```

### Bước 4: Hiểu project structure bằng code thực

```bash
# Xem user module (module mẫu)
ls -la src/modules/user/
ls -la src/modules/user/domain/
ls -la src/modules/user/infrastructure/

# Xem shared kernel
ls -la src/shared/domain/exceptions/
cat src/shared/domain/result.ts
cat src/shared/domain/base.entity.ts
```

---

## 2. Quy trình task hàng ngày

### Task nhỏ (< 30 phút, 1-2 files)

```
Mô tả rõ task + file cần sửa → AI tạo code → chạy checklist → commit
```

Ví dụ prompt tốt:
```
Thêm method findByEmail(email: string): Promise<User | null> vào UserRepository.
Abstract class: src/modules/user/domain/repository/user.repository.ts
Implementation: src/modules/user/infrastructure/persistence/repository/user.repository.ts
Dùng Prisma findFirst với filter deletedAt: null
```

### Task vừa (1-3 giờ, nhiều files)

```
/plan [mô tả task] → review + approve plan → AI implement → checklist → commit
```

### Task lớn (nửa ngày+, cross-module hoặc module mới)

```
Copy template từ .ai/prompts/ → điền thông tin → paste → approve plan →
implement từng phase → checklist → PR
```

---

## 3. Lệnh hay dùng nhất

```bash
# Tạo module mới
# → Copy prompt từ .ai/prompts/new-module.md, điền thông tin, paste vào chat

# Thêm endpoint
# → Copy prompt từ .ai/prompts/add-endpoint.md

# Viết unit test
# → Copy prompt từ .ai/prompts/write-test.md

# Debug lỗi
/debug
Error message: [paste đây]
File: [path nếu biết]
Context: [đang làm gì thì gặp lỗi]

# Code review
/review src/modules/[module]/ architecture

# Refactor vi phạm
/refactor src/modules/[module]/domain/ "domain imports @nestjs — cần fix"
```

---

## 4. Checklist trước mỗi commit

```
═══════════════════════════════════════════
AI OUTPUT CHECKLIST — NestJS DDD
Task: _________________________________
Date: _________________________________
═══════════════════════════════════════════

DOMAIN PURITY (Critical — block PR nếu fail)
[ ] domain/ không có import @nestjs/common (ngoài @Injectable)
[ ] domain/ không có import @prisma/client
[ ] Entity có private constructor, create(), và reconstitute()
[ ] Entity.create() trả Result<Entity> — không throw trực tiếp
[ ] Không có throw new Error() trong domain hoặc application layer
[ ] Không có throw new NotFoundException/BadRequestException trong service

INFRASTRUCTURE
[ ] Prisma Repository dùng Mapper để convert model → Entity
[ ] Tất cả queries có filter deletedAt: null
[ ] Không có N+1 (không query trong loop)
[ ] softDelete() dùng update deletedAt thay vì delete

MODULE WIRING
[ ] Abstract class được dùng làm provide token (không phải class cụ thể)
[ ] PrismaService có trong module providers
[ ] Module chỉ export Service và Repository (không export implement)
[ ] Cross-module: Port token + Adapter đã được wire

TYPESCRIPT / NESTJS
[ ] Không có console.log — dùng Logger
[ ] Không có floating promise (missing await)
[ ] Không có any type
[ ] External HTTP calls có timeout: 5000
[ ] ParseUUIDPipe trên tất cả :id params

SECURITY
[ ] Không có secret hardcode — dùng ConfigService
[ ] Không log password/token/PII
[ ] JwtAuthGuard trên các route cần bảo vệ
[ ] DTO có class-validator decorators

TESTING
[ ] Unit test cho Entity.create() — success + validation failure
[ ] Unit test cho Application Service — success + exception cases

RESULT: PASS □   FAIL □ (fix → rerun checklist)
═══════════════════════════════════════════
```

---

## 5. Xử lý khi AI làm sai

### AI import NestJS/Prisma vào domain/

```
❌ AI viết: import { Injectable, Logger } from '@nestjs/common'; trong domain/service/impl

Nói với AI:
"Domain Service implementation chỉ được import @Injectable từ @nestjs/common.
Logger phải ở Application layer, không phải Domain. Đọc AGENTS.md Rule 1 và sửa lại."
```

### AI dùng new Entity() thay vì create()

```
❌ AI viết: const user = new User(); user.email = email;

Nói với AI:
"Entity không được khởi tạo bằng new bên ngoài entity file.
Dùng User.create(props) — trả Result<User>. Đọc AGENTS.md Rule 2 và PATTERNS.md Pattern Entity."
```

### AI không dùng Mapper trong repository

```
❌ AI viết: return this.prisma.user.findUnique({ where: { id } });

Nói với AI:
"Repository phải map Prisma model ra Domain Entity qua UserMapper.toDomain().
Không bao giờ trả Prisma model ra ngoài repository. Đọc AGENTS.md Rule 5."
```

### AI dùng NotFoundException trong service

```
❌ AI viết: throw new NotFoundException('User not found');

Nói với AI:
"Service layer không được throw HTTP exceptions. Dùng DomainException hierarchy:
throw new EntityNotFoundException('User', id)
DomainExceptionFilter tự map sang 404. Đọc AGENTS.md Rule 3."
```

### AI không hỏi clarifying questions trước khi code

```
Nói với AI:
"Trước khi code, đọc .agent/workflows/create.md (hoặc plan.md) và follow workflow:
hỏi clarifying questions → tạo implementation plan → chờ approve → implement."
```

### AI quên filter deletedAt: null trong Prisma query

```
❌ AI viết: where: { id }

Nói với AI:
"Project dùng soft delete — tất cả queries phải có deletedAt: null filter.
Sửa thành: where: { id, deletedAt: null }"
```

---

## 6. FAQ

**Q: Tôi có thể dùng TypeORM không?**
A: Không. Project này dùng Prisma exclusively. Xem ADR-001.

**Q: Entity.reconstitute() có validate không?**
A: Không — nó tin tưởng data từ DB là đã valid. Chỉ create() validate invariants.

**Q: Khi nào dùng Result<T>, khi nào throw trực tiếp?**
A: Entity factory methods (create) → dùng Result. Application service → throw DomainException (propagate từ Result.fail). Infrastructure errors → throw và để AllExceptionsFilter handle.

**Q: Port interface hay abstract class?**
A: Port trong `domain/ports/` dùng TypeScript `interface` (IExternalUserPort). Repository abstract class dùng `abstract class` (UserRepository). Lý do: Repository cần @Injectable() cho NestJS DI; Port interface không cần.

**Q: Module wiring: provide UserRepository hay PrismaUserRepository?**
A: Luôn provide abstract class làm token: `{ provide: UserRepository, useClass: PrismaUserRepository }`. Service inject `UserRepository` (abstract) — không biết implementation cụ thể.

**Q: Khi nào cần transaction (Prisma $transaction)?**
A: Khi 1 use case write vào nhiều Prisma models cùng lúc và cần atomic. Wrap trong repository method hoặc dùng UnitOfWork pattern (xem PATTERNS.md).

**Q: DomainEvent dùng khi nào?**
A: Khi entity thay đổi trạng thái và cần notify các phần khác của system async (ví dụ: Payment COMPLETED → emit PaymentCompletedEvent → Notification listener gửi email). Dùng `entity.addDomainEvent(new XxxEvent(...))` trong entity method.

---

## 7. Tham khảo nhanh

| Cần gì | Đọc file |
|--------|---------|
| Architecture tổng thể | `.ai/context/ARCHITECTURE.md` |
| Module X làm gì | `.ai/context/MODULES.md` |
| Code pattern chuẩn | `.ai/context/PATTERNS.md` |
| Quyết định kiến trúc | `.ai/context/ADR.md` |
| Rules cho entity files | `.ai/rules/entity.mdc` |
| Rules cho service files | `.ai/rules/service.mdc` |
| Rules cho handler files | `.ai/rules/handler.mdc` |
| Rules cho repository files | `.ai/rules/repository.mdc` |
| DDD patterns in NestJS | `.agent/skills/ddd-nestjs.md` |
| Prisma patterns | `.agent/skills/prisma-patterns.md` |
| Exception patterns | `.agent/skills/exception-patterns.md` |
| Tạo module mới | `.ai/prompts/new-module.md` |
| Thêm endpoint | `.ai/prompts/add-endpoint.md` |
| Viết unit test | `.ai/prompts/write-test.md` |

# NestJS DDD — AI Workflow Kit

> **Drop-in AI configuration** cho `nestjs-template-ddd` và các project NestJS DDD tương tự.
> Reference: https://github.com/minh352623/nestjs-template-ddd

---

## Đặc điểm project này

| Feature | Choice |
|---------|--------|
| ORM | **Prisma** (NOT TypeORM) |
| Domain pattern | **AggregateRoot + Factory Method + Result<T>** |
| Error model | **DomainException hierarchy** (EntityNotFoundException, ConflictException, etc.) |
| Cross-module | **Port Interface + Local/Http Adapter** |
| Data mapping | **Mapper** (Entity ↔ Prisma model) — bắt buộc |
| Response format | `{ data, message }` (ResponseInterceptor) |
| Error format | `{ code, message, details, path, timestamp }` (DomainExceptionFilter) |

---

## Cài đặt

```bash
cp -r nestjs-ai-kit/. your-project/

# Sau đó điền thông tin vào:
# 1. AGENTS.md — project name, domain
# 2. .ai/context/ARCHITECTURE.md — stack thực tế, modules đang có
# 3. .ai/context/MODULES.md — catalog các modules
```

---

## Cấu trúc

```
.
├── AGENTS.md                         # ⭐ Constitution — AI đọc đầu tiên
│
├── .agent/
│   ├── workflows/
│   │   ├── plan.md                   # /plan — lập kế hoạch trước khi code
│   │   ├── create.md                 # /create — scaffold module/endpoint/port
│   │   ├── debug.md                  # /debug — RCA có hệ thống
│   │   ├── review.md                 # /review — audit architecture + security
│   │   └── refactor.md               # /refactor — fix violations an toàn
│   ├── agents/
│   │   ├── backend-nest.md           # NestJS DDD specialist
│   │   ├── security.md               # Security auditor
│   │   └── qa.md                     # Testing specialist
│   └── skills/
│       ├── ddd-nestjs.md             # DDD patterns (Entity, Repository, Service)
│       ├── prisma-patterns.md        # Prisma patterns + Mapper
│       └── exception-patterns.md     # DomainException + Result pattern
│
├── .ai/
│   ├── rules/                        # Per-file-type Cursor/Windsurf rules
│   │   ├── entity.mdc                # Domain Entity rules
│   │   ├── service.mdc               # Application Service rules
│   │   ├── handler.mdc               # HTTP Handler rules
│   │   ├── repository.mdc            # Infrastructure Repository rules
│   │   └── dto.mdc                   # DTO rules
│   ├── context/                      # Project knowledge base
│   │   ├── ARCHITECTURE.md           # System overview + stack
│   │   ├── ADR.md                    # 8 Architecture Decision Records
│   │   ├── PATTERNS.md               # 7 approved code patterns
│   │   └── MODULES.md                # Module catalog + dependency graph
│   └── prompts/                      # Copy-paste prompt templates
│       ├── new-module.md             # Tạo module mới
│       ├── add-endpoint.md           # Thêm endpoint
│       └── write-test.md             # Viết unit test
│
└── docs/onboarding/
    └── AI_GUIDE.md                   # Hướng dẫn cho thành viên mới
```

---

## Checklist khi customize cho project mới

- [ ] `AGENTS.md` — điền Project Name, Domain
- [ ] `AGENTS.md` Section 10 — cập nhật Module Catalog
- [ ] `.ai/context/ARCHITECTURE.md` — cập nhật modules đang có, stack thực tế
- [ ] `.ai/context/MODULES.md` — thêm tất cả modules đang có
- [ ] `.ai/context/ADR.md` — thêm ADRs nếu có quyết định kiến trúc mới

---

## Quick start cho member mới

1. `npm install -g @anthropic-ai/claude-code && claude`
2. Đọc: `AGENTS.md` + `.ai/context/ARCHITECTURE.md` + `.ai/context/PATTERNS.md`
3. Đọc: `docs/onboarding/AI_GUIDE.md` cho workflow hàng ngày
4. Test: Hỏi AI "3 rules quan trọng nhất của project này là gì?"

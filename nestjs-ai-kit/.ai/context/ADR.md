# Architecture Decision Records (ADR)

> **AI instruction:** Check this before implementing anything touching database, auth, error handling, or module structure.
> If your task would violate an ADR → flag it and ask the user before proceeding.

---

## ADR-001 | Use Prisma (not TypeORM) | Accepted | 2025-01-10

**Context:** Need a database layer that is type-safe, generates client from schema, and has excellent DX.

**Decision:** Use Prisma exclusively. TypeORM is NOT used in this project.

**Consequences:**
- ✅ Type-safe queries generated from schema — compile-time errors
- ✅ Schema is source of truth, not entity decorators
- ✅ Excellent migration tooling
- ❌ Must run `prisma generate` after schema changes
- ❌ Less flexible for complex dynamic queries (use `$queryRaw` with template literals)

**Enforcement:** `grep -r "typeorm" src/` in CI must return empty.

---

## ADR-002 | DDD 4-Layer Architecture — Domain purity enforced | Accepted | 2025-01-10

**Context:** Need architecture that isolates business logic from framework and ORM.

**Decision:** Every module uses Domain → Application → Infrastructure → Controller layers. Domain layer has ZERO NestJS or Prisma imports.

**Enforcement:** `grep -r "@nestjs\|prisma" src/modules/*/domain/` in CI must return empty (excluding `@Injectable` in domain service impls).

---

## ADR-003 | AggregateRoot + Factory Method + Result Pattern | Accepted | 2025-01-10

**Context:** Need entities that enforce their own invariants and prevent invalid state.

**Decision:**
- All domain entities extend `AggregateRoot<IdType>` from shared kernel
- All entities have `create(props): Result<Entity>` and `reconstitute(props): Entity`
- `create()` validates invariants and returns `Result.fail(DomainException)` on failure
- `reconstitute()` skips validation — used only by Mapper when loading from DB
- Never `new Entity()` outside the entity file itself

**Enforcement:** Code review. Any `new UserEntity()` or `new PaymentEntity()` in non-entity files = PR blocked.

---

## ADR-004 | DomainException hierarchy — never plain Error or HTTP exceptions in service layer | Accepted | 2025-01-10

**Context:** Services must be transport-agnostic (usable via HTTP, gRPC, CLI, tests). HTTP status codes are a transport concern.

**Decision:**
- Use `EntityNotFoundException`, `ConflictException`, `ValidationException`, `BusinessRuleViolationException`, `BusinessException` from shared kernel
- `DomainExceptionFilter` maps these to HTTP status automatically
- Controller layer has no try/catch — filter handles everything
- `AllExceptionsFilter` is safety net for unexpected errors (→ 500 + log)

**Enforcement:** `grep -r "new Error\|NotFoundException\|BadRequestException" src/modules/*/application/` must return empty.

---

## ADR-005 | Cross-Module: Port Interface + Adapter Pattern | Accepted | 2025-01-15

**Context:** Modules need data from each other without tight coupling. Must be ready for microservice extraction.

**Decision:**
- Consumer module defines `IExternal[Provider]Port` interface in its own `domain/ports/`
- Consumer has two adapters: `LocalAdapter` (wraps provider's service) + `HttpAdapter` (calls microservice API)
- Provider module is unaware of consumer — no callback, no circular dependency
- Module.ts wires `{ provide: EXTERNAL_PORT_TOKEN, useClass: LocalAdapter }`
- Switching to microservice = change one line in module.ts

**Enforcement:** Direct cross-module service imports in service files = PR blocked.

---

## ADR-006 | Mapper Pattern — Prisma Model ↔ Domain Entity | Accepted | 2025-01-15

**Context:** Domain Entity must remain pure — no ORM annotations, no Prisma types. Infrastructure must not leak into domain.

**Decision:**
- Every Prisma repository has a corresponding Mapper class
- `Mapper.toDomain(model)` → Domain Entity (via `reconstitute()`)
- `Mapper.toPersistence(entity)` → Prisma create/update input
- Repositories NEVER return Prisma models — always Domain Entities

**Enforcement:** Code review. Repository methods returning non-Entity types = PR blocked.

---

## ADR-007 | Soft Delete for all user-facing entities | Accepted | 2025-02-01

**Context:** Business requires audit trail and potential recovery. Compliance may require GDPR-style erasure separately.

**Decision:**
- All entities have `deletedAt DateTime? @map("deleted_at")` in Prisma schema
- All repository queries include `where: { deletedAt: null }`
- Physical deletion only for GDPR right-to-erasure (handled separately)
- `softDelete()` sets `deletedAt = new Date()`

**Enforcement:** Any Prisma query missing `deletedAt: null` filter = PR review flag.

---

## ADR-008 | Response Format: { data, message } for success | Accepted | 2025-02-01

**Context:** Consistent API response format for clients.

**Decision:**
- `ResponseInterceptor` (global) wraps all success responses: `{ data: <result>, message: "Success" }`
- Error responses from `DomainExceptionFilter`: `{ code, message, details, path, timestamp }`
- Controller methods just return the data — interceptor wraps automatically

---

## ADR Template

```markdown
## ADR-NNN | [Title] | [Proposed/Accepted/Deprecated] | [Date]

**Context:** [Problem and forces at play]
**Decision:** [What was decided]
**Consequences:**
- ✅ [Benefit]
- ❌ [Trade-off]
**Enforcement:** [How violations are caught]
```

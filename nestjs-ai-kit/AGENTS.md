# AGENTS.md — NestJS DDD Project Constitution

> **⚠️ AI: Read this file FIRST before doing ANYTHING in this project.**
> This is the single source of truth. All rules are NON-NEGOTIABLE unless
> explicitly overridden by the user in the current task context.

---

## 1. Project Overview

**Project:** [Project Name — fill in]
**Domain:** [e.g., E-commerce, Fintech, SaaS — fill in]
**Architecture:** NestJS + DDD (4 layers) + Prisma + Port & Adapter
**Language:** TypeScript 5.x (strict mode — enforced)
**ORM:** Prisma (NOT TypeORM — NEVER use TypeORM in this project)
**Database:** PostgreSQL
**Node:** 18+

---

## 2. Language Rules

| Context | Language |
|---------|---------|
| Code (variables, functions, classes, files) | **English** |
| Code comments & JSDoc | **English** |
| Log messages | **English** |
| API error messages | **English** |
| Architecture docs, ADRs | **English** |
| Chat responses (if user writes in Vietnamese) | **Vietnamese** |
| Team onboarding guides | **Vietnamese** |

---

## 3. Architecture — 4 DDD Layers (NON-NEGOTIABLE)

### Layer Map

```
┌─────────────────────────────────────────────────────┐
│  🔵 Controller     HTTP Handler, DTO validation     │
│       ↓ calls                                       │
│  🟡 Application    Orchestrate, Logger, use cases   │
│       ↓ calls                                       │
│  🔴 Domain         Business rules, Entity, Port     │
│       ↑ implements                                  │
│  🟢 Infrastructure Prisma, External adapters        │
└─────────────────────────────────────────────────────┘

Dependency rule: outer layers depend inward. Domain has ZERO dependencies.
```

### Module folder structure (every module follows this exactly)

```
src/modules/[module]/
├── domain/
│   ├── model/entity/[entity].entity.ts         # AggregateRoot + Factory Method
│   ├── repository/[entity].repository.ts       # Abstract class (Port)
│   └── service/
│       ├── [module].domain.service.ts          # Domain Service interface
│       └── [module].domain.service.impl.ts     # Implementation
│       └── ports/                              # (if cross-module) external ports
│           └── external-[dep].port.ts          # IExternal[Dep]Port interface
│
├── application/
│   └── service/
│       ├── dto/[module].dto.ts                 # Input/Output DTOs (Application layer)
│       ├── [module].service.ts                 # Abstract class (use case interface)
│       └── [module].service.impl.ts            # Implementation + Logger
│
├── infrastructure/
│   └── persistence/
│       ├── model/[entity].model.ts             # Prisma model type alias
│       ├── mapper/[entity].mapper.ts           # Entity ↔ Prisma Model converter
│       └── repository/[entity].repository.ts  # Prisma implementation
│   └── external/                              # (if cross-module)
│       ├── [dep].local-adapter.ts             # Monolith adapter
│       └── [dep].http-adapter.ts              # Microservice adapter
│
├── controller/
│   ├── dto/[entity].dto.ts                    # HTTP DTOs (@ApiProperty + class-validator)
│   └── http/[entity].handler.ts              # REST endpoints + Swagger
│
└── [module].module.ts                         # DI wiring
```

### Shared Kernel (src/shared/)

```
src/shared/
├── domain/
│   ├── base.entity.ts                 # Entity<T>, AggregateRoot<T>, DomainEvent
│   ├── value-object.ts                # Base Value Object
│   ├── result.ts                      # Result<T> — success/failure without throw
│   └── exceptions/
│       └── domain.exception.ts        # DomainException hierarchy
├── application/
│   ├── use-case.ts                    # UseCase<I, O> interface
│   └── mapper.ts                      # Mapper<D, P> interface
└── presentation/
    ├── filters/
    │   ├── domain-exception.filter.ts # DomainException → HTTP status
    │   └── all-exceptions.filter.ts   # Safety net catch-all
    └── interceptors/
        └── response.interceptor.ts    # Wrap all success responses: { data, message }
```

---

## 4. The 5 Critical Rules (Violations block PR)

### Rule 1: Domain layer has ZERO framework dependencies

```typescript
// ❌ FORBIDDEN in domain/ folder:
import { Injectable } from '@nestjs/common';    // NestJS
import { PrismaClient } from '@prisma/client';  // Prisma
import { Column } from 'typeorm';               // TypeORM (also forbidden project-wide)

// ✅ Domain only uses:
import { AggregateRoot } from '../../../shared/domain/base.entity';
import { Result } from '../../../shared/domain/result';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
```

### Rule 2: Entity uses Factory Method — never `new Entity()`

```typescript
// ❌ FORBIDDEN: direct construction
const user = new User();
user.email = email;

// ✅ REQUIRED: Factory Method pattern
// create() — for new entities, validates invariants
const result = User.create({ email, name, password });
if (result.isFailure) throw result.error;
const user = result.getValue();

// reconstitute() — for entities loaded from DB, skips validation
const user = User.reconstitute({ id, email, name, createdAt });
```

### Rule 3: DomainException hierarchy — never plain `new Error()`

```typescript
// ❌ FORBIDDEN:
throw new Error('User not found');
throw new NotFoundException('User not found');   // HTTP in domain/application
throw new BadRequestException('Invalid input');  // HTTP in domain/application

// ✅ REQUIRED — choose the right exception:
throw new EntityNotFoundException('User', userId);              // 404
throw new ConflictException('Email already exists');            // 409
throw new ValidationException([{ field: 'email', msg: '...' }]); // 400
throw new BusinessRuleViolationException('Insufficient balance'); // 422
throw new BusinessException('ORDER_ALREADY_PAID', 'Order is already paid'); // custom code
```

### Rule 4: Repository is abstract class in Domain — Prisma only in Infrastructure

```typescript
// ❌ FORBIDDEN: Prisma in Application or Domain
// application/service/user.service.impl.ts
constructor(private readonly prisma: PrismaClient) {}  // VIOLATION

// ✅ REQUIRED: Inject abstract class (Port), wire to Prisma impl in Module
// domain/repository/user.repository.ts
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
}

// infrastructure/persistence/repository/user.repository.ts
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) { super(); }
  async findById(id: string) { ... }  // ← Prisma here
}

// user.module.ts
{ provide: UserRepository, useClass: PrismaUserRepository }
```

### Rule 5: Mapper is mandatory — never return Prisma model from repository

```typescript
// ❌ FORBIDDEN: Repository returns Prisma model directly
async findById(id: string) {
  return this.prisma.user.findUnique({ where: { id } }); // returns Prisma User model
}

// ✅ REQUIRED: Repository maps to Domain Entity
async findById(id: string): Promise<User | null> {
  const model = await this.prisma.user.findUnique({ where: { id } });
  if (!model) return null;
  return UserMapper.toDomain(model);  // always map!
}
```

---

## 5. Result Pattern Usage

```typescript
// Use Result<T> to avoid throwing exceptions in domain logic
// Result.ok(value) — success
// Result.fail(error) — failure without exception

// In entity factory:
static create(props: UserCreateProps): Result<User> {
  if (!isValidEmail(props.email)) {
    return Result.fail(new ValidationException([{ field: 'email', message: 'Invalid email' }]));
  }
  const user = User.reconstitute({ id: uuid(), ...props });
  return Result.ok(user);
}

// In application service:
const result = User.create({ email, name, password });
if (result.isFailure) throw result.error;  // DomainException propagates to filter
const user = result.getValue();
```

---

## 6. Cross-Module Communication (Port & Adapter)

```typescript
// Consumer module defines Port interface in domain/ports/
// src/modules/payment/domain/ports/external-user.port.ts
export interface IExternalUserPort {
  findById(id: string): Promise<Result<ExternalUserData>>;
  exists(id: string): Promise<boolean>;
}

// Consumer module has two adapters in infrastructure/external/
// local-adapter.ts — wraps UserRepository (monolith)
// http-adapter.ts  — calls User Service API (microservice)

// Consumer module wires in payment.module.ts:
{
  provide: EXTERNAL_USER_PORT,
  useClass: UserRepositoryLocalAdapter,   // ← swap to HttpAdapter for microservice
}

// RULE: Consumer service injects by token, never by concrete class
constructor(@Inject(EXTERNAL_USER_PORT) private readonly userPort: IExternalUserPort) {}
```

**Switching to microservice = change 1 line in module.ts. Zero logic changes.**

---

## 7. Response Format

All HTTP responses follow this format (enforced by ResponseInterceptor):

```json
// Success
{ "data": { ... }, "message": "Success" }

// Error (from DomainExceptionFilter)
{
  "code": "ENTITY_NOT_FOUND",
  "message": "User with identifier '123' was not found",
  "details": null,
  "path": "/users/123",
  "timestamp": "2026-02-19T10:00:00.000Z"
}
```

---

## 8. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case + role suffix | `user.service.impl.ts`, `create-user.dto.ts` |
| Classes | PascalCase + suffix | `UserServiceImpl`, `CreateUserDto` |
| Abstract classes (repos, services) | PascalCase | `UserRepository`, `UserService` |
| Interfaces (ports) | `I` prefix + PascalCase | `IExternalUserPort` |
| Enums | PascalCase | `PaymentStatus` |
| Enum values | UPPER_SNAKE_CASE | `PaymentStatus.COMPLETED` |
| Constants | UPPER_SNAKE_CASE | `EXTERNAL_USER_PORT` |
| Domain events | PascalCase + `Event` | `UserCreatedEvent` |
| HTTP handler files | kebab-case + `.handler.ts` | `user.handler.ts` |

---

## 9. Code Quality Gates (run before every commit)

### Architecture
- [ ] `domain/` folder imports NO NestJS, NO Prisma, NO TypeORM
- [ ] Entity uses `create()` + `reconstitute()` — never `new Entity()`
- [ ] No `throw new Error()` or HTTP exceptions in domain/application layers
- [ ] Repository abstract class in domain — Prisma implementation in infrastructure
- [ ] Mapper used in ALL repository implementations
- [ ] Cross-module: IExternalPort interface + adapter — never direct import

### Prisma
- [ ] `prisma generate` run after any schema change
- [ ] Migrations created for schema changes (`prisma migrate dev`)
- [ ] No raw SQL strings unless in `$queryRaw` with template literals
- [ ] Soft delete: use `deletedAt` field, filter in all queries

### NestJS / TypeScript
- [ ] No `console.log` — use `Logger` from `@nestjs/common`
- [ ] All external HTTP calls have `timeout` set
- [ ] No floating promises (missing `await`)
- [ ] No `any` type — use `unknown` or proper type
- [ ] Public methods have explicit return types

### Security
- [ ] No secrets hardcoded — use `ConfigService`
- [ ] No passwords/tokens/PII in logs
- [ ] Auth guard on protected routes
- [ ] Input validation via class-validator on all DTOs
- [ ] `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` active globally

### Testing
- [ ] Unit tests for entity `create()` — success + validation failure cases
- [ ] Unit tests for application service — success + exception cases
- [ ] Mocks used for all dependencies (Repository, Domain Service)

---

## 10. Module Catalog

> Update when adding new modules

| Module | Path | Responsibility | Exports |
|--------|------|---------------|---------|
| user | `src/modules/user/` | User profile, password hashing | `UserService`, `UserRepository` |
| payment | `src/modules/payment/` | Payment processing, status | `PaymentService` |
| _[add here]_ | | | |

---

## 11. References

- Architecture deep-dive: `.ai/context/ARCHITECTURE.md`
- All ADRs: `.ai/context/ADR.md`
- Approved code patterns: `.ai/context/PATTERNS.md`
- Module catalog + cross-module deps: `.ai/context/MODULES.md`
- Workflow commands: `.agent/workflows/`
- Prompt templates: `.ai/prompts/`

---

*⚠️ Every ADR approval MUST update this file in the same PR.*
*Last updated: [date] | Maintainer: [Team Lead]*

# System Architecture

> **AI instruction:** Read this before any task involving module creation, cross-module deps, or infrastructure choices.
> Update this file when major architectural decisions change.

---

## System Overview

**Framework:** NestJS 10.x
**Language:** TypeScript 5.x (strict mode enforced)
**ORM:** Prisma 5.x (PostgreSQL)
**Architecture:** Domain-Driven Design — 4 layers per module
**Cross-module:** Port (interface) + Adapter pattern
**Error model:** DomainException hierarchy + Result<T> pattern
**Auth:** JWT (access token + refresh token)
**API docs:** Swagger/OpenAPI at `/api/docs`

---

## High-Level Component Map

```
HTTP Request
    ↓
[GIN-equivalent: NestJS Router]
Middleware: helmet → CORS → ThrottlerGuard → JwtAuthGuard
    ↓
[Controller Layer]  user.handler.ts, payment.handler.ts, ...
    ↓  injects (abstract class)
[Application Layer] user.service.impl.ts, payment.service.impl.ts, ...
    ↓  injects (abstract class)
[Domain Layer]      user.entity.ts, user.domain.service.impl.ts, ...
    ↑  implements (abstract class)
[Infrastructure]    prisma-user.repository.ts, user.mapper.ts, ...
    ↓
[PostgreSQL via Prisma]
    ↓
[ResponseInterceptor: wrap { data, message }]
[DomainExceptionFilter: DomainException → HTTP status]
[AllExceptionsFilter: catch-all safety net]
    ↓
HTTP Response
```

---

## Shared Kernel (`src/shared/`)

Used by all modules. Do not modify without team discussion.

| File | Purpose |
|------|---------|
| `shared/domain/base.entity.ts` | `Entity<T>`, `AggregateRoot<T>`, `DomainEvent` base classes |
| `shared/domain/value-object.ts` | `ValueObject<T>` base class |
| `shared/domain/result.ts` | `Result<T>` — success/failure without exception |
| `shared/domain/exceptions/domain.exception.ts` | Exception hierarchy: `EntityNotFoundException`, `ConflictException`, `ValidationException`, `BusinessRuleViolationException`, `BusinessException` |
| `shared/presentation/filters/domain-exception.filter.ts` | Maps DomainException → HTTP status code |
| `shared/presentation/filters/all-exceptions.filter.ts` | Catch-all safety net — logs + 500 |
| `shared/presentation/interceptors/response.interceptor.ts` | Wraps all success responses: `{ data, message }` |

---

## Core (`src/core/`)

| File | Purpose |
|------|---------|
| `core/prisma.service.ts` | Prisma lifecycle (`onModuleInit`, `onModuleDestroy`) |
| `core/config/env.validation.ts` | Fail-fast env validation on startup |

---

## Existing Modules

### `user` — User Management

**Purpose:** User profiles, authentication support, password management.

**Domain entities:** `User` (id, email, name, password, createdAt, updatedAt, deletedAt)

**Exports (for other modules):**
- `UserService` — application service interface
- `UserRepository` — domain repository abstract class

**Cross-module pattern:** Other modules that need user data define `IExternalUserPort` in their own `domain/ports/` and use `UserLocalAdapter` or `UserHttpAdapter` in their `infrastructure/external/`.

**API endpoints:**
```
POST /users          — create user
GET  /users          — list users (paginated)
GET  /users/:id      — get user by ID
PUT  /users/:id      — update user
DELETE /users/:id    — soft delete
```

---

### `payment` — Payment Processing

**Purpose:** Manage payments between users and track payment status.

**Domain entities:** `Payment` (id, userId, amount, currency, status, description, createdAt, updatedAt, deletedAt)

**Domain enums (source of truth in Domain layer):** `PaymentStatus { PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED }`

**Cross-module dependency:**
- Needs user data → uses `IExternalUserPort` (Port defined in `payment/domain/ports/`)
- Wired to `UserLocalAdapter` in monolith, `UserHttpAdapter` for microservice

**API endpoints:**
```
POST /payments             — create payment
GET  /payments             — list payments (paginated)
GET  /payments/:id         — get payment by ID
PATCH /payments/:id/status — update payment status
```

---

## Infrastructure Decisions

| Concern | Choice | Why |
|---------|--------|-----|
| ORM | Prisma | Type-safe, great DX, auto-generated client |
| Database | PostgreSQL | Reliable, full-featured RDBMS |
| Auth | JWT (access 15min + refresh 7d) | Stateless, standard |
| Config | `@nestjs/config` + class-validator | Fail-fast validation |
| Logging | NestJS built-in `Logger` | Consistent, structured |
| API docs | Swagger/OpenAPI | Auto-generated from decorators |
| Rate limit | `@nestjs/throttler` (100 req/60s) | DDoS protection |
| Security | `helmet` + CORS from env | Standard HTTP security |

---

## Deployment

```
[Client] → [Load Balancer] → [NestJS App (Docker)] → [PostgreSQL]
                                         ↓
                                      [Redis] (if session/cache needed)
```

- Single binary: one NestJS app, all modules
- Horizontal scaling: stateless JWT — any replica serves any request
- Database migrations: run `prisma migrate deploy` before deployment
- Health checks: `GET /health/live` (liveness) + `GET /health/ready` (readiness — checks DB)

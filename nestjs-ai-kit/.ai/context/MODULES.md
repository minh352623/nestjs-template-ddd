# Module Catalog

> **AI instruction:** Check this file to understand which module owns what,
> and how cross-module communication is set up.
> Update when adding new modules or changing cross-module dependencies.

---

## Module Registry

| Module | Path | Status | Key Entities | Exports |
|--------|------|--------|-------------|---------|
| user | `src/modules/user/` | Production | User | `UserService`, `UserRepository` |
| payment | `src/modules/payment/` | Production | Payment | `PaymentService` |
| _[add here]_ | | | | |

---

## Module Details

### `user` — User Management

**Purpose:** User profile creation, management, and authentication support.

**Key entities:**
- `User` (id, email, name, password[hashed], createdAt, updatedAt, deletedAt)

**Domain services:**
- `UserDomainService` — email uniqueness validation, password hashing (bcrypt)

**Application service interface:** `UserService`
```typescript
create(dto: CreateUserInputDto): Promise<UserOutputDto>
findById(id: string): Promise<UserOutputDto>
findAll(page: number, limit: number): Promise<PaginatedOutputDto<UserOutputDto>>
update(id: string, dto: UpdateUserInputDto): Promise<UserOutputDto>
delete(id: string): Promise<void>
```

**HTTP endpoints:**
```
POST   /users       — create user (201)
GET    /users       — list users paginated (200)
GET    /users/:id   — get user by id (200 / 404)
PUT    /users/:id   — update user (200 / 404)
DELETE /users/:id   — soft delete (204 / 404)
```

**Exports to other modules:**
Any module needing user data defines `IExternalUserPort` in its own `domain/ports/` and uses:
- `UserLocalAdapter` (in consumer's `infrastructure/external/`) wraps `UserRepository`
- `UserHttpAdapter` (in consumer's `infrastructure/external/`) calls User Service HTTP API

---

### `payment` — Payment Processing

**Purpose:** Create and manage payment records. Track payment lifecycle.

**Key entities:**
- `Payment` (id, userId, amount, currency, status, description, createdAt, updatedAt, deletedAt)

**Domain enums (SOURCE OF TRUTH in domain layer):**
- `PaymentStatus { PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED }`

**Application service interface:** `PaymentService`
```typescript
createPayment(dto: CreatePaymentInputDto): Promise<PaymentOutputDto>
findById(id: string): Promise<PaymentOutputDto>
findAll(page: number, limit: number): Promise<PaginatedOutputDto<PaymentOutputDto>>
updateStatus(id: string, status: PaymentStatus): Promise<PaymentOutputDto>
```

**Cross-module dependency:**
- Needs user data → `IExternalUserPort` defined in `payment/domain/ports/`
- Wired to `UserLocalAdapter` in monolith (imports `UserModule`)
- Change to `UserHttpAdapter` when extracting to microservice

**HTTP endpoints:**
```
POST  /payments             — create payment (201)
GET   /payments             — list payments paginated (200)
GET   /payments/:id         — get payment by id (200 / 404)
PATCH /payments/:id/status  — update status (200 / 404 / 422)
```

---

## Cross-Module Dependency Graph

```
user ─────────────────────── (provider: exports UserService, UserRepository)
  ↑ IExternalUserPort (Port interface + LocalAdapter)
payment ─────────────────── (consumer: needs user email/name for payment records)

[new module] → [which modules it depends on]
```

---

## Adding a New Module

When creating a new module, add its entry here:

```markdown
### `[name]` — [Short description]

**Purpose:** [What problem does this solve?]

**Key entities:**
- `[Entity]` ([list key fields])

**Domain enums (if any):**
- `[Enum]` { [values] }

**Application service interface:** `[Name]Service`
(list public methods)

**Cross-module dependencies:**
- Needs [data] from `[module]` → `IExternal[Module]Port` in `[name]/domain/ports/`

**HTTP endpoints:**
(list all API endpoints)
```

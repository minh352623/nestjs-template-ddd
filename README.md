<div align="center">

# 🧩 NestJS DDD Template — Domain-Driven Design

Template NestJS chuẩn DDD, dễ scale và maintain cho dự án Backend.

</div>

---

## 🚀 Mục tiêu
- Cung cấp cấu trúc DDD chuẩn, dễ hiểu cho team mọi quy mô
- Tách biệt rõ ràng các layers: Domain, Application, Infrastructure, Controller
- Dễ test, mở rộng và bảo trì lâu dài

---

## 🏗️ 1. Kiến trúc tổng quan (Architecture Overview)

### Layers trong DDD

| Layer | Trách nhiệm | Dependencies |
|-------|-------------|--------------|
| **Domain** | Business logic, entities, repository interfaces | Không phụ thuộc gì |
| **Application** | Use cases, orchestration, DTOs | Chỉ phụ thuộc Domain |
| **Infrastructure** | Database, external services | Phụ thuộc Domain |
| **Controller** | HTTP handlers, request/response | Phụ thuộc Application |

### Flow xử lý request

```
HTTP Request
    ↓
[Controller] user.handler.ts    → Validate input, parse DTOs
    ↓
[Application] user.service.ts   → Orchestrate use case
    ↓
[Domain] user.domain.service.ts → Business logic
         user.entity.ts         → Domain invariants
    ↓
[Infrastructure] repository.ts  → Persistence via Prisma
    ↓
HTTP Response
```

---

## 🌳 2. Cấu trúc thư mục (Folder Structure)

```text
src/
├── core/                              # Shared infrastructure
│   └── prisma.service.ts              # Prisma client service
│
├── shared/                            # Shared kernel
│   ├── domain/
│   │   ├── base.entity.ts             # Base Entity, AggregateRoot
│   │   ├── value-object.ts            # Base Value Object
│   │   ├── result.ts                  # Result pattern (Either monad)
│   │   └── exceptions/
│   │       └── domain.exception.ts    # Domain exceptions
│   ├── application/
│   │   ├── use-case.ts                # UseCase interface
│   │   └── mapper.ts                  # Mapper interface
│   └── presentation/
│       └── filters/                   # Global exception filters
│
├── modules/
│   └── user/                          # Feature module
│       │
│       ├── domain/                    # 🔴 DOMAIN LAYER
│       │   ├── model/
│       │   │   └── entity/
│       │   │       └── user.entity.ts # User Aggregate Root
│       │   ├── repository/
│       │   │   └── user.repository.ts # Repository Interface (Port)
│       │   └── service/
│       │       ├── user.domain.service.ts      # Domain Service Interface
│       │       └── user.domain.service.impl.ts # Domain Service Implementation
│       │
│       ├── application/               # 🟡 APPLICATION LAYER
│       │   └── service/
│       │       ├── dto/
│       │       │   └── user.dto.ts    # Application DTOs (Input/Output)
│       │       ├── user.service.ts    # Application Service Interface
│       │       └── user.service.impl.ts
│       │
│       ├── infrastructure/            # 🟢 INFRASTRUCTURE LAYER
│       │   └── persistence/
│       │       ├── model/
│       │       │   └── user.model.ts  # Persistence Model
│       │       ├── mapper/
│       │       │   └── user.mapper.ts # Entity <-> Model Mapper
│       │       └── repository/
│       │           └── user.repository.ts # Repository Implementation
│       │
│       ├── controller/                # 🔵 CONTROLLER LAYER
│       │   ├── dto/
│       │   │   └── user.dto.ts        # HTTP Request/Response DTOs
│       │   └── http/
│       │       └── user.handler.ts    # HTTP Handler
│       │
│       └── user.module.ts             # Module DI configuration
│
├── app.module.ts
└── main.ts
```

---

## 🔎 3. Chi tiết từng Layer

### 🔴 Domain Layer

**Mục đích**: Chứa business logic thuần, không phụ thuộc framework.

| File | Mô tả |
|------|-------|
| `model/entity/user.entity.ts` | Aggregate Root với invariants và behaviors |
| `repository/user.repository.ts` | Abstract class định nghĩa contract |
| `service/user.domain.service.ts` | Domain service cho logic cross-entity |

```typescript
// user.entity.ts - Factory Method Pattern
export class User extends AggregateRoot<string> {
  public static create(props: {...}): Result<User> {
    // Validate trước khi tạo
    if (!props.email) return Result.fail(new Error('Invalid email'));
    return Result.ok(new User(id, props));
  }
  
  public static reconstitute(props: {...}): User {
    // Khôi phục từ DB, không validate
    return new User(props.id, props);
  }
}
```

### 🟡 Application Layer

**Mục đích**: Orchestrate use cases, gọi domain services và repositories.

| File | Mô tả |
|------|-------|
| `service/user.service.ts` | Interface định nghĩa use cases |
| `service/user.service.impl.ts` | Implementation orchestrate logic |
| `service/dto/user.dto.ts` | Input/Output DTOs |

```typescript
// user.service.impl.ts
async createUser(input: CreateUserInput): Promise<Result<UserOutput>> {
  // 1. Validate với domain service
  const validation = await this.domainService.validateUserCreation(input.email);
  
  // 2. Tạo entity
  const userResult = User.create({...});
  
  // 3. Hash password
  const hashed = await this.domainService.hashPassword(input.password);
  
  // 4. Persist
  await this.userRepository.save(user);
  
  return Result.ok(this.toOutput(user));
}
```

### 🟢 Infrastructure Layer

**Mục đích**: Implement các interfaces từ Domain, xử lý persistence.

| File | Mô tả |
|------|-------|
| `persistence/model/user.model.ts` | Prisma/DB model type |
| `persistence/mapper/user.mapper.ts` | Convert Entity <-> Model |
| `persistence/repository/user.repository.ts` | Prisma implementation |

```typescript
// user.mapper.ts
export class UserMapper {
  static toDomain(model: PrismaUserModel): User {
    return User.reconstitute({...});
  }
  
  static toPersistence(entity: User): PrismaUserModel {
    return { id: entity.id, email: entity.email, ... };
  }
}
```

### 🔵 Controller Layer

**Mục đích**: Handle HTTP requests, validate input, gọi application service.

| File | Mô tả |
|------|-------|
| `dto/user.dto.ts` | Request/Response DTOs với class-validator |
| `http/user.handler.ts` | HTTP endpoints |

```typescript
// user.handler.ts
@Post()
async create(@Body() request: CreateUserRequest): Promise<UserResponse> {
  const result = await this.userService.createUser({
    email: request.email,
    name: request.name,
    password: request.password,
  });
  
  if (result.isFailure) throw result.error;
  return result.value;
}
```

---

## 🛠️ 4. Quy trình thêm Module mới

### Step 1: Database Schema

```prisma
// prisma/schema.prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  price     Decimal
  createdAt DateTime @default(now())
}
```

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Step 2: Domain Layer

```text
src/modules/product/domain/
├── model/entity/product.entity.ts
├── repository/product.repository.ts
└── service/product.domain.service.ts
```

### Step 3: Application Layer

```text
src/modules/product/application/service/
├── dto/product.dto.ts
├── product.service.ts
└── product.service.impl.ts
```

### Step 4: Infrastructure Layer

```text
src/modules/product/infrastructure/persistence/
├── model/product.model.ts
├── mapper/product.mapper.ts
└── repository/product.repository.ts
```

### Step 5: Controller Layer

```text
src/modules/product/controller/
├── dto/product.dto.ts
└── http/product.handler.ts
```

### Step 6: Module Wiring

```typescript
// product.module.ts
@Module({
  controllers: [ProductHandler],
  providers: [
    PrismaService,
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: ProductDomainService, useClass: ProductDomainServiceImpl },
    { provide: ProductService, useClass: ProductServiceImpl },
  ],
})
export class ProductModule {}
```

### Step 7: Register Module

```typescript
// app.module.ts
@Module({
  imports: [UserModule, ProductModule],
})
export class AppModule {}
```

---

## ⚙️ 5. Chạy dự án

### Yêu cầu
- Node.js 18+
- Docker Desktop

### Commands

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Tạo file .env
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdb?schema=public"' > .env

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Start dev server
npm run start:dev
```

### Test APIs

```bash
# Create User
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"John Doe","password":"Password123"}'

# List Users
curl http://localhost:3000/users

# Get User
curl http://localhost:3000/users/{id}

# Update User
curl -X PATCH http://localhost:3000/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete User
curl -X DELETE http://localhost:3000/users/{id}
```

### Swagger Documentation

Truy cập: **http://localhost:3000/api/docs**

---

## 🧪 6. Testing Strategy

| Test Type | Target | Mock |
|-----------|--------|------|
| Unit Test | Domain Entity | Không cần |
| Unit Test | Domain Service | Repository |
| Unit Test | Application Service | Domain Service, Repository |
| Integration Test | Repository | Real DB |
| E2E Test | Controller | Real system |

---

## ✅ 7. Checklist tuân thủ DDD

- [ ] Domain không import NestJS/Prisma
- [ ] Entity sử dụng Factory Method (`create`, `reconstitute`)
- [ ] Application Service chỉ gọi Domain interfaces
- [ ] Repository trả về Domain Entity, không trả Prisma Model
- [ ] Controller mỏng, không chứa business logic
- [ ] Mapper tách biệt Entity và Persistence Model
- [ ] Result Pattern thay vì throw exception trong domain

---

## 📦 8. File Reference

### User Module (Provider)

| Layer | File | Mô tả |
|-------|------|-------|
| Domain | `domain/model/entity/user.entity.ts` | User Aggregate Root |
| Domain | `domain/repository/user.repository.ts` | Repository Interface |
| Domain | `domain/service/user.domain.service.ts` | Domain Service |
| Application | `application/service/user.service.ts` | Application Service Interface |
| Application | `application/service/dto/user.dto.ts` | Application DTOs |
| Infrastructure | `infrastructure/persistence/repository/user.repository.ts` | Prisma Repository |
| Infrastructure | `infrastructure/persistence/mapper/user.mapper.ts` | Entity Mapper |
| Controller | `controller/http/user.handler.ts` | HTTP Handler |
| Controller | `controller/dto/user.dto.ts` | Request/Response DTOs |

### Payment Module (Consumer - ví dụ Interface + Adapter Pattern)

| Layer | File | Mô tả |
|-------|------|-------|
| Domain | `domain/model/entity/payment.entity.ts` | Payment Aggregate Root |
| Domain | `domain/repository/payment.repository.ts` | Repository Interface |
| Domain | `domain/service/payment.domain.service.ts` | Domain Service |
| Application | `application/service/payment.service.ts` | Application Service Interface |
| Application | `application/service/dto/payment.dto.ts` | Application DTOs |
| Infrastructure | `infrastructure/persistence/repository/payment.repository.ts` | Payment Repository |
| **Domain** | **`domain/ports/external-user.port.ts`** | **Interface (Port) để lấy User data** |
| **Infrastructure** | **`infrastructure/external/user-repository.local-adapter.ts`** | **LocalAdapter - Monolith** |
| **Infrastructure** | **`infrastructure/external/user-repository.http-adapter.ts`** | **HTTPAdapter - Microservice** |
| Controller | `controller/http/payment.handler.ts` | HTTP Handler |
| Controller | `controller/dto/payment.dto.ts` | Request/Response DTOs |

---

## 🔄 9. Cross-Module Communication (Interface + Adapter Pattern)

### Tại sao cần Pattern này?

Khi một module (A) cần dữ liệu từ module khác (B), thay vì inject trực tiếp service, ta sử dụng **Interface + Adapter Pattern** để:

- ✅ **Loose Coupling**: Module A không phụ thuộc vào implementation của Module B
- ✅ **Microservice Ready**: Dễ dàng chuyển từ Monolith sang Microservice
- ✅ **Testable**: Dễ mock interface trong test
- ✅ **Anti-Corruption Layer**: Kiểm soát data được expose ra ngoài

### Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MONOLITH (Hiện tại)                                │
│                                                                              │
│  ┌─────────────┐    interface    ┌──────────────┐   import   ┌────────────┐ │
│  │PaymentService◄───────────────►│LocalAdapter  │◄──────────►│   User     │ │
│  │             │                 │(direct call) │            │ Repository │ │
│  └─────────────┘                 └──────────────┘            └────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Tách Microservices
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MICROSERVICES (Sau khi tách)                         │
│                                                                              │
│  ┌──────────────────────────┐         ┌──────────────────────────┐          │
│  │    PAYMENT SERVICE       │         │      USER SERVICE        │          │
│  │                          │         │                          │          │
│  │ ┌─────────────┐          │  HTTP/  │          ┌────────────┐  │          │
│  │ │PaymentService◄────┐    │  gRPC   │   ┌─────►│   User     │  │          │
│  │ └─────────────┘     │    │◄───────►│   │      │ Repository │  │          │
│  │                     │    │         │   │      └────────────┘  │          │
│  │         interface   │    │         │   │                      │          │
│  │              ▼      │    │         │   │                      │          │
│  │ ┌──────────────────┐│    │         │   │                      │          │
│  │ │ HTTPAdapter      ││    │         │   │                      │          │
│  │ │ (API calls)      │├────┼─────────┼───┘                      │          │
│  │ └──────────────────┘│    │         │                          │          │
│  └─────────────────────┴────┘         └──────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cấu trúc thư mục

```text
modules/
├── user/                              # Module Provider (B)
│   ├── domain/
│   │   └── repository/
│   │       └── user.repository.ts     # Repository được export
│   └── user.module.ts                 # Export UserRepository
│
└── payment/                           # Module Consumer (A)
    ├── domain/
    │   └── ports/                     # ✅ Port (Interface) đặt trong Domain Layer
    │       └── external-user.port.ts
    ├── infrastructure/
    │   └── external/                  # ✨ Adapters Implement Interface từ Domain
    │       ├── index.ts
    │       ├── user-repository.local-adapter.ts  # Monolith
    │       └── user-repository.http-adapter.ts   # Microservice
    └── payment.module.ts
```

### Cách implement

👉 **[Xem chi tiết hướng dẫn tại đây](docs/patterns/interface-adapter.md)**

#### 1. Định nghĩa Interface (Port) trong module Consumer

```typescript
// payment/domain/ports/external-user.port.ts
export interface ExternalUserData { ... }

export const EXTERNAL_USER_PORT = Symbol('EXTERNAL_USER_PORT');

export interface IExternalUserPort {
  findById(id: string): Promise<Result<ExternalUserData>>;
}
```

#### 2. Implement LocalAdapter (Infrastructure Layer)

```typescript
// payment/infrastructure/external/user-repository.local-adapter.ts
@Injectable()
export class UserRepositoryLocalAdapter implements IExternalUserPort { // Implement interface from Domain
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}
  // ...
}
```

#### 3. Module Consumer sử dụng Adapter

```typescript
// payment.module.ts
import { EXTERNAL_USER_PORT } from './domain/ports';
import { UserRepositoryLocalAdapter } from './infrastructure/external';

@Module({
  imports: [UserModule], 
  providers: [
    {
      provide: EXTERNAL_USER_PORT,
      useClass: UserRepositoryLocalAdapter, // Bind Interface -> Implementation
    },
  ],
})
export class PaymentModule {}
```

#### 5. Business Service inject Interface

```typescript
// payment.service.impl.ts
@Injectable()
export class PaymentServiceImpl {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepositoryPort: IUserRepositoryPort, // Interface only!
  ) {}

  async createPayment(input: CreatePaymentInput) {
    // Không biết đang dùng LocalAdapter hay HTTPAdapter
    const userResult = await this.userRepositoryPort.findById(input.userId);
  }
}
```

### Chuyển sang Microservice

Khi tách UserModule thành microservice riêng:

```typescript
// payment.module.ts - CHỈ SỬA 1 DÒNG
@Module({
  // imports: [UserModule],  // Bỏ import
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryHttpAdapter, // ✨ Đổi từ LocalAdapter
    },
  ],
})
export class PaymentModule {}
```

**PaymentServiceImpl KHÔNG cần thay đổi code!**



---

## 🚀 10. Microservice Migration Guide

### Phase 1: Monolith (Hiện tại)

```
┌─────────────────────────────────────────┐
│              Monolith App               │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ UserModule  │◄───│ PaymentModule   │ │
│  │             │    │ (LocalAdapter)  │ │
│  └─────────────┘    └─────────────────┘ │
│         │                    │          │
│         └─────────┬──────────┘          │
│                   ▼                     │
│              PostgreSQL                 │
└─────────────────────────────────────────┘
```

### Phase 2: Modular Monolith

```
┌─────────────────────────────────────────┐
│              Monolith App               │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ UserModule  │◄───│ PaymentModule   │ │
│  │ (separate   │    │ (LocalAdapter)  │ │
│  │  database)  │    │ (own database)  │ │
│  └──────┬──────┘    └────────┬────────┘ │
│         │                    │          │
│         ▼                    ▼          │
│    User DB              Payment DB      │
└─────────────────────────────────────────┘
```

### Phase 3: Microservices

```
┌──────────────────┐     ┌──────────────────┐
│  User Service    │     │ Payment Service  │
│  ┌────────────┐  │ HTTP│ ┌──────────────┐ │
│  │ UserModule │◄─┼─────┼─│ HttpAdapter  │ │
│  └─────┬──────┘  │     │ └──────────────┘ │
│        │         │     │        │         │
│        ▼         │     │        ▼         │
│    User DB       │     │   Payment DB     │
└──────────────────┘     └──────────────────┘
```

### Checklist khi tách Microservice

- [ ] Tạo repository mới cho service
- [ ] Copy module vào repo mới
- [ ] Đổi LocalAdapter → HttpAdapter ở các module consumer
- [ ] Cấu hình service URL trong environment
- [ ] Implement Circuit Breaker (optional nhưng khuyến nghị)
- [ ] Setup API Gateway (nếu cần)

---

## 🙌 Kết luận

Template này áp dụng **DDD (Domain-Driven Design)** với cấu trúc rõ ràng:

- **Domain** ở trung tâm, độc lập với framework
- **Application** orchestrate use cases
- **Infrastructure** cách ly từ domain
- **Controller** mỏng, chỉ handle HTTP
- **Interface + Adapter** cho cross-module communication

Phù hợp cho:
- ✅ Team mọi quy mô
- ✅ CRUD-heavy applications
- ✅ Microservices-ready từ đầu
- ✅ Long-term maintenance
- ✅ Dễ scale khi cần


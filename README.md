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

## 📦 8. File Reference (User Module)

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

---

## 🙌 Kết luận

Template này áp dụng **DDD (Domain-Driven Design)** với cấu trúc rõ ràng:

- **Domain** ở trung tâm, độc lập với framework
- **Application** orchestrate use cases
- **Infrastructure** cách ly từ domain
- **Controller** mỏng, chỉ handle HTTP

Phù hợp cho:
- ✅ Team mọi quy mô
- ✅ CRUD-heavy applications
- ✅ Microservices
- ✅ Long-term maintenance


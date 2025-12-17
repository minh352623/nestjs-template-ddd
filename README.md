<div align="center">

# 🧩 NestJS + Prisma + PostgreSQL — Clean Architecture & SOLID

Onboarding nhanh, chắc và sạch cho dự án Backend tuân thủ Clean Architecture & SOLID.

</div>

---

## 🚀 Mục tiêu
- Tài liệu giúp member mới hiểu kiến trúc, tư duy và quy trình phát triển.
- Hướng dẫn chạy môi trường (Docker + PostgreSQL), migrate Prisma và phát triển tính năng theo chuẩn.

---

## 🏗️ 1. Giới thiệu Kiến trúc (Architecture Overview)

Clean Architecture chia hệ thống thành các vòng (layers) với nguyên tắc phụ thuộc từ ngoài vào trong (outer → inner):

- **Domain (Enterprise Rules)**: Class thuần mô tả nghiệp vụ cốt lõi (Entity, Value Object, Repository Interface). Không phụ thuộc framework/ORM.
- **Application (Use Cases)**: Quy trình nghiệp vụ (service/use-case) dùng các cổng (interfaces) từ Domain. Không import Prisma/Nest.
- **Infrastructure**: Hiện thực các cổng với kỹ thuật cụ thể (Prisma, DB, HTTP, Cache...). Chỉ layer này mới biết Prisma.
- **Presentation (Interface Adapters)**: Controller/Resolver nhận request, validate DTO, gọi Use Case. Controller phải mỏng (thin), không chứa logic nghiệp vụ.

Nguyên tắc chính:
- **Dependency Inversion**: Use Case phụ thuộc vào `Repository Interface` (abstract class), không phụ thuộc lớp Prisma cụ thể.
- **SOLID**:
  - S: Mỗi lớp một trách nhiệm rõ ràng (Entity: dữ liệu + invariants, Use Case: nghiệp vụ).
  - O: Dễ mở rộng (thêm repo khác như Mongo) mà không đổi Use Case.
  - L: Substitution hợp lệ vì hạ tầng tuân theo hợp đồng interface.
  - I: Interface gọn (create/findByEmail) tránh phình to không cần thiết.
  - D: Phụ thuộc vào abstraction (Repository) thay vì concretions (Prisma).

### 🌳 Sơ đồ cây thư mục (ví dụ module `user`)

```text
src/
├── core/                       # Shared kernel (services/tokens dùng chung)
│   └── prisma.service.ts
├── modules/
│   └── user/
│       ├── domain/             # Layer 1: Domain
│       │   ├── user.entity.ts
│       │   └── user.repository.ts          # Abstract Class (Port)
│       ├── application/        # Layer 2: Application
│       │   ├── create-user.dto.ts          # DTO với class-validator
│       │   └── create-user.use-case.ts     # Business logic
│       ├── infrastructure/     # Layer 3: Infrastructure
│       │   └── persistence/
│       │       ├── prisma-user.repository.ts
│       │       └── user.mapper.ts          # Prisma Model ↔ Domain Entity
│       └── interface-adapters/ # Layer 4: Presentation
│           └── user.controller.ts          # HTTP endpoints
├── app.module.ts
└── main.ts
```

---

## 🔎 2. Phân tích chi tiết từng File (Deep Dive)

- **Domain Entity (`.entity.ts`)**
  - Là class thuần TypeScript mô tả dữ liệu và invariants (quy tắc bất biến) của nghiệp vụ.
  - Không dùng decorator ORM (ví dụ Prisma/Nest) để giữ Domain độc lập, dễ test và tái sử dụng.

- **Repository Interface (`.repository.ts`)**
  - Dùng Abstract Class định nghĩa hợp đồng truy cập dữ liệu (ví dụ `create`, `findByEmail`).
  - Giữ **Dependency Inversion**: Use Case chỉ biết interface, hạ tầng sẽ binding một implementation (Prisma, InMemory...).

- **Use Case (`.use-case.ts`)**
  - Chứa logic nghiệp vụ: kiểm tra trùng email, hash password, tạo `User`...
  - Chỉ gọi **Repository Interface**, không import bất kỳ loại ORM/framework nào.

- **DTO (`.dto.ts`)**
  - Validate dữ liệu đầu vào với `class-validator` tại rìa hệ thống (Presentation).
  - Giữ Application/Domain sạch, tránh decorator rò rỉ vào core.

- **Infrastructure Implementation (`prisma-xxx.repository.ts`)**
  - Nơi duy nhất dùng `PrismaService` để thao tác DB.
  - Chuyển đổi Model từ Prisma về Domain qua **Mapper**.

- **Mapper (`.mapper.ts`)**
  - Bảo vệ Domain khỏi chi tiết hạ tầng bằng chuyển đổi: `PrismaModel → Domain Entity` và ngược lại khi cần.
  - Tránh để kiểu Prisma xuất hiện trong Domain/Application.

- **Controller (`.controller.ts`)**
  - Mỏng (thin): nhận request, validate DTO, gọi Use Case, trả kết quả.
  - Không viết logic nghiệp vụ trong controller để dễ thay thế transport (REST/GraphQL) mà không ảnh hưởng core.

- **Module (`.module.ts`)**
  - Cấu hình **Dependency Injection**: map Interface ↔ Implementation.
  - Ví dụ dùng Abstract Class làm token:

```ts
@Module({
  controllers: [UserController],
  providers: [
    PrismaService,
    { provide: UserRepository, useClass: PrismaUserRepository },
    CreateUserUseCase,
  ],
})
export class UserModule {}
```

---

## 🛠️ 3. Quy trình thêm một Module mới (Developer Workflow)

Ví dụ tạo module `product` theo chuẩn Clean Architecture:

1) **Định nghĩa Database (Schema Prisma)**
- Thêm vào `prisma/schema.prisma`:
```prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  price     Decimal
  createdAt DateTime @default(now())
}
```
- Chạy: `npm run prisma:generate` và `npm run prisma:migrate -- --name add_product`

2) **Định nghĩa Domain (Entity & Repository Interface) — làm trước tiên!**
- `src/modules/product/domain/product.entity.ts`: class thuần + invariants.
- `src/modules/product/domain/product.repository.ts`: abstract class với các hàm cần thiết.

3) **Viết Application Layer (Use Cases & DTO)**
- `src/modules/product/application/create-product.dto.ts`: DTO với validator.
- `src/modules/product/application/create-product.use-case.ts`: Use Case inject `ProductRepository`, không import Prisma.

4) **Infrastructure (Prisma)**
- `src/modules/product/infrastructure/persistence/prisma-product.repository.ts`: extends `ProductRepository`, dùng `PrismaService`.
- `src/modules/product/infrastructure/persistence/product.mapper.ts`: chuyển đổi Prisma Model ↔ Domain.

5) **Presentation (Controller)**
- `src/modules/product/interface-adapters/product.controller.ts`: endpoint REST gọi Use Case.

6) **Module Wiring**
- `src/modules/product/product.module.ts`:
```ts
@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    { provide: ProductRepository, useClass: PrismaProductRepository },
    CreateProductUseCase,
  ],
})
export class ProductModule {}
```

7) **Thêm vào Root App**
- Import `ProductModule` trong `app.module.ts`.

---

## ⚙️ 4. Chạy dự án (Environment & Commands)

Yêu cầu: Node.js 18+, Docker Desktop.

- Khởi động PostgreSQL bằng Docker:
```bash
docker compose up -d
```

- Cấu hình env: `./.env`
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdb?schema=public"
```

- Generate Prisma Client:
```bash
npm run prisma:generate
```

- Apply migrations:
```bash
npm run prisma:migrate
```

- Chạy dev server:
```bash
npm run start:dev
```

- Test endpoint tạo user:
```bash
curl -i -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"supersecret"}'
```

---

## 🧪 5. Nguyên tắc Test & Chất lượng
- Unit Test cho Use Case: mock `Repository Interface`, không cần DB thật.
- Integration Test cho Controller/Repository: dùng Docker DB hoặc test DB riêng.
- Lint & Format: giữ code sạch, tên biến/hàm ý nghĩa.

---

## 🔒 6. Bảo mật & Thực hành tốt
- Hash mật khẩu trong Use Case (ví dụ `bcrypt`) trước khi tạo `User`.
- Không để kiểu Prisma/ORM rò rỉ ra Domain/Application.
- DTO chỉ nằm ở Presentation/Application, validate ở rìa hệ thống.
- Logger, exception filter nên ở Presentation/Infrastructure, không trộn vào Domain/Application.

---

## ✅ 7. Checklist tuân thủ Clean Architecture
- Domain/Application không import Nest/Prisma.
- Use Case gọi qua `Repository Interface` (Abstract Class).
- Controller mỏng, không chứa logic nghiệp vụ.
- Mapper tách bạch hạ tầng với core.
- DI wiring map Interface ↔ Prisma Implementation ở Module.

---

## 📦 8. Tham chiếu file quan trọng (demo User)
- `src/modules/user/domain/user.entity.ts`: Entity thuần + invariants.
- `src/modules/user/domain/user.repository.ts`: Abstract class (Port).
- `src/modules/user/application/create-user.dto.ts`: DTO với validator.
- `src/modules/user/application/create-user.use-case.ts`: Logic nghiệp vụ, inject `UserRepository`.
- `src/modules/user/infrastructure/persistence/prisma-user.repository.ts`: Hiện thực Repository bằng Prisma.
- `src/modules/user/infrastructure/persistence/user.mapper.ts`: Chuyển đổi Prisma Model ↔ Domain.
- `src/modules/user/interface-adapters/user.controller.ts`: Endpoint REST.
- `src/modules/user/user.module.ts`: DI wiring (Abstract → Prisma).
- `src/core/prisma.service.ts`: PrismaClient dùng chung.

---

## 🙌 Kết luận
Dự án này đặt **Domain & Use Case** ở trung tâm, cô lập hạ tầng và giao tiếp I/O ở rìa. Tuân thủ nghiêm ngặt **Clean Architecture** và **SOLID** giúp code dễ test, mở rộng và bảo trì lâu dài.


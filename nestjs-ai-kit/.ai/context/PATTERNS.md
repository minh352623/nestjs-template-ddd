# Approved Code Patterns

> **AI instruction:** Match these patterns EXACTLY when writing code.
> Do not invent alternatives. If you think a new pattern is needed → flag and ask.

---

## Pattern 1: Full Module Scaffold (End-to-End)

The exact order for adding a new module. Never skip phases.

```
prisma schema → entity → repository (abstract) → domain service →
mapper → prisma repository → port/adapter (if needed) →
application service → controller DTOs → handler → module.ts → tests
```

See `.agent/workflows/create.md` for full file templates.

---

## Pattern 2: Cross-Module Communication (Port & Adapter)

When module A (Consumer) needs data from module B (Provider).

```typescript
// ─── Step 1: Consumer defines Port in domain/ports/ ───
// src/modules/payment/domain/ports/external-user.port.ts
export const EXTERNAL_USER_PORT = Symbol('EXTERNAL_USER_PORT');

export interface ExternalUserData {
  id: string;
  email: string;
  name: string;
  // MINIMUM fields needed — not the full User entity
}

export interface IExternalUserPort {
  findById(id: string): Promise<Result<ExternalUserData>>;
  exists(id: string): Promise<boolean>;
}

// ─── Step 2: Consumer's Application Service uses Port by token ───
// src/modules/payment/application/service/payment.service.impl.ts
@Injectable()
export class PaymentServiceImpl extends PaymentService {
  constructor(
    @Inject(EXTERNAL_USER_PORT)
    private readonly userPort: IExternalUserPort,  // interface, not class
  ) { super(); }

  async createPayment(dto: CreatePaymentInputDto): Promise<PaymentOutputDto> {
    const userResult = await this.userPort.findById(dto.userId);
    if (userResult.isFailure) throw userResult.error;
    const user = userResult.getValue();
    // use user.email, user.name
  }
}

// ─── Step 3: Local Adapter (monolith) in infrastructure/external/ ───
// src/modules/payment/infrastructure/external/user.local-adapter.ts
@Injectable()
export class UserLocalAdapter implements IExternalUserPort {
  constructor(private readonly userRepo: UserRepository) {}  // inject provider's repo

  async findById(id: string): Promise<Result<ExternalUserData>> {
    const user = await this.userRepo.findById(id);
    if (!user) return Result.fail(new EntityNotFoundException('User', id));
    return Result.ok({ id: user.id, email: user.email, name: user.name });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.userRepo.findById(id)) !== null;
  }
}

// ─── Step 4: HTTP Adapter (microservice) skeleton ───
// src/modules/payment/infrastructure/external/user.http-adapter.ts
@Injectable()
export class UserHttpAdapter implements IExternalUserPort {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: string): Promise<Result<ExternalUserData>> {
    const baseUrl = this.configService.getOrThrow('USER_SERVICE_URL');
    try {
      const { data } = await this.httpService.axiosRef.get(
        `${baseUrl}/users/${id}`,
        { timeout: 5000 },
      );
      return Result.ok({ id: data.id, email: data.email, name: data.name });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return Result.fail(new EntityNotFoundException('User', id));
      }
      throw err;  // infrastructure error → AllExceptionsFilter
    }
  }
}

// ─── Step 5: Module wiring ───
// src/modules/payment/payment.module.ts
@Module({
  imports: [UserModule],  // needed for LocalAdapter to get UserRepository
  providers: [
    {
      provide: EXTERNAL_USER_PORT,
      useClass: UserLocalAdapter,    // ← swap to UserHttpAdapter for microservice
    },
    // ... other providers
  ],
})
export class PaymentModule {}
```

**Switching monolith → microservice: change `useClass` in module.ts. Zero business logic changes.**

---

## Pattern 3: Mapper (Entity ↔ Prisma)

```typescript
// src/modules/user/infrastructure/persistence/model/user.model.ts
import { Prisma } from '@prisma/client';
export type UserModel = Prisma.UserGetPayload<{}>; // type alias — no Prisma import in mapper

// src/modules/user/infrastructure/persistence/mapper/user.mapper.ts
import { User } from '../../../domain/model/entity/user.entity';
import { UserModel } from '../model/user.model';

export class UserMapper {
  // DB model → Domain Entity (via reconstitute — no validation)
  static toDomain(model: UserModel): User {
    return User.reconstitute({
      id: model.id,
      email: model.email,
      name: model.name,
      password: model.password,  // keep hashed password in entity (for domain service)
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  // Domain Entity → Prisma create input
  static toPersistence(entity: User): UserModel {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      password: entity.password,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: null,
    };
  }
}
```

---

## Pattern 4: Domain Enum as Source of Truth

Enums are defined in Domain layer, then re-exported/referenced from other layers.

```typescript
// ✅ CORRECT: Enum defined in Domain
// src/modules/payment/domain/model/entity/payment.entity.ts
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Application DTO re-exports from domain:
// src/modules/payment/application/service/dto/payment.dto.ts
export { PaymentStatus } from '../../domain/model/entity/payment.entity';

// Prisma schema uses same values (strings match):
// schema.prisma: enum PaymentStatus { PENDING PROCESSING COMPLETED FAILED REFUNDED }

// ❌ WRONG: Enum defined separately in multiple places
// application/dto/payment.dto.ts: enum PaymentStatus { ... }  // duplicate — out of sync risk
```

---

## Pattern 5: Paginated Response

Consistent pagination across all list endpoints.

```typescript
// Application Output DTO:
export interface PaginatedOutputDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Application Service:
async findAll(page: number, limit: number): Promise<PaginatedOutputDto<PaymentOutputDto>> {
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 20;

  const { data, total } = await this.paymentRepo.findAll(page, limit);
  return {
    data: data.map(e => this.toOutputDto(e)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Controller Handler:
@Get()
findAll(@Query() query: ListPaymentQueryDto) {
  return this.paymentService.findAll(query.page ?? 1, query.limit ?? 20);
}
// ResponseInterceptor wraps: { data: { data: [...], total: N, ... }, message: 'Success' }
```

---

## Pattern 6: Application Service Unit Test

```typescript
// src/modules/payment/payment.service.spec.ts
describe('PaymentServiceImpl', () => {
  let service: PaymentService;
  let mockRepo: jest.Mocked<PaymentRepository>;
  let mockDomainSvc: jest.Mocked<PaymentDomainService>;
  let mockUserPort: jest.Mocked<IExternalUserPort>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: PaymentService, useClass: PaymentServiceImpl },
        { provide: PaymentRepository, useValue: { findById: jest.fn(), save: jest.fn(), softDelete: jest.fn() } },
        { provide: PaymentDomainService, useValue: { validateCreate: jest.fn() } },
        { provide: EXTERNAL_USER_PORT, useValue: { findById: jest.fn(), exists: jest.fn() } },
      ],
    }).compile();

    service = module.get(PaymentService);
    mockRepo = module.get(PaymentRepository);
    mockDomainSvc = module.get(PaymentDomainService);
    mockUserPort = module.get(EXTERNAL_USER_PORT);
  });

  describe('createPayment()', () => {
    const validDto = { userId: 'user-123', amount: 100, currency: 'USD', description: 'Test' };

    it('success — returns PaymentOutputDto', async () => {
      mockUserPort.findById.mockResolvedValue(
        Result.ok({ id: 'user-123', email: 'test@x.com', name: 'Test' })
      );
      const entity = Payment.reconstitute({ id: 'pay-1', userId: 'user-123', amount: 100, currency: 'USD', status: PaymentStatus.PENDING, createdAt: new Date(), updatedAt: new Date() });
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.createPayment(validDto);

      expect(result.id).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('user not found — throws EntityNotFoundException', async () => {
      mockUserPort.findById.mockResolvedValue(
        Result.fail(new EntityNotFoundException('User', 'unknown'))
      );

      await expect(service.createPayment(validDto)).rejects.toThrow(EntityNotFoundException);
    });

    it('repository error — propagates', async () => {
      mockUserPort.findById.mockResolvedValue(Result.ok({ id: 'user-123', email: 'x', name: 'x' }));
      mockRepo.save.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.createPayment(validDto)).rejects.toThrow('DB connection lost');
    });
  });
});
```

---

## Pattern 7: Domain Entity Unit Test

```typescript
// src/modules/user/domain/model/entity/user.entity.spec.ts
describe('User Entity', () => {
  describe('create()', () => {
    it('creates user with valid props', () => {
      const result = User.create({ email: 'test@example.com', name: 'John', password: 'hashed' });

      expect(result.isSuccess).toBe(true);
      const user = result.getValue();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('John');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it.each([
      [{ email: '', name: 'John', password: 'h' }, 'email'],
      [{ email: 'not-an-email', name: 'John', password: 'h' }, 'email'],
      [{ email: 'test@x.com', name: '', password: 'h' }, 'name'],
      [{ email: 'test@x.com', name: 'J', password: 'h' }, 'name'],  // too short
    ])('returns failure for invalid input: %o', (props, expectedField) => {
      const result = User.create(props as any);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationException);
    });
  });

  describe('reconstitute()', () => {
    it('creates entity from DB data without validation', () => {
      const props = { id: 'uuid-1', email: 'invalid-email', name: '', password: '', createdAt: new Date(), updatedAt: new Date() };
      const user = User.reconstitute(props);  // skips validation

      expect(user.id).toBe('uuid-1');
      expect(user.email).toBe('invalid-email');  // no validation in reconstitute
    });
  });
});
```

# NestJS Technical Best Practices & Guidelines

Tài liệu này quy định các tiêu chuẩn kỹ thuật bắt buộc (Mandatory) cho toàn bộ đội ngũ phát triển NestJS/TypeScript. Mục tiêu là đảm bảo chất lượng code đồng nhất, an toàn kiểu dữ liệu (Type Safety), hiệu năng cao và dễ dàng bảo trì theo triết lý **Clean Code**.

> **Phiên bản:** v2.0 — Cập nhật 18/02/2026
> **Thay đổi chính so với v1:**
> - **[Fix Bug]** Section 3.2: Sửa ERR constants có thể bị mutate gây race condition → dùng factory function
> - **[Fix Bug]** Section 12.4: Sửa HTTP Adapter nuốt tất cả lỗi kể cả lỗi infrastructure
> - **[Fix Bug]** Section 10.2: `@Exclude()` trực tiếp trên Entity là anti-pattern — hướng dẫn dùng Response DTO
> - **[Cập nhật]** Section 2.4: Email/notification nên dùng EventEmitter2 hoặc Bull Queue thay vì await trong luồng chính
> - **[Cập nhật]** Section 4.2: Bổ sung `Promise.allSettled` cho trường hợp partial failure
> - **[Mới]** Section 13: Database Transaction với UnitOfWork Pattern (DDD-compliant)
> - **[Mới]** Section 14: Request Logging Interceptor với Correlation ID
> - **[Mới]** Section 15: Circular Dependency Prevention
> - **[Mới]** Section 16: Health Check với Terminus
> - **[Mới]** Section 17: TypeScript Strict Mode & ESLint Configuration

## 1. Cấu trúc Dự án & Đặt tên (Project Layout & Naming)

### 1.1. Quy tắc đặt tên File và Folder
File và folder sử dụng **kebab-case**, kèm hậu tố theo vai trò (`.service`, `.controller`, `.module`, `.dto`, `.entity`, `.repository`, `.guard`, `.interceptor`, `.filter`).

```typescript
// ❌ Incorrect
userRepository.ts       // camelCase
AuthService.ts          // PascalCase
create_order_dto.ts     // snake_case

// ✅ Correct
user.repository.ts
auth.service.ts
create-order.dto.ts
order.entity.ts
jwt-auth.guard.ts
```

### 1.2. Đặt tên Class & Interface
*   **Class**: PascalCase, hậu tố phản ánh vai trò.
*   **Interface**: PascalCase, **không** tiền tố `I`.
*   **Enum**: PascalCase, giá trị UPPER_SNAKE_CASE.

```typescript
// ❌ Incorrect
export interface IUserService {}    // Tiền tố 'I'
export class userService {}         // Không PascalCase
export enum status { active }       // Không PascalCase

// ✅ Correct
export interface UserService {}
export class UserServiceImpl {}
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}
```

### 1.3. Cấu trúc Module chuẩn
Mỗi feature module nên tuân theo cấu trúc như sau:

```text
src/modules/order/
├── dto/
│   ├── create-order.dto.ts
│   └── update-order.dto.ts
├── entities/
│   └── order.entity.ts
├── order.controller.ts
├── order.service.ts
├── order.repository.ts
├── order.module.ts
└── order.constants.ts
```

---

## 2. Clean Code & Architecture

### 2.1. Dependency Injection (DI)
Luôn sử dụng **Constructor Injection**. Tuyệt đối không dùng `new` để khởi tạo service/repository bên trong lớp khác.

```typescript
// ❌ Incorrect: Hard dependency, không test được
@Injectable()
export class OrderService {
  private userRepo = new UserRepository(); // Tự khởi tạo
  
  async createOrder(dto: CreateOrderDto) {
    const user = await this.userRepo.findById(dto.userId);
  }
}

// ✅ Correct: Inject qua Constructor
@Injectable()
export class OrderService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const user = await this.userRepo.findById(dto.userId);
  }
}
```

### 2.2. Interface Segregation (Phụ thuộc vào Abstraction)
Khi Service cần phụ thuộc vào thành phần bên ngoài (third-party, external API), hãy **định nghĩa Interface/Abstract class** và inject qua token. Điều này giúp dễ dàng mock trong unit test và thay thế implementation.

```typescript
// ❌ Incorrect: Phụ thuộc trực tiếp vào implementation cụ thể
@Injectable()
export class NotificationService {
  private client = new FirebaseAdmin(); // Không thể mock

  async send(userId: string, message: string) {
    await this.client.messaging().send({ /* ... */ });
  }
}

// ✅ Correct: Định nghĩa abstract class + inject token
// notification.port.ts
export abstract class NotificationPort {
  abstract send(userId: string, message: string): Promise<void>;
}

// firebase-notification.adapter.ts
@Injectable()
export class FirebaseNotificationAdapter extends NotificationPort {
  async send(userId: string, message: string): Promise<void> {
    // Firebase implementation
  }
}

// notification.module.ts
@Module({
  providers: [
    {
      provide: NotificationPort,
      useClass: FirebaseNotificationAdapter,
    },
  ],
  exports: [NotificationPort],
})
export class NotificationModule {}
```

### 2.3. Hạn chế Magic Numbers & Strings
Mọi giá trị cố định phải được khai báo thành **constants** hoặc **enum**.

```typescript
// ❌ Incorrect
if (user.role === 'admin') { /* ... */ }
if (retryCount > 5) { /* ... */ }

// ✅ Correct
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}
const MAX_RETRIES = 5;

if (user.role === UserRole.ADMIN) { /* ... */ }
if (retryCount > MAX_RETRIES) { /* ... */ }
```

### 2.4. Single Responsibility Principle (SRP) cho Service
Mỗi Service chỉ xử lý logic nghiệp vụ của **một domain duy nhất**. Tuyệt đối không nhồi nhét logic của nhiều domain vào một Service.

```typescript
// ❌ Incorrect: OrderService tự xử lý payment, email, inventory
@Injectable()
export class OrderService {
  async createOrder(dto: CreateOrderDto) {
    // ... tạo order
    await this.chargePayment(dto.amount);   // ❌ Logic payment
    await this.sendEmail(dto.userEmail);     // ❌ Logic email
    await this.reduceStock(dto.productId);   // ❌ Logic inventory
  }
}

// ✅ Correct: Chia nhỏ thành các Service riêng, phối hợp qua DI
// ⚠️ Lưu ý về sendOrderConfirmation: KHÔNG nên await trực tiếp trong luồng chính
// vì việc gửi email thường tốn 200-500ms và làm tăng response time.
// Dùng EventEmitter2 (in-process, đơn giản) hoặc Bull Queue (production-grade, có retry).
@Injectable()
export class OrderService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2, // ✅ Inject EventEmitter
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.create(dto);
    await this.paymentService.charge(order.amount);
    await this.inventoryService.reduceStock(order.productId);
    // ✅ Emit event non-blocking — email handler sẽ chạy async
    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order));
    return order;
  }
}

// Listener xử lý trong class riêng biệt — SRP
@Injectable()
export class OrderNotificationListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('order.created', { async: true }) // async: true → không block emitter
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.mailService.sendOrderConfirmation(event.order);
  }
}
```

---

## 3. Xử lý Lỗi (Error Handling)

### 3.1. Fail Fast & Guard Clauses
Tránh nesting quá sâu bằng cách return/throw sớm.

```typescript
// ❌ Incorrect: Nesting 3+ levels
async processOrder(userId: string, orderId: string) {
  const user = await this.userRepo.findById(userId);
  if (user) {
    if (user.isActive) {
      const order = await this.orderRepo.findById(orderId);
      if (order) {
        // ... logic chính
      } else {
        throw new NotFoundException('Order not found');
      }
    } else {
      throw new ForbiddenException('User is inactive');
    }
  } else {
    throw new NotFoundException('User not found');
  }
}

// ✅ Correct: Guard clauses, flat code
async processOrder(userId: string, orderId: string) {
  const user = await this.userRepo.findById(userId);
  if (!user) throw new NotFoundException('User not found');
  if (!user.isActive) throw new ForbiddenException('User is inactive');

  const order = await this.orderRepo.findById(orderId);
  if (!order) throw new NotFoundException('Order not found');

  // Logic chính nằm ở indent thấp nhất
}
```

### 3.2. Custom Business Exception
Định nghĩa lớp `BusinessException` để Service layer trả về mã lỗi tường minh. Service **BẮT BUỘC** không được throw trực tiếp các HTTP Exception (`BadRequestException`, `NotFoundException`...) — đó là trách nhiệm của tầng Transport.

```typescript
// common/exceptions/business.exception.ts
export class BusinessException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'BusinessException';
  }

  // withDetails PHẢI trả về instance MỚI — không mutate gốc
  withDetails(details: Record<string, any>): BusinessException {
    return new BusinessException(this.code, this.message, details);
  }
}

// domain/error-codes.ts — Khai báo tập trung tất cả mã lỗi
// ✅ QUAN TRỌNG: Dùng factory function thay vì object instance tĩnh.
// Instance tĩnh được tạo 1 lần dùng chung toàn app — nếu có method mutate state
// (vd: withDetails()) nhiều request đồng thời có thể gây RACE CONDITION.
export const ERR = {
  USER_NOT_FOUND:       () => new BusinessException('USER_NOT_FOUND', 'User does not exist'),
  EMAIL_ALREADY_EXISTS: () => new BusinessException('EMAIL_ALREADY_EXISTS', 'Email is already registered'),
  BALANCE_NOT_ENOUGH:   () => new BusinessException('BALANCE_NOT_ENOUGH', 'Insufficient balance'),
  ORDER_ALREADY_PAID:   () => new BusinessException('ORDER_ALREADY_PAID', 'This order has been paid'),
} as const;
```
```

```typescript
// ❌ Incorrect: Service throw HTTP exception (coupling với HTTP layer)
@Injectable()
export class UserService {
  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`); // ❌ HTTP concern
    }
    return user;
  }
}

// ✅ Correct: Service throw BusinessException với mã lỗi rõ ràng
@Injectable()
export class UserService {
  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw ERR.USER_NOT_FOUND(); // ✅ Gọi factory function → instance mới mỗi lần
    }
    return user;
  }
}

// Khi cần đính kèm details:
throw ERR.USER_NOT_FOUND().withDetails({ requestedId: id }); // ✅ An toàn, không mutate ERR gốc
```

### 3.3. Global Exception Filter (Error Mapping Layer)
Tạo Filter toàn cục để **tự động map** `BusinessException` sang HTTP Status Code. Controller không cần try/catch thủ công.

```typescript
// common/filters/business-exception.filter.ts
@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  // Map mã lỗi → HTTP Status Code
  private readonly statusMap: Record<string, HttpStatus> = {
    USER_NOT_FOUND:       HttpStatus.NOT_FOUND,
    EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
    BALANCE_NOT_ENOUGH:   HttpStatus.UNPROCESSABLE_ENTITY,
    ORDER_ALREADY_PAID:   HttpStatus.UNPROCESSABLE_ENTITY,
  };

  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = this.statusMap[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      code: exception.code,
      message: exception.message,
      details: exception.details || null,
    });
  }
}

// main.ts — Đăng ký Global Filter
app.useGlobalFilters(new BusinessExceptionFilter());
```

Kết quả: Controller trở nên **cực kỳ sạch**:

```typescript
// ✅ Controller không cần try/catch, filter tự động xử lý
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
    // Nếu service throw BusinessException → Filter tự động trả JSON lỗi chuẩn
  }
}
```

---

## 4. Xử lý Bất đồng bộ (Asynchronous)

### 4.1. Luôn `await` — Tránh Floating Promises
Gọi hàm async mà thiếu `await` sẽ khiến lỗi bị nuốt (swallowed) và logic chạy sai thứ tự.

```typescript
// ❌ Incorrect: Lỗi bị nuốt, không biết update có thành công không
async updateUser(id: string, data: UpdateUserDto) {
  this.userRepo.update(id, data);  // Thiếu await!
  this.logger.log('User updated');  // Log trước khi update xong
}

// ✅ Correct
async updateUser(id: string, data: UpdateUserDto) {
  await this.userRepo.update(id, data);
  this.logger.log('User updated');
}
```

### 4.2. Song song hóa với `Promise.all` / `Promise.allSettled`
Khi nhiều tác vụ **không phụ thuộc lẫn nhau**, chạy song song thay vì tuần tự.

```typescript
// ❌ Incorrect: Chạy tuần tự → chậm (tổng = t1 + t2 + t3)
const user = await this.userService.findById(userId);
const orders = await this.orderService.findByUser(userId);
const notifications = await this.notifService.findByUser(userId);

// ✅ Correct với Promise.all: Chạy song song → nhanh (tổng = max(t1, t2, t3))
// Dùng khi TẤT CẢ phải thành công — nếu 1 reject, toàn bộ throw lỗi
const [user, orders, notifications] = await Promise.all([
  this.userService.findById(userId),
  this.orderService.findByUser(userId),
  this.notifService.findByUser(userId),
]);

// ✅ Correct với Promise.allSettled: Dùng khi chấp nhận PARTIAL FAILURE
// Một số Promise fail không ảnh hưởng đến các Promise còn lại
const [userResult, ordersResult, notifsResult] = await Promise.allSettled([
  this.userService.findById(userId),
  this.orderService.findByUser(userId),
  this.notifService.findByUser(userId),
]);

const user         = userResult.status   === 'fulfilled' ? userResult.value   : null;
const orders       = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
const notifications = notifsResult.status === 'fulfilled' ? notifsResult.value : [];

// Log các service bị lỗi để monitor
if (ordersResult.status === 'rejected') {
  this.logger.warn('Failed to fetch orders', { userId, error: ordersResult.reason });
}
```

> **Quy tắc chọn:** Dùng `Promise.all` khi toàn bộ kết quả đều bắt buộc (thiếu 1 là không xử lý được). Dùng `Promise.allSettled` khi có thể trả về partial data và chấp nhận một số field bị thiếu.

### 4.3. Timeout cho External Calls
Mọi HTTP call ra bên ngoài **BẮT BUỘC** phải có timeout để tránh treo request.

```typescript
// ❌ Incorrect: Không timeout → request có thể treo vĩnh viễn
const response = await this.httpService.axiosRef.get('https://external-api.com/data');

// ✅ Correct: Luôn set timeout
const response = await this.httpService.axiosRef.get('https://external-api.com/data', {
  timeout: 5000, // 5 giây
  signal: AbortSignal.timeout(5000), // Hoặc dùng AbortSignal
});
```

---

## 5. Hiệu suất (Performance)

### 5.1. DTO & Validation Pipeline
Sử dụng `class-validator` và `class-transformer`. Luôn bật `whitelist: true` và `forbidNonWhitelisted: true` để chặn field không mong muốn (ngăn Mass Assignment attack).

```typescript
// main.ts — Cấu hình global
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Tự động strip field thừa
    forbidNonWhitelisted: true,   // Throw error nếu có field lạ
    transform: true,              // Tự động transform type (string → number)
  }),
);

// dto/create-order.dto.ts
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}
```

### 5.2. Tránh N+1 Query (Query trong Loop)
Tuyệt đối không query database bên trong vòng lặp.

```typescript
// ❌ Incorrect: N+1 Query — 1 query lấy orders + N query lấy từng user
const orders = await this.orderRepo.find();
for (const order of orders) {
  order.user = await this.userRepo.findById(order.userId); // ❌ Query trong loop
}

// ✅ Correct: 2 queries tổng cộng
const orders = await this.orderRepo.find();
const userIds = [...new Set(orders.map((o) => o.userId))];
const users = await this.userRepo.findByIds(userIds); // 1 query IN(...)
const userMap = new Map(users.map((u) => [u.id, u]));

for (const order of orders) {
  order.user = userMap.get(order.userId);
}

// ✅ Hoặc dùng TypeORM relations
const orders = await this.orderRepo.find({ relations: ['user'] });
```

### 5.3. Pagination bắt buộc
Mọi API trả về danh sách **BẮT BUỘC** phải có pagination. Không bao giờ trả về toàn bộ bảng.

```typescript
// ❌ Incorrect: Trả toàn bộ → crash nếu bảng có triệu records
async findAll() {
  return this.repo.find();
}

// ✅ Correct: Luôn có pagination
async findAll(page = 1, limit = 20) {
  const [data, total] = await this.repo.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

---

## 6. Logging (Structured Logging)

### 6.1. Sử dụng NestJS Logger qua DI
Tuyệt đối không dùng `console.log` trong production code.

```typescript
// ❌ Incorrect
console.log('User created:', user.id);
console.error('Error:', err);

// ✅ Correct: Inject Logger vào Service
import { Logger } from '@nestjs/common';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  async create(dto: CreateOrderDto) {
    this.logger.log(`Creating order for product ${dto.productId}`);

    try {
      const order = await this.orderRepo.save(dto);
      this.logger.log(`Order created successfully`, { orderId: order.id });
      return order;
    } catch (err) {
      this.logger.error('Failed to create order', err.stack, {
        productId: dto.productId,
        error: err.message,
      });
      throw err;
    }
  }
}
```

### 6.2. Không Log Dữ liệu Nhạy cảm
Tuyệt đối không log password, token, credit card, PII (Personally Identifiable Information).

```typescript
// ❌ Incorrect
this.logger.log('Login attempt', { email, password }); // ❌ Lộ password

// ✅ Correct
this.logger.log('Login attempt', { email });
```

---

## 7. Testing

### 7.1. Table-Driven Tests
Sử dụng `it.each` cho các hàm có nhiều case input/output.

```typescript
describe('PriceCalculator', () => {
  it.each([
    { quantity: 1, price: 100, discount: 0, expected: 100 },
    { quantity: 2, price: 100, discount: 10, expected: 180 },
    { quantity: 0, price: 100, discount: 0, expected: 0 },
  ])('calculates total for $quantity items at $price with $discount% off', ({ quantity, price, discount, expected }) => {
    expect(calculateTotal(quantity, price, discount)).toBe(expected);
  });
});
```

### 7.2. Service Unit Test với Mock
Luôn mock các dependency của Service. Không gọi database/API thật trong unit test.

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    mockRepo = module.get(UserRepository);
  });

  it('should throw BusinessException when user not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('non-existent'))
      .rejects
      .toThrow(BusinessException);
  });

  it('should return user when found', async () => {
    const mockUser = { id: '1', name: 'John' } as User;
    mockRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.findById('1');
    expect(result).toEqual(mockUser);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

---

## 8. Configuration (12-Factor App)

### 8.1. Environment Variables với `@nestjs/config`
Cấu hình phải được load từ **Environment Variables**. Sử dụng `ConfigModule` để validate và strongly-type config.

```typescript
// config/app.config.ts — Validate env khi app khởi động
import { IsNumber, IsString, IsEnum } from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';

export class AppConfig {
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsEnum(['development', 'staging', 'production'])
  NODE_ENV: string;
}

// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const validated = plainToInstance(AppConfig, config);
        const errors = validateSync(validated);
        if (errors.length > 0) {
          throw new Error(`Config validation error: ${errors}`);
        }
        return validated;
      },
    }),
  ],
})
export class AppModule {}
```

### 8.2. Không Hardcode Credentials
Tuyệt đối không hardcode bất kỳ secret/credential/API key nào trong code.

```typescript
// ❌ Incorrect
const JWT_SECRET = 'my-super-secret-key-123'; // ❌ Hardcode

// ✅ Correct
constructor(private readonly configService: ConfigService) {}

getJwtSecret(): string {
  return this.configService.getOrThrow<string>('JWT_SECRET');
}
```

---

## 9. Security

### 9.1. Guards cho Authentication & Authorization
Sử dụng Guards để kiểm soát truy cập. Tuyệt đối không kiểm tra auth bên trong hàm controller/service.

```typescript
// ❌ Incorrect: Check auth thủ công trong controller
@Get('profile')
async getProfile(@Req() req: Request) {
  const token = req.headers.authorization;
  if (!token) throw new UnauthorizedException();
  const user = this.authService.verify(token);  // ❌ Logic auth trong controller
  return user;
}

// ✅ Correct: Guard tách biệt, decorator rõ ràng
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

### 9.2. Rate Limiting
API public **BẮT BUỘC** phải có rate limiting để chống brute-force và DDoS.

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 3 },   // Max 3 req/giây
        { name: 'long', ttl: 60000, limit: 60 },  // Max 60 req/phút
      ],
    }),
  ],
})
export class AppModule {}
```

### 9.3. Helmet & CORS
Luôn bật Helmet để thêm các HTTP security headers và cấu hình CORS chặt chẽ.

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
app.enableCors({
  origin: configService.get('ALLOWED_ORIGINS')?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

### 9.4. Sanitize Input
Ngoài validation, cần sanitize dữ liệu đầu vào để chống XSS/SQL Injection.

```typescript
// ❌ Incorrect: Dùng raw input trực tiếp vào query
const users = await this.repo.query(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ Correct: Dùng parameterized query (TypeORM tự handle)
const users = await this.repo.find({ where: { name } });

// ✅ Correct: Nếu cần raw query
const users = await this.repo.query('SELECT * FROM users WHERE name = $1', [name]);
```

---

## 10. Data Structures & Serialization

### 10.1. DTO cho Input, Entity cho Database
Tuyệt đối **không** dùng Entity trực tiếp làm response. Luôn có DTO/ViewModel để kiểm soát dữ liệu trả về.

```typescript
// ❌ Incorrect: Trả entity trực tiếp → lộ password, internal fields
@Get(':id')
async getUser(@Param('id') id: string) {
  return this.userRepo.findOne({ where: { id } }); // ❌ Lộ password, createdAt internal...
}

// ✅ Correct: Map sang Response DTO
// dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  // Không có password, không có internal fields
}

@Get(':id')
async getUser(@Param('id') id: string): Promise<UserResponseDto> {
  const user = await this.userService.findById(id);
  return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
}
```

### 10.2. Ẩn field nhạy cảm — Ưu tiên Response DTO, hạn chế `@Exclude()` trên Entity

Có hai cách tiếp cận. **Ưu tiên Cách 1** (Response DTO) vì nó tách biệt hoàn toàn serialization logic khỏi Entity.

**Cách 1 (Khuyến nghị): Response DTO riêng biệt**

```typescript
// ✅ Correct: Không coupling Entity với HTTP serialization
// dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  // password, refreshToken KHÔNG có trong DTO → không bao giờ bị leak
  // Mỗi context có thể có DTO riêng (AdminUserResponseDto, PublicUserResponseDto...)
}

// controller
@Get(':id')
async getUser(@Param('id') id: string): Promise<UserResponseDto> {
  const user = await this.userService.findById(id);
  return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
}
```

**Cách 2 (Chấp nhận được cho CRUD đơn giản): `@Exclude()` trên Entity**

```typescript
// ⚠️ Chấp nhận được nhưng có giới hạn:
// - Entity bị coupling với HTTP serialization logic
// - Khó dùng Entity trong context khác (nội bộ service-to-service)
// - Nếu cần trả về password ở một context → phải override toàn bộ

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Exclude()                    // Ẩn khi serialize HTTP response
  @Column()
  password: string;

  @Exclude()
  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;
}

// main.ts hoặc controller — Bật interceptor
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

> **Quy tắc chọn:** Dùng **Response DTO** khi có nhiều loại user roles với output khác nhau, hoặc khi Entity phức tạp. Dùng **@Exclude()** chỉ khi entity đơn giản và chỉ có 1 kiểu response duy nhất.

### 10.3. Swagger Documentation
Mọi API endpoint **BẮT BUỘC** phải có Swagger decoration cho DTO.

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID sản phẩm', example: 'prod_abc123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Số lượng', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Ghi chú cho đơn hàng' })
  @IsOptional()
  @IsString()
  note?: string;
}
```

---

## 11. API Response Standard (RESTful & Clean Code)

### 11.1. Standard Response Format
Thống nhất cấu trúc JSON trả về cho toàn bộ API.

**Success Response:**
```typescript
// common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data: data?.data ?? data,
        meta: data?.meta ?? undefined,
        message: data?.message ?? 'Success',
      })),
    );
  }
}

// main.ts
app.useGlobalInterceptors(new ResponseInterceptor());
```

**Error Response (xử lý bởi BusinessExceptionFilter ở mục 3.3):**
```json
{
  "code": "BALANCE_NOT_ENOUGH",
  "message": "Insufficient balance",
  "details": null
}
```

### 11.2. HTTP Status Codes
Tuân thủ ngữ nghĩa RESTful. **Không** trả về `200 OK` kèm error code bên trong body.

*   **2xx Success**
    *   `200 OK`: GET, PUT, PATCH thành công.
    *   `201 Created`: POST tạo mới resource.
    *   `204 No Content`: DELETE thành công.

*   **4xx Client Error**
    *   `400 Bad Request`: Input sai định dạng.
    *   `401 Unauthorized`: Chưa xác thực.
    *   `403 Forbidden`: Không có quyền.
    *   `404 Not Found`: Resource không tồn tại.
    *   `409 Conflict`: Trùng lặp (email đã tồn tại).
    *   `422 Unprocessable Entity`: Input đúng format nhưng sai logic nghiệp vụ.
    *   `429 Too Many Requests`: Rate limit exceeded.

*   **5xx Server Error**
    *   `500 Internal Server Error`: Lỗi server.

---

## 12. Quy Chuẩn Giao Tiếp Liên Module (Inter-Module Communication)

Tài liệu này hướng dẫn cách truy xuất dữ liệu từ module khác trong kiến trúc Monolith, đảm bảo tính **Loosely Coupled** (rời rạc) và sẵn sàng để tách thành **Microservice** bất cứ lúc nào mà không phải sửa đổi Logic nghiệp vụ.

### 12.1. Vấn Đề (The Problem)

Trong kiến trúc Monolith, chúng ta thường import trực tiếp Repository hoặc Service từ module khác:

```typescript
// modules/order/order.service.ts

import { UserRepository } from '../user/user.repository'; // ❌ Phụ thuộc trực tiếp
import { User } from '../user/entities/user.entity';       // ❌ Leak entity

@Injectable()
export class OrderService {
  constructor(private readonly userRepo: UserRepository) {}

  async createOrder(dto: CreateOrderDto) {
    const user: User = await this.userRepo.findOneBy({ id: dto.userId }); // ❌ Gọi thẳng repo ngoài
  }
}
```

**Hệ quả:**
1. **High Coupling:** Module Orders bị buộc chặt vào module Users (import trực tiếp repository + entity).
2. **Khó Scale:** Nếu Users tách thành Microservice, code của Orders sẽ lỗi (vì Repository không còn đọc database local).
3. **Khó Test:** Unit test của Orders phải mock cả TypeORM Repository của Users.
4. **Leak Abstraction:** Orders biết Entity `User` phơi bày field nhạy cảm (password, refreshToken).

### 12.2. Giải Pháp: Abstract Class + Adapter Pattern

Áp dụng **Dependency Inversion Principle (DIP)**: "Phụ thuộc vào trừu tượng, không phụ thuộc vào cụ thể."

> [!NOTE]
> Trong NestJS/TypeScript, chúng ta dùng **abstract class** thay vì interface để làm DI token, vì TypeScript interface bị xoá ở runtime và không thể dùng làm injection token.

#### Kiến trúc 3 lớp:
1. **Consumer (Orders Module):** Định nghĩa một `Abstract Class` (Port) mô tả những gì nó CẦN.
2. **Implementation (Adapter):** Thực thi abstract class đó bằng kỹ thuật cụ thể (gọi Service local, HTTP call, gRPC...).
3. **Module Config:** "Tiêm" (Inject) bản thực thi phù hợp vào Service qua `providers`.

### 12.3. Cấu Trúc Thư Mục Chuẩn

Mỗi module khi cần dữ liệu từ bên ngoài nên tổ chức như sau:

```text
src/modules/order/
├── ports/
│   └── user-reader.port.ts          # 🟢 [Abstract Class] Orders cần đọc user
├── adapters/
│   ├── local-user.adapter.ts        # 🔵 [Impl] Gọi UserService local (Monolith)
│   ├── http-user.adapter.ts         # 🟠 [Impl] Gọi qua REST API (Microservice)
│   └── cached-user.adapter.ts       # 🟡 [Optional] Thêm cache layer
├── dto/
│   └── create-order.dto.ts
├── order.service.ts
├── order.controller.ts
└── order.module.ts
```

### 12.4. Ví Dụ Thực Tế (Orders & Users)

#### Bước 1: Định nghĩa Port (Abstract Class) tại module consumer

Port này mô tả nhu cầu của Orders module, hoàn toàn **độc lập** với module Users. DTO `UserBasicInfo` chỉ chứa những field mà Orders thực sự cần.

```typescript
// modules/order/ports/user-reader.port.ts

// DTO đơn giản — KHÔNG dùng Entity của Users
export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export abstract class UserReaderPort {
  abstract findById(id: string): Promise<UserBasicInfo | null>;
  abstract findByIds(ids: string[]): Promise<UserBasicInfo[]>;
}
```

#### Bước 2: Service chỉ phụ thuộc vào Port

```typescript
// modules/order/order.service.ts

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly userReader: UserReaderPort, // ✅ Inject abstract class, không biết impl cụ thể
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const user = await this.userReader.findById(dto.userId);
    if (!user) {
      throw ERR.USER_NOT_FOUND(); // ✅ Gọi factory function → instance mới
    }

    const order = this.orderRepo.create({
      ...dto,
      userName: user.name, // ✅ Chỉ dùng field từ DTO đơn giản
    });

    return this.orderRepo.save(order);
  }
}
```

#### Bước 3: Tạo Adapter tại module consumer

**Local Adapter (Dùng cho Monolith)**
Adapter này gọi **Service** (không phải Repository) của Users module.

```typescript
// modules/order/adapters/local-user.adapter.ts

import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service'; // Import Service, KHÔNG import Repo
import { UserReaderPort, UserBasicInfo } from '../ports/user-reader.port';

@Injectable()
export class LocalUserAdapter extends UserReaderPort {
  constructor(private readonly userService: UserService) {}

  async findById(id: string): Promise<UserBasicInfo | null> {
    const user = await this.userService.findById(id);
    if (!user) return null;
    // ✅ Map Entity sang DTO đơn giản — ẩn password, internal fields
    return { id: user.id, name: user.name, email: user.email };
  }

  async findByIds(ids: string[]): Promise<UserBasicInfo[]> {
    const users = await this.userService.findByIds(ids);
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
  }
}
```

**HTTP Adapter (Sẵn sàng cho Microservice)**
Khi tách Users thành service riêng, chỉ cần viết thêm Adapter này. **KHÔNG sửa OrderService**.

```typescript
// modules/order/adapters/http-user.adapter.ts

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserReaderPort, UserBasicInfo } from '../ports/user-reader.port';

@Injectable()
export class HttpUserAdapter extends UserReaderPort {
  private readonly baseUrl: string;
  private readonly logger = new Logger(HttpUserAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    super();
    this.baseUrl = this.config.getOrThrow<string>('USER_SERVICE_URL');
  }

  async findById(id: string): Promise<UserBasicInfo | null> {
    try {
      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}/users/${id}`,
        { timeout: 5000 },
      );
      return { id: data.id, name: data.name, email: data.email };
    } catch (err) {
      // ✅ Phân biệt 404 (user không tồn tại) với lỗi infrastructure (5xx, timeout)
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null; // User thực sự không tồn tại → trả null là hợp lệ
      }
      // Lỗi infrastructure → log và throw để caller biết service đang bị lỗi
      // Không được trả null vì caller sẽ nghĩ "user không tồn tại" → hành vi sai
      this.logger.error('Failed to fetch user from user-service', {
        userId: id,
        error: err.message,
        status: axios.isAxiosError(err) ? err.response?.status : 'network_error',
      });
      throw new ServiceUnavailableException('User service is temporarily unavailable');
    }
  }

  async findByIds(ids: string[]): Promise<UserBasicInfo[]> {
    try {
      const { data } = await this.httpService.axiosRef.post(
        `${this.baseUrl}/users/batch`,
        { ids },
        { timeout: 5000 },
      );
      return data.map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
    } catch (err) {
      this.logger.error('Failed to batch fetch users from user-service', {
        userIds: ids,
        error: err.message,
      });
      throw new ServiceUnavailableException('User service is temporarily unavailable');
    }
  }
}
```

#### Bước 4: Module Configuration — Inject Adapter

```typescript
// modules/order/order.module.ts

@Module({
  imports: [UserModule], // Import để dùng UserService
  providers: [
    OrderService,
    {
      provide: UserReaderPort,                // Token = Abstract class
      useClass: LocalUserAdapter,             // ✅ Monolith: dùng local adapter
      // useClass: HttpUserAdapter,           // 🔄 Microservice: chỉ cần đổi dòng này
    },
  ],
  controllers: [OrderController],
})
export class OrderModule {}
```

### 12.5. Chiến Lược Dịch Chuyển (Microservice Readiness)

Khi module Users được tách ra thành Microservice:

```mermaid
flowchart LR
    subgraph "Monolith (Hiện tại)"
        OS[OrderService] --> LA[LocalUserAdapter]
        LA --> US[UserService]
    end

    subgraph "Microservice (Tương lai)"
        OS2[OrderService] --> HA[HttpUserAdapter]
        HA -->|HTTP/gRPC| UMS[User Microservice]
    end
```

1. **Bước 1:** Viết `HttpUserAdapter` gọi API của Users Microservice.
2. **Bước 2:** Trong `order.module.ts`, đổi `useClass: LocalUserAdapter` sang `useClass: HttpUserAdapter`.
3. **Kết quả:** Code logic trong `order.service.ts` vẫn giữ nguyên **100%**.

### 12.6. 5 Quy Tắc Vàng cho Team

> [!IMPORTANT]
> 1. **Consumer sở hữu Port:** Abstract class `UserReaderPort` phải nằm trong module Orders, không phải Users.
> 2. **Không Leak Entity:** Adapter phải map Entity sang DTO đơn giản (`UserBasicInfo`) — không bao giờ trả về Entity gốc với password, internal fields.
> 3. **Export Service, không Export Repository:** Module chỉ export Service class ra ngoài. Tuyệt đối không export Repository.
> 4. **Dùng Abstract Class, không dùng Interface:** TypeScript interface bị xoá ở runtime → không thể dùng làm NestJS injection token. Luôn dùng `abstract class`.
> 5. **Mapping bắt buộc:** Luôn có bước mapping dữ liệu từ nguồn (Users) sang định dạng module hiện tại (Orders) cần. Không truyền thẳng Entity.

---

## 13. Database Transaction với UnitOfWork Pattern

Service layer **KHÔNG được** inject `DataSource` hoặc `EntityManager` trực tiếp từ TypeORM. Điều này vi phạm nguyên tắc DDD: Service biết về chi tiết database implementation.

### 13.1. Vấn đề khi inject DataSource trực tiếp

```typescript
// ❌ Incorrect: Service bị coupling với TypeORM DataSource
@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {} // ❌ TypeORM lọt vào Application layer

  async createOrder(dto: CreateOrderDto) {
    await this.dataSource.transaction(async (manager) => { // ❌ TypeORM API trong Service
      await manager.save(Order, order);
      await manager.update(Inventory, { productId: dto.productId }, { stock: () => 'stock - 1' });
    });
  }
}
```

### 13.2. Giải pháp: Abstract UnitOfWork

```typescript
// common/database/unit-of-work.abstract.ts
// Định nghĩa interface ở tầng Application — không biết TypeORM

export interface TransactionalRepos {
  orderRepo: OrderTxRepository;
  inventoryRepo: InventoryTxRepository;
}

export abstract class UnitOfWork {
  abstract execute<T>(fn: (repos: TransactionalRepos) => Promise<T>): Promise<T>;
}
```

```typescript
// common/database/typeorm-unit-of-work.ts — Implementation ở Infrastructure layer
@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async execute<T>(fn: (repos: TransactionalRepos) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const repos: TransactionalRepos = {
        orderRepo: new OrderTxRepository(manager),
        inventoryRepo: new InventoryTxRepository(manager),
      };
      return fn(repos);
    });
  }
}

// app.module.ts — Đăng ký
providers: [
  { provide: UnitOfWork, useClass: TypeOrmUnitOfWork },
]
```

```typescript
// ✅ Correct: Service hoàn toàn sạch, không biết TypeORM
@Injectable()
export class OrderService {
  constructor(private readonly uow: UnitOfWork) {}

  async createOrder(dto: CreateOrderDto) {
    return this.uow.execute(async ({ orderRepo, inventoryRepo }) => {
      const order = await orderRepo.save(dto);

      await inventoryRepo.reduceStock(dto.productId, dto.quantity);
      // Nếu reduceStock throw error → transaction tự động rollback
      return order;
    });
  }
}
```

### 13.3. Khi nào cần Transaction?

| Tình huống | Cần Transaction? |
|---|---|
| Insert/Update 1 bảng | ❌ Không cần |
| Insert/Update nhiều bảng liên quan | ✅ Bắt buộc |
| Đọc rồi ghi dựa trên kết quả đọc (check-then-act) | ✅ Nên dùng với `SERIALIZABLE` isolation |
| Ghi + gửi event/email | ❌ Không gộp vào transaction — event emit sau khi commit |

> **Lưu ý quan trọng:** Không emit event hoặc gọi external API bên trong transaction. Nếu transaction commit xong nhưng event emit thất bại → có thể emit lại. Nhưng nếu emit trước khi commit → consumer nhận event nhưng data chưa có trong DB.

---

## 14. Request Logging Interceptor với Correlation ID

Mọi request cần được gán một **Correlation ID** duy nhất để trace log xuyên suốt hệ thống, đặc biệt quan trọng trong kiến trúc microservices.

### 14.1. Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;

    // Lấy từ header (microservice truyền vào) hoặc tạo mới
    const correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4();
    req.correlationId = correlationId;                  // Gắn vào request để service dùng
    res.setHeader('x-correlation-id', correlationId);  // Trả về cho client để debug

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} ${res.statusCode} ${ms}ms`, { correlationId });
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.error(`${method} ${url} FAILED ${ms}ms`, {
            correlationId,
            error: err.message,
            statusCode: err.status ?? 500,
          });
        },
      }),
    );
  }
}
```

### 14.2. Đăng ký và sử dụng Correlation ID

```typescript
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());

// Lấy correlationId trong Service nếu cần log với context
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  async createOrder(@Req() req: Request, dto: CreateOrderDto) {
    const correlationId = (req as any).correlationId;
    this.logger.log('Creating order', { correlationId, productId: dto.productId });
  }
}
```

> **Mở rộng:** Khi hệ thống chuyển sang microservices, truyền `x-correlation-id` trong header của mọi inter-service HTTP call để trace request xuyên suốt các service.

---

## 15. Circular Dependency Prevention

Circular dependency là lỗi phổ biến trong NestJS khi hai module import lẫn nhau. NestJS sẽ throw `Nest cannot create the module instance` tại runtime.

### 15.1. Phát hiện Circular Dependency

```typescript
// ❌ Circular: UserModule imports OrderModule, OrderModule imports UserModule
// user.module.ts
@Module({ imports: [OrderModule] })    // UserModule cần OrderModule
export class UserModule {}

// order.module.ts
@Module({ imports: [UserModule] })     // OrderModule cần UserModule ← CIRCULAR!
export class OrderModule {}
```

### 15.2. Giải pháp 1 — Tách SharedModule (Khuyến nghị)

```typescript
// ✅ Tách logic chung vào module thứ ba
// shared/shared.module.ts
@Module({
  providers: [SharedNotificationService, SharedAuditService],
  exports:   [SharedNotificationService, SharedAuditService],
})
export class SharedModule {}

// Cả UserModule lẫn OrderModule đều import SharedModule
// → không còn phụ thuộc lẫn nhau
@Module({ imports: [SharedModule] })
export class UserModule {}

@Module({ imports: [SharedModule] })
export class OrderModule {}
```

### 15.3. Giải pháp 2 — forwardRef (Giải pháp tạm thời)

```typescript
// ✅ Dùng khi KHÔNG thể tái cấu trúc ngay — đánh dấu là technical debt
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => OrderService)) // Lazy reference
    private readonly orderService: OrderService,
  ) {}
}

// order.module.ts
@Module({
  imports: [forwardRef(() => UserModule)], // Cũng cần forwardRef ở cả hai phía
})
export class OrderModule {}
```

> **Quy tắc:** Mỗi `forwardRef` trong codebase nên có comment giải thích lý do và issue tracking để xử lý. `forwardRef` là dấu hiệu kiến trúc cần được review lại.

---

## 16. Health Check với Terminus

Mọi service production **BẮT BUỘC** có endpoint `/health` để load balancer và Kubernetes kiểm tra trạng thái.

### 16.1. Cài đặt và cấu hình

```bash
npm install @nestjs/terminus
```

```typescript
// health/health.module.ts
@Module({
  imports: [TerminusModule, TypeOrmModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### 16.2. Health Controller

```typescript
// health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly http: HttpHealthIndicator,
  ) {}

  // Kubernetes liveness probe: app còn sống không?
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([]); // Chỉ kiểm tra app có respond không
  }

  // Kubernetes readiness probe: app sẵn sàng nhận traffic chưa?
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),          // DB có kết nối không?
    ]);
  }
}

// Response khi healthy:
// { "status": "ok", "details": { "database": { "status": "up" } } }

// Response khi unhealthy (HTTP 503):
// { "status": "error", "details": { "database": { "status": "down", "message": "..." } } }
```

> **Lưu ý Kubernetes:** Cấu hình `livenessProbe` trỏ đến `/health/live` và `readinessProbe` trỏ đến `/health/ready`. Phân biệt hai endpoint giúp K8s restart pod khi app deadlock (liveness) nhưng không route traffic khi DB chưa sẵn sàng (readiness).

---

## 17. TypeScript Strict Mode & ESLint Configuration

### 17.1. TypeScript `tsconfig.json` — Bật Strict Mode

**BẮT BUỘC** bật strict mode trong mọi dự án mới. Strict mode bắt hàng trăm loại lỗi tại compile time thay vì runtime.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                       // Bật toàn bộ strict checks (bao gồm các option dưới)
    "noImplicitAny": true,                // Không cho phép type any ngầm định
    "strictNullChecks": true,             // null/undefined không compatible với kiểu khác
    "strictFunctionTypes": true,          // Kiểm tra contravariance cho function parameters
    "noUncheckedIndexedAccess": true,     // arr[0] trả về T | undefined, buộc kiểm tra null
    "exactOptionalPropertyTypes": true,   // Phân biệt property thiếu và property = undefined
    "noImplicitReturns": true,            // Mọi code path phải return giá trị
    "noFallthroughCasesInSwitch": true,   // Bắt buộc break/return trong mỗi case
    "forceConsistentCasingInFileNames": true
  }
}
```

### 17.2. ESLint `.eslintrc.js` — Rules chuẩn

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // ✅ Bắt floating promise (await bị thiếu) — liên quan Section 4.1
    '@typescript-eslint/no-floating-promises': 'error',

    // ✅ Cảnh báo dùng any — khuyến khích khai báo type rõ ràng
    '@typescript-eslint/no-explicit-any': 'warn',

    // ✅ Bắt buộc khai báo return type cho function public
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],

    // ✅ Cấm biến không dùng
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // ✅ Cấm console.log trong production code — dùng Logger thay thế
    'no-console': 'error',

    // ✅ Bắt buộc xử lý Promise reject — liên quan Section 4.1
    '@typescript-eslint/no-misused-promises': 'error',

    // ✅ Cảnh báo khi dùng type assertion không an toàn (as any)
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
  },
};
```

### 17.3. Prettier — Code Formatting

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always"
}
```

### 17.4. Scripts trong `package.json`

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "check": "npm run type-check && npm run lint && npm run test"
  }
}
```

> **Quy tắc:** CI/CD pipeline **BẮT BUỘC** chạy `npm run check` trước khi merge PR. Không merge code có TypeScript error hoặc ESLint error.
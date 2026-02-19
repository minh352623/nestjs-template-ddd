# Prompt Template: Viết unit test cho Entity hoặc Service

## Cách dùng
Copy phần giữa `---START---` và `---END---`, điền thông tin, paste vào chat.

---START---
Viết unit test cho:

**Loại test:** [Entity / Application Service / Cross-module với Port]
**File cần test:** `src/modules/[module]/[path/to/file].ts`
**Method/Function:** `[MethodName](args): ReturnType`

**Paste code cần test:**
```typescript
[paste code tại đây]
```

**Dependencies cần mock (cho Service test):**
- `[AbstractClassName]` — methods: [list các methods được gọi]

**Test cases cần cover:**
1. [Happy path: điều kiện thành công]
2. [Error case 1: ví dụ entity không tồn tại → EntityNotFoundException]
3. [Error case 2: ví dụ invariant violation]
4. [Edge case nếu có]

**Yêu cầu:**
- Test file path: `[same path as source].spec.ts`
- Dùng Jest + NestJS testing module
- Table-driven test (`it.each`) cho multiple input cases
- `Result.fail` / `Result.ok` pattern cho entity tests

---END---

## Ví dụ — Entity test

---START---
Viết unit test cho:

**Loại test:** Entity
**File:** `src/modules/user/domain/model/entity/user.entity.ts`
**Function:** `User.create(props: UserCreateProps): Result<User>`

**Code:**
```typescript
static create(props: UserCreateProps): Result<User> {
  if (!props.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
    return Result.fail(new ValidationException([{ field: 'email', message: 'Invalid email' }]));
  }
  if (!props.name || props.name.length < 2) {
    return Result.fail(new ValidationException([{ field: 'name', message: 'Name too short' }]));
  }
  return Result.ok(new User({ id: crypto.randomUUID(), ...props, createdAt: new Date(), updatedAt: new Date() }));
}
```

**Test cases:**
1. Email và name hợp lệ → Result.ok, user có id
2. Email rỗng → Result.fail, ValidationException
3. Email sai format → Result.fail, ValidationException
4. Name rỗng → Result.fail, ValidationException
5. Name chỉ 1 ký tự → Result.fail (< 2 chars)

**Yêu cầu:**
- `it.each` cho invalid cases
- Verify `result.isSuccess` / `result.isFailure`
- Verify `result.error` là `ValidationException` instance
---END---

## Ví dụ — Application Service test

---START---
Viết unit test cho:

**Loại test:** Application Service
**File:** `src/modules/payment/application/service/payment.service.impl.ts`
**Method:** `createPayment(dto: CreatePaymentInputDto): Promise<PaymentOutputDto>`

**Code:**
```typescript
async createPayment(dto: CreatePaymentInputDto): Promise<PaymentOutputDto> {
  const userResult = await this.userPort.findById(dto.userId);
  if (userResult.isFailure) throw userResult.error;
  
  const result = Payment.create({
    userId: dto.userId,
    amount: dto.amount,
    currency: dto.currency,
  });
  if (result.isFailure) throw result.error;
  
  const saved = await this.paymentRepo.save(result.getValue());
  return this.toOutputDto(saved);
}
```

**Dependencies:**
- `EXTERNAL_USER_PORT` / `IExternalUserPort` — method: `findById`
- `PaymentRepository` — method: `save`

**Test cases:**
1. User exists, Payment.create valid → returns PaymentOutputDto
2. User not found (userPort returns Result.fail) → throws EntityNotFoundException
3. Payment.create fails (invalid amount) → throws ValidationException
4. repo.save fails → propagates error

**Yêu cầu:**
- NestJS Test.createTestingModule
- Mock cả userPort và paymentRepo
- Verify mock calls được gọi đúng args
---END---

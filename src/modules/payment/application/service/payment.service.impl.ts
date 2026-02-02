import { Injectable, Inject } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentInput, PaymentOutput, PaymentStatus } from './dto/payment.dto';
import { Result } from '../../../../shared/domain/result';
import { PaymentRepository } from '../../domain/repository/payment.repository';
import { PaymentDomainService } from '../../domain/service/payment.domain.service';
import { Payment } from '../../domain/model/entity/payment.entity';

// ✅ Import Interface từ DOMAIN layer (tuân thủ DIP)
// Application → Domain (OK) ✓
import {
  IExternalUserPort,
  EXTERNAL_USER_PORT,
} from '../../domain/ports';

/**
 * Payment Application Service Implementation
 * 
 * Sử dụng Interface + Adapter Pattern để giao tiếp với User module:
 * 
 * - Inject IUserRepositoryPort (interface)
 * - KHÔNG biết implementation là LocalAdapter hay HTTPAdapter
 * - Business logic KHÔNG cần thay đổi khi chuyển Microservice
 */
@Injectable()
export class PaymentServiceImpl implements PaymentService {
  constructor(
    @Inject(PaymentRepository)
    private readonly paymentRepository: PaymentRepository,

    @Inject(PaymentDomainService)
    private readonly paymentDomainService: PaymentDomainService,

    // ✨ Inject bằng Interface Token từ Domain
    // Monolith: nhận LocalAdapter (wrap UserRepository trực tiếp)
    // Microservice: nhận HTTPAdapter (gọi User Service API)
    @Inject(EXTERNAL_USER_PORT)
    private readonly externalUserPort: IExternalUserPort,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<Result<PaymentOutput>> {
    // 1. Lấy user data qua adapter (không biết là local hay HTTP call)
    const userResult = await this.externalUserPort.findById(input.userId);

    if (userResult.isFailure) {
      return Result.fail(new Error(`User not found: ${input.userId}`));
    }

    const user = userResult.value;

    // 2. Validate payment với domain service
    const validationResult = await this.paymentDomainService.validatePayment({
      amount: input.amount,
      currency: input.currency,
    });

    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // 3. Tạo payment entity
    const paymentResult = Payment.create({
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      status: PaymentStatus.PENDING,
    });

    if (paymentResult.isFailure) {
      return Result.fail(paymentResult.error);
    }

    const payment = paymentResult.value;

    // 4. Persist payment
    await this.paymentRepository.save(payment);

    // 5. Return output với user info
    return Result.ok({
      id: payment.id,
      userId: payment.userId,
      userName: user.name,      // ✨ Data từ User module qua adapter
      userEmail: user.email,    // ✨ Data từ User module qua adapter
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
    });
  }

  async getPaymentById(id: string): Promise<Result<PaymentOutput>> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      return Result.fail(new Error(`Payment not found: ${id}`));
    }

    // Lấy user info qua adapter
    const userResult = await this.externalUserPort.findById(payment.userId);
    const user = userResult.isSuccess ? userResult.value : null;

    return Result.ok({
      id: payment.id,
      userId: payment.userId,
      userName: user?.name ?? 'Unknown',
      userEmail: user?.email ?? 'Unknown',
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
    });
  }

  async getPaymentsByUserId(userId: string): Promise<Result<PaymentOutput[]>> {
    // Kiểm tra user tồn tại qua adapter
    const userExists = await this.externalUserPort.exists(userId);

    if (!userExists) {
      return Result.fail(new Error(`User not found: ${userId}`));
    }

    const payments = await this.paymentRepository.findByUserId(userId);
    const userResult = await this.externalUserPort.findById(userId);
    const user = userResult.isSuccess ? userResult.value : null;

    const outputs: PaymentOutput[] = payments.map((payment: Payment) => ({
      id: payment.id,
      userId: payment.userId,
      userName: user?.name ?? 'Unknown',
      userEmail: user?.email ?? 'Unknown',
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
    }));

    return Result.ok(outputs);
  }
}

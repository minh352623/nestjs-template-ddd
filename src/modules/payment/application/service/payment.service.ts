import { Result } from '../../../../shared/domain/result';
import {
  CreatePaymentInput,
  PaymentOutput,
} from './dto/payment.dto';

/**
 * Payment Application Service Interface
 * Defines the use cases for payment management
 */
export abstract class PaymentService {
  abstract createPayment(input: CreatePaymentInput): Promise<Result<PaymentOutput>>;
  abstract getPaymentById(id: string): Promise<Result<PaymentOutput>>;
  abstract getPaymentsByUserId(userId: string): Promise<Result<PaymentOutput[]>>;
}

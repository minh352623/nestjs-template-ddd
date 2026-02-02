import { Payment } from '../model/entity/payment.entity';

/**
 * Payment Repository Interface
 */
export abstract class PaymentRepository {
  abstract save(payment: Payment): Promise<void>;
  abstract findById(id: string): Promise<Payment | null>;
  abstract findByUserId(userId: string): Promise<Payment[]>;
  abstract delete(id: string): Promise<void>;
}

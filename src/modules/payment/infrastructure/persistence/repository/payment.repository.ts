import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../domain/repository/payment.repository';
import { Payment } from '../../../domain/model/entity/payment.entity';

/**
 * In-Memory Payment Repository (for demo purposes)
 * Replace with PrismaPaymentRepository in production
 */
@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  private payments: Map<string, Payment> = new Map();

  async save(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const result: Payment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.userId === userId) {
        result.push(payment);
      }
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    this.payments.delete(id);
  }
}

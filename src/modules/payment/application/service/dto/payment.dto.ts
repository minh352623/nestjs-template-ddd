/**
 * Payment Application Layer DTOs
 */

// Re-export PaymentStatus from Domain layer (source of truth - BP DDD dependency flow)
import { PaymentStatus } from '../../../domain/model/entity/payment.entity';
export { PaymentStatus };

// Input DTOs
export interface CreatePaymentInput {
  userId: string;
  amount: number;
  currency: string;
  description?: string;
}

// Output DTOs
export interface PaymentOutput {
  id: string;
  userId: string;
  userName: string; // Fetched from User module
  userEmail: string; // Fetched from User module
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  createdAt: Date;
}

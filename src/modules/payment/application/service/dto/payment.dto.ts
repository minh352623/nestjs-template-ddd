/**
 * Payment Application Layer DTOs
 */

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

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

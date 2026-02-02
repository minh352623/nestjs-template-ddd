import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';

/**
 * Payment Controller DTOs
 */

// Request DTOs
export class CreatePaymentRequest {
  @IsString()
  userId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// Response DTOs
export interface PaymentResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: Date;
}

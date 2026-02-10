import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payment Controller DTOs (BP §10.3)
 */

// Request DTOs
export class CreatePaymentRequest {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ required: false, example: 'Monthly subscription' })
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

import { Controller, Post, Get, Param, Body, Inject } from '@nestjs/common';
import { PaymentService } from '../../application/service/payment.service';
import { CreatePaymentRequest, PaymentResponse } from '../dto/payment.dto';

/**
 * Payment HTTP Handler
 */
@Controller('payments')
export class PaymentHandler {
  constructor(
    @Inject(PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  async createPayment(@Body() request: CreatePaymentRequest): Promise<PaymentResponse> {
    const result = await this.paymentService.createPayment({
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
    });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Get(':id')
  async getPayment(@Param('id') id: string): Promise<PaymentResponse> {
    const result = await this.paymentService.getPaymentById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Get('user/:userId')
  async getPaymentsByUser(@Param('userId') userId: string): Promise<PaymentResponse[]> {
    const result = await this.paymentService.getPaymentsByUserId(userId);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}

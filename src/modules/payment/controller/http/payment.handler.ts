import { Controller, Post, Get, Param, Body, Inject, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '../../application/service/payment.service';
import { CreatePaymentRequest, PaymentResponse } from '../dto/payment.dto';

/**
 * Payment HTTP Handler (BP §10.3)
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentHandler {
  constructor(
    @Inject(PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 422, description: 'Validation error' })
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
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponse> {
    const result = await this.paymentService.getPaymentById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get payments by user ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'List of payments' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPaymentsByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<PaymentResponse[]> {
    const result = await this.paymentService.getPaymentsByUserId(userId);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}

import { Injectable } from '@nestjs/common';
import { PaymentDomainService, ValidatePaymentInput } from './payment.domain.service';
import { Result } from '../../../../shared/domain/result';

const SUPPORTED_CURRENCIES = ['USD', 'VND', 'EUR', 'GBP'];
const MAX_PAYMENT_AMOUNT = 10_000_000; // 10 million

/**
 * Payment Domain Service Implementation
 */
@Injectable()
export class PaymentDomainServiceImpl implements PaymentDomainService {
  async validatePayment(input: ValidatePaymentInput): Promise<Result<void>> {
    // Validate amount
    if (input.amount <= 0) {
      return Result.fail(new Error('Amount must be positive'));
    }

    if (input.amount > MAX_PAYMENT_AMOUNT) {
      return Result.fail(new Error(`Amount exceeds maximum limit of ${MAX_PAYMENT_AMOUNT}`));
    }

    // Validate currency
    if (!SUPPORTED_CURRENCIES.includes(input.currency.toUpperCase())) {
      return Result.fail(
        new Error(`Currency not supported. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`),
      );
    }

    return Result.ok(undefined);
  }
}

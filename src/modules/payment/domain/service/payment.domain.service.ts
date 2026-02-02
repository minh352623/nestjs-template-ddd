import { Result } from '../../../../shared/domain/result';

export interface ValidatePaymentInput {
  amount: number;
  currency: string;
}

/**
 * Payment Domain Service Interface
 */
export abstract class PaymentDomainService {
  abstract validatePayment(input: ValidatePaymentInput): Promise<Result<void>>;
}

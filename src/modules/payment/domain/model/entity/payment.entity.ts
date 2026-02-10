import { AggregateRoot } from '../../../../../shared/domain/base.entity';
import { Result } from '../../../../../shared/domain/result';

/**
 * Payment Status enum (Domain layer - BP DDD dependency flow)
 * Defined in Domain, re-exported by Application DTO for convenience
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentProps {
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Payment Aggregate Root
 */
export class Payment extends AggregateRoot<string> {
  private _userId: string;
  private _amount: number;
  private _currency: string;
  private _status: PaymentStatus;
  private _description?: string;
  private _createdAt: Date;
  private _updatedAt?: Date;

  private constructor(id: string, props: PaymentProps) {
    super(id);
    this._userId = props.userId;
    this._amount = props.amount;
    this._currency = props.currency;
    this._status = props.status;
    this._description = props.description;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get userId(): string { return this._userId; }
  get amount(): number { return this._amount; }
  get currency(): string { return this._currency; }
  get status(): PaymentStatus { return this._status; }
  get description(): string | undefined { return this._description; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  /**
   * Factory method for creating new payment
   */
  public static create(props: Omit<PaymentProps, 'createdAt'>): Result<Payment> {
    // Validate
    if (props.amount <= 0) {
      return Result.fail(new Error('Amount must be positive'));
    }

    if (!props.currency || props.currency.length !== 3) {
      return Result.fail(new Error('Currency must be 3-letter code'));
    }

    const id = crypto.randomUUID();
    return Result.ok(new Payment(id, {
      ...props,
      createdAt: new Date(),
    }));
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(id: string, props: PaymentProps): Payment {
    return new Payment(id, props);
  }

  /**
   * Complete the payment
   */
  public complete(): Result<void> {
    if (this._status !== PaymentStatus.PENDING) {
      return Result.fail(new Error('Only pending payments can be completed'));
    }
    this._status = PaymentStatus.COMPLETED;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Fail the payment
   */
  public fail(): Result<void> {
    if (this._status !== PaymentStatus.PENDING) {
      return Result.fail(new Error('Only pending payments can fail'));
    }
    this._status = PaymentStatus.FAILED;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }
}

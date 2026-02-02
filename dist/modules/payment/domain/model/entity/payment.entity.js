"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const base_entity_1 = require("../../../../../shared/domain/base.entity");
const result_1 = require("../../../../../shared/domain/result");
const payment_dto_1 = require("../../../application/service/dto/payment.dto");
/**
 * Payment Aggregate Root
 */
class Payment extends base_entity_1.AggregateRoot {
    constructor(id, props) {
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
    get userId() { return this._userId; }
    get amount() { return this._amount; }
    get currency() { return this._currency; }
    get status() { return this._status; }
    get description() { return this._description; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    /**
     * Factory method for creating new payment
     */
    static create(props) {
        // Validate
        if (props.amount <= 0) {
            return result_1.Result.fail(new Error('Amount must be positive'));
        }
        if (!props.currency || props.currency.length !== 3) {
            return result_1.Result.fail(new Error('Currency must be 3-letter code'));
        }
        const id = crypto.randomUUID();
        return result_1.Result.ok(new Payment(id, {
            ...props,
            createdAt: new Date(),
        }));
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(id, props) {
        return new Payment(id, props);
    }
    /**
     * Complete the payment
     */
    complete() {
        if (this._status !== payment_dto_1.PaymentStatus.PENDING) {
            return result_1.Result.fail(new Error('Only pending payments can be completed'));
        }
        this._status = payment_dto_1.PaymentStatus.COMPLETED;
        this._updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    /**
     * Fail the payment
     */
    fail() {
        if (this._status !== payment_dto_1.PaymentStatus.PENDING) {
            return result_1.Result.fail(new Error('Only pending payments can fail'));
        }
        this._status = payment_dto_1.PaymentStatus.FAILED;
        this._updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
}
exports.Payment = Payment;
//# sourceMappingURL=payment.entity.js.map
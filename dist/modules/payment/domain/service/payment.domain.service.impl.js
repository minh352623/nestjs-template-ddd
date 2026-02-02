"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentDomainServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const SUPPORTED_CURRENCIES = ['USD', 'VND', 'EUR', 'GBP'];
const MAX_PAYMENT_AMOUNT = 10000000; // 10 million
/**
 * Payment Domain Service Implementation
 */
let PaymentDomainServiceImpl = class PaymentDomainServiceImpl {
    async validatePayment(input) {
        // Validate amount
        if (input.amount <= 0) {
            return result_1.Result.fail(new Error('Amount must be positive'));
        }
        if (input.amount > MAX_PAYMENT_AMOUNT) {
            return result_1.Result.fail(new Error(`Amount exceeds maximum limit of ${MAX_PAYMENT_AMOUNT}`));
        }
        // Validate currency
        if (!SUPPORTED_CURRENCIES.includes(input.currency.toUpperCase())) {
            return result_1.Result.fail(new Error(`Currency not supported. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`));
        }
        return result_1.Result.ok(undefined);
    }
};
exports.PaymentDomainServiceImpl = PaymentDomainServiceImpl;
exports.PaymentDomainServiceImpl = PaymentDomainServiceImpl = __decorate([
    (0, common_1.Injectable)()
], PaymentDomainServiceImpl);
//# sourceMappingURL=payment.domain.service.impl.js.map
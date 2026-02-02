"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentHandler = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../../application/service/payment.service");
const payment_dto_1 = require("../dto/payment.dto");
/**
 * Payment HTTP Handler
 */
let PaymentHandler = class PaymentHandler {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async createPayment(request) {
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
    async getPayment(id) {
        const result = await this.paymentService.getPaymentById(id);
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
    async getPaymentsByUser(userId) {
        const result = await this.paymentService.getPaymentsByUserId(userId);
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
};
exports.PaymentHandler = PaymentHandler;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentRequest]),
    __metadata("design:returntype", Promise)
], PaymentHandler.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentHandler.prototype, "getPayment", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentHandler.prototype, "getPaymentsByUser", null);
exports.PaymentHandler = PaymentHandler = __decorate([
    (0, common_1.Controller)('payments'),
    __param(0, (0, common_1.Inject)(payment_service_1.PaymentService)),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentHandler);
//# sourceMappingURL=payment.handler.js.map
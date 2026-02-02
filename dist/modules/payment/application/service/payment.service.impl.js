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
exports.PaymentServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const payment_dto_1 = require("./dto/payment.dto");
const result_1 = require("../../../../shared/domain/result");
const payment_repository_1 = require("../../domain/repository/payment.repository");
const payment_domain_service_1 = require("../../domain/service/payment.domain.service");
const payment_entity_1 = require("../../domain/model/entity/payment.entity");
// ✅ Import Interface từ DOMAIN layer (tuân thủ DIP)
// Application → Domain (OK) ✓
const ports_1 = require("../../domain/ports");
/**
 * Payment Application Service Implementation
 *
 * Sử dụng Interface + Adapter Pattern để giao tiếp với User module:
 *
 * - Inject IUserRepositoryPort (interface)
 * - KHÔNG biết implementation là LocalAdapter hay HTTPAdapter
 * - Business logic KHÔNG cần thay đổi khi chuyển Microservice
 */
let PaymentServiceImpl = class PaymentServiceImpl {
    constructor(paymentRepository, paymentDomainService, externalUserPort) {
        this.paymentRepository = paymentRepository;
        this.paymentDomainService = paymentDomainService;
        this.externalUserPort = externalUserPort;
    }
    async createPayment(input) {
        // 1. Lấy user data qua adapter (không biết là local hay HTTP call)
        const userResult = await this.externalUserPort.findById(input.userId);
        if (userResult.isFailure) {
            return result_1.Result.fail(new Error(`User not found: ${input.userId}`));
        }
        const user = userResult.value;
        // 2. Validate payment với domain service
        const validationResult = await this.paymentDomainService.validatePayment({
            amount: input.amount,
            currency: input.currency,
        });
        if (validationResult.isFailure) {
            return result_1.Result.fail(validationResult.error);
        }
        // 3. Tạo payment entity
        const paymentResult = payment_entity_1.Payment.create({
            userId: input.userId,
            amount: input.amount,
            currency: input.currency,
            description: input.description,
            status: payment_dto_1.PaymentStatus.PENDING,
        });
        if (paymentResult.isFailure) {
            return result_1.Result.fail(paymentResult.error);
        }
        const payment = paymentResult.value;
        // 4. Persist payment
        await this.paymentRepository.save(payment);
        // 5. Return output với user info
        return result_1.Result.ok({
            id: payment.id,
            userId: payment.userId,
            userName: user.name, // ✨ Data từ User module qua adapter
            userEmail: user.email, // ✨ Data từ User module qua adapter
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            createdAt: payment.createdAt,
        });
    }
    async getPaymentById(id) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment) {
            return result_1.Result.fail(new Error(`Payment not found: ${id}`));
        }
        // Lấy user info qua adapter
        const userResult = await this.externalUserPort.findById(payment.userId);
        const user = userResult.isSuccess ? userResult.value : null;
        return result_1.Result.ok({
            id: payment.id,
            userId: payment.userId,
            userName: user?.name ?? 'Unknown',
            userEmail: user?.email ?? 'Unknown',
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            createdAt: payment.createdAt,
        });
    }
    async getPaymentsByUserId(userId) {
        // Kiểm tra user tồn tại qua adapter
        const userExists = await this.externalUserPort.exists(userId);
        if (!userExists) {
            return result_1.Result.fail(new Error(`User not found: ${userId}`));
        }
        const payments = await this.paymentRepository.findByUserId(userId);
        const userResult = await this.externalUserPort.findById(userId);
        const user = userResult.isSuccess ? userResult.value : null;
        const outputs = payments.map((payment) => ({
            id: payment.id,
            userId: payment.userId,
            userName: user?.name ?? 'Unknown',
            userEmail: user?.email ?? 'Unknown',
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            createdAt: payment.createdAt,
        }));
        return result_1.Result.ok(outputs);
    }
};
exports.PaymentServiceImpl = PaymentServiceImpl;
exports.PaymentServiceImpl = PaymentServiceImpl = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payment_repository_1.PaymentRepository)),
    __param(1, (0, common_1.Inject)(payment_domain_service_1.PaymentDomainService)),
    __param(2, (0, common_1.Inject)(ports_1.EXTERNAL_USER_PORT)),
    __metadata("design:paramtypes", [payment_repository_1.PaymentRepository,
        payment_domain_service_1.PaymentDomainService, Object])
], PaymentServiceImpl);
//# sourceMappingURL=payment.service.impl.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
// Import UserModule để lấy UserRepository
const user_module_1 = require("../user/user.module");
// Controller
const payment_handler_1 = require("./controller/http/payment.handler");
// Application
const payment_service_1 = require("./application/service/payment.service");
const payment_service_impl_1 = require("./application/service/payment.service.impl");
// Domain - ✅ Interfaces (Ports) nằm trong Domain layer
const payment_repository_1 = require("./domain/repository/payment.repository");
const payment_domain_service_1 = require("./domain/service/payment.domain.service");
const payment_domain_service_impl_1 = require("./domain/service/payment.domain.service.impl");
const ports_1 = require("./domain/ports");
// Infrastructure - ✅ Implementations (Adapters) nằm trong Infrastructure layer
const payment_repository_2 = require("./infrastructure/persistence/repository/payment.repository");
const external_1 = require("./infrastructure/external");
// Core
const prisma_service_1 = require("../../core/prisma.service");
/**
 * Payment Module
 *
 * Ví dụ module sử dụng Interface + Adapter Pattern để giao tiếp với User module.
 *
 * MONOLITH (hiện tại):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌───────────────┐  interface  ┌──────────────┐  import  ┌────────────┐ │
 * │  │PaymentService │◄───────────►│LocalAdapter  │◄────────►│   User     │ │
 * │  │               │             │(direct call) │          │ Repository │ │
 * │  └───────────────┘             └──────────────┘          └────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * MICROSERVICE (sau khi tách):
 * - Đổi UserRepositoryLocalAdapter → UserRepositoryHttpAdapter
 * - PaymentService KHÔNG cần thay đổi code
 */
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule, // Import để lấy UserRepository (Monolith)
        ],
        controllers: [payment_handler_1.PaymentHandler],
        providers: [
            // Infrastructure
            prisma_service_1.PrismaService,
            // Repository binding
            {
                provide: payment_repository_1.PaymentRepository,
                useClass: payment_repository_2.PrismaPaymentRepository,
            },
            // Domain Service binding
            {
                provide: payment_domain_service_1.PaymentDomainService,
                useClass: payment_domain_service_impl_1.PaymentDomainServiceImpl,
            },
            // Application Service binding
            {
                provide: payment_service_1.PaymentService,
                useClass: payment_service_impl_1.PaymentServiceImpl,
            },
            // ============================================
            // External Adapter - Giao tiếp với User module
            // ============================================
            // 
            // MONOLITH: Dùng LocalAdapter (wrap trực tiếp UserRepository)
            {
                provide: ports_1.EXTERNAL_USER_PORT,
                useClass: external_1.UserRepositoryLocalAdapter,
            },
            //
            // MICROSERVICE: Uncomment để dùng HTTPAdapter (gọi User Service API)
            // {
            //   provide: EXTERNAL_USER_PORT,
            //   useClass: UserRepositoryHttpAdapter,
            // },
        ],
        exports: [payment_service_1.PaymentService],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map
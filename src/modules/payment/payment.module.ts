import { Module } from '@nestjs/common';

// Import UserModule để lấy UserRepository
import { UserModule } from '../user/user.module';

// Controller
import { PaymentHandler } from './controller/http/payment.handler';

// Application
import { PaymentService } from './application/service/payment.service';
import { PaymentServiceImpl } from './application/service/payment.service.impl';

// Domain - ✅ Interfaces (Ports) nằm trong Domain layer
import { PaymentRepository } from './domain/repository/payment.repository';
import { PaymentDomainService } from './domain/service/payment.domain.service';
import { PaymentDomainServiceImpl } from './domain/service/payment.domain.service.impl';
import { EXTERNAL_USER_PORT } from './domain/ports';

// Infrastructure - ✅ Implementations (Adapters) nằm trong Infrastructure layer
import { PrismaPaymentRepository } from './infrastructure/persistence/repository/payment.repository';
import {
  UserRepositoryLocalAdapter,
  // UserRepositoryHttpAdapter,  // Dùng khi tách Microservice
} from './infrastructure/external';

// Core
import { PrismaService } from '../../core/prisma.service';

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
@Module({
  imports: [
    UserModule, // Import để lấy UserRepository (Monolith)
  ],
  controllers: [PaymentHandler],
  providers: [
    // Infrastructure
    PrismaService,

    // Repository binding
    {
      provide: PaymentRepository,
      useClass: PrismaPaymentRepository,
    },

    // Domain Service binding
    {
      provide: PaymentDomainService,
      useClass: PaymentDomainServiceImpl,
    },

    // Application Service binding
    {
      provide: PaymentService,
      useClass: PaymentServiceImpl,
    },

    // ============================================
    // External Adapter - Giao tiếp với User module
    // ============================================
    // 
    // MONOLITH: Dùng LocalAdapter (wrap trực tiếp UserRepository)
    {
      provide: EXTERNAL_USER_PORT,
      useClass: UserRepositoryLocalAdapter,
    },
    //
    // MICROSERVICE: Uncomment để dùng HTTPAdapter (gọi User Service API)
    // {
    //   provide: EXTERNAL_USER_PORT,
    //   useClass: UserRepositoryHttpAdapter,
    // },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}

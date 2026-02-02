import { Module } from '@nestjs/common';

// Controller
import { UserHandler } from './controller/http/user.handler';

// Application
import { UserService } from './application/service/user.service';
import { UserServiceImpl } from './application/service/user.service.impl';

// Domain
import { UserRepository } from './domain/repository/user.repository';
import { UserDomainService } from './domain/service/user.domain.service';
import { UserDomainServiceImpl } from './domain/service/user.domain.service.impl';

// Infrastructure
import { PrismaUserRepository } from './infrastructure/persistence/repository/user.repository';

// Core
import { PrismaService } from '../../core/prisma.service';

/**
 * User Module
 * Wires up all dependencies following DDD principles
 * 
 * Exports UserRepository để các module khác có thể sử dụng
 * thông qua Interface + Adapter Pattern
 */
@Module({
  controllers: [UserHandler],
  providers: [
    // Infrastructure
    PrismaService,

    // Repository binding
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },

    // Domain Service binding
    {
      provide: UserDomainService,
      useClass: UserDomainServiceImpl,
    },

    // Application Service binding
    {
      provide: UserService,
      useClass: UserServiceImpl,
    },
  ],
  exports: [
    UserService,
    UserRepository, // ✨ Export để module khác có thể wrap bằng LocalAdapter
  ],
})
export class UserModule {}

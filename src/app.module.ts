import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { DomainExceptionFilter, AllExceptionsFilter } from './shared/presentation';

/**
 * Root Application Module
 * Configures global filters and imports feature modules
 */
@Module({
  imports: [UserModule],
  providers: [
    // Global exception filters (order matters - more specific first)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}

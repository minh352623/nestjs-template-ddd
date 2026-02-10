import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DomainExceptionFilter, AllExceptionsFilter, ResponseInterceptor } from './shared/presentation';
import { validate } from './core/config/env.validation';

/**
 * Root Application Module
 * Configures global filters, interceptors, and imports feature modules
 */
@Module({
  imports: [
    // Config (BP §8.1) - validate env on startup
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    // Rate Limiting (BP §9.2)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Feature Modules
    UserModule,
    PaymentModule,
  ],
  providers: [
     {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    // Global exception filters (order matters - more specific first)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response interceptor (BP §11.1)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}

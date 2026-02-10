import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  BusinessRuleViolationException,
  BusinessException,
  ValidationException,
  ConflictException,
} from '../../domain/exceptions/domain.exception';

/**
 * Global exception filter for domain exceptions
 * Maps domain exceptions to appropriate HTTP responses
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  // Map business error codes to HTTP status (BP §3.3)
  private readonly codeStatusMap: Record<string, HttpStatus> = {
    USER_NOT_FOUND: HttpStatus.NOT_FOUND,
    EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
    INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
    BALANCE_NOT_ENOUGH: HttpStatus.UNPROCESSABLE_ENTITY,
    ORDER_ALREADY_PAID: HttpStatus.UNPROCESSABLE_ENTITY,
    PAYMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  };

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.mapExceptionToStatus(exception);
    const body = this.buildResponseBody(exception, request);

    this.logger.warn(`Domain exception: ${exception.code} - ${exception.message}`);

    response.status(status).json(body);
  }

  private mapExceptionToStatus(exception: DomainException): number {
    // 1. Check code-based mapping first (for BusinessException)
    if (this.codeStatusMap[exception.code]) {
      return this.codeStatusMap[exception.code];
    }

    // 2. Fallback to class-based mapping
    if (exception instanceof EntityNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ConflictException) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ValidationException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof BusinessRuleViolationException) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    return HttpStatus.BAD_REQUEST;
  }

  private buildResponseBody(exception: DomainException, request: Request): object {
    const base = {
      code: exception.code,
      message: exception.message,
      details: exception.details || null,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof ValidationException) {
      return {
        ...base,
        errors: exception.errors,
      };
    }

    return base;
  }
}

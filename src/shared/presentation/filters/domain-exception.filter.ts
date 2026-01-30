import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  BusinessRuleViolationException,
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

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.mapExceptionToStatus(exception);
    const body = this.buildResponseBody(exception);

    this.logger.warn(`Domain exception: ${exception.code} - ${exception.message}`);

    response.status(status).json(body);
  }

  private mapExceptionToStatus(exception: DomainException): number {
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
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildResponseBody(exception: DomainException): object {
    const base = {
      code: exception.code,
      message: exception.message,
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

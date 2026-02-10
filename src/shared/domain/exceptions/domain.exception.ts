/**
 * Base Domain Exception
 * All domain-specific exceptions should extend this class
 */
export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Exception thrown when an entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, identifier: string) {
    super(`${entityName} with identifier '${identifier}' was not found`, 'ENTITY_NOT_FOUND');
  }
}

/**
 * Exception thrown when a business rule is violated
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationException extends DomainException {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed', 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Exception thrown when there's a conflict (e.g., duplicate entry)
 */
export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

/**
 * Generic Business Exception with custom error code (BP §3.2)
 * Use for business logic errors that don't fit into specific exception types
 */
export class BusinessException extends DomainException {
  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message, code, details);
  }
}

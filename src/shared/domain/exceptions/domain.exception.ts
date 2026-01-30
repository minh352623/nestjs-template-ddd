/**
 * Base Domain Exception
 * All domain-specific exceptions should extend this class
 */
export abstract class DomainException extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
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

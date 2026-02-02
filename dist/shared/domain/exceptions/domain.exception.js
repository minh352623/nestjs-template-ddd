"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictException = exports.ValidationException = exports.BusinessRuleViolationException = exports.EntityNotFoundException = exports.DomainException = void 0;
/**
 * Base Domain Exception
 * All domain-specific exceptions should extend this class
 */
class DomainException extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DomainException = DomainException;
/**
 * Exception thrown when an entity is not found
 */
class EntityNotFoundException extends DomainException {
    constructor(entityName, identifier) {
        super(`${entityName} with identifier '${identifier}' was not found`, 'ENTITY_NOT_FOUND');
    }
}
exports.EntityNotFoundException = EntityNotFoundException;
/**
 * Exception thrown when a business rule is violated
 */
class BusinessRuleViolationException extends DomainException {
    constructor(message) {
        super(message, 'BUSINESS_RULE_VIOLATION');
    }
}
exports.BusinessRuleViolationException = BusinessRuleViolationException;
/**
 * Exception thrown when validation fails
 */
class ValidationException extends DomainException {
    constructor(errors) {
        super('Validation failed', 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationException = ValidationException;
/**
 * Exception thrown when there's a conflict (e.g., duplicate entry)
 */
class ConflictException extends DomainException {
    constructor(message) {
        super(message, 'CONFLICT');
    }
}
exports.ConflictException = ConflictException;
//# sourceMappingURL=domain.exception.js.map
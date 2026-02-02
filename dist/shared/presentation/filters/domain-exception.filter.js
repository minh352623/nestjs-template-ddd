"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DomainExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const domain_exception_1 = require("../../domain/exceptions/domain.exception");
/**
 * Global exception filter for domain exceptions
 * Maps domain exceptions to appropriate HTTP responses
 */
let DomainExceptionFilter = DomainExceptionFilter_1 = class DomainExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(DomainExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = this.mapExceptionToStatus(exception);
        const body = this.buildResponseBody(exception);
        this.logger.warn(`Domain exception: ${exception.code} - ${exception.message}`);
        response.status(status).json(body);
    }
    mapExceptionToStatus(exception) {
        if (exception instanceof domain_exception_1.EntityNotFoundException) {
            return common_1.HttpStatus.NOT_FOUND;
        }
        if (exception instanceof domain_exception_1.ConflictException) {
            return common_1.HttpStatus.CONFLICT;
        }
        if (exception instanceof domain_exception_1.ValidationException) {
            return common_1.HttpStatus.BAD_REQUEST;
        }
        if (exception instanceof domain_exception_1.BusinessRuleViolationException) {
            return common_1.HttpStatus.UNPROCESSABLE_ENTITY;
        }
        return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
    buildResponseBody(exception) {
        const base = {
            code: exception.code,
            message: exception.message,
            timestamp: new Date().toISOString(),
        };
        if (exception instanceof domain_exception_1.ValidationException) {
            return {
                ...base,
                errors: exception.errors,
            };
        }
        return base;
    }
};
exports.DomainExceptionFilter = DomainExceptionFilter;
exports.DomainExceptionFilter = DomainExceptionFilter = DomainExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(domain_exception_1.DomainException)
], DomainExceptionFilter);
//# sourceMappingURL=domain-exception.filter.js.map
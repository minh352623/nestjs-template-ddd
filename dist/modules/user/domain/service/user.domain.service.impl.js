"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDomainServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const user_domain_service_1 = require("./user.domain.service");
const user_repository_1 = require("../repository/user.repository");
const result_1 = require("../../../../shared/domain/result");
const domain_exception_1 = require("../../../../shared/domain/exceptions/domain.exception");
/**
 * User Domain Service Implementation
 */
let UserDomainServiceImpl = class UserDomainServiceImpl extends user_domain_service_1.UserDomainService {
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
    }
    async isEmailUnique(email, excludeUserId) {
        const exists = await this.userRepository.existsByEmail(email, excludeUserId);
        return !exists;
    }
    async validateUserCreation(email) {
        const isUnique = await this.isEmailUnique(email);
        if (!isUnique) {
            return result_1.Result.fail(new domain_exception_1.ConflictException('Email is already in use'));
        }
        return result_1.Result.ok(undefined);
    }
    async hashPassword(password) {
        // In production, use bcrypt
        // return bcrypt.hash(password, 10);
        return `hashed:${password}`;
    }
    async verifyPassword(plainPassword, hashedPassword) {
        // In production, use bcrypt
        // return bcrypt.compare(plainPassword, hashedPassword);
        return hashedPassword === `hashed:${plainPassword}`;
    }
};
exports.UserDomainServiceImpl = UserDomainServiceImpl;
exports.UserDomainServiceImpl = UserDomainServiceImpl = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], UserDomainServiceImpl);
//# sourceMappingURL=user.domain.service.impl.js.map
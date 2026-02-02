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
exports.UserServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const result_1 = require("../../../../shared/domain/result");
const domain_exception_1 = require("../../../../shared/domain/exceptions/domain.exception");
const user_entity_1 = require("../../domain/model/entity/user.entity");
const user_repository_1 = require("../../domain/repository/user.repository");
const user_domain_service_1 = require("../../domain/service/user.domain.service");
/**
 * User Application Service Implementation
 * Orchestrates use cases by coordinating domain objects
 */
let UserServiceImpl = class UserServiceImpl extends user_service_1.UserService {
    constructor(userRepository, userDomainService) {
        super();
        this.userRepository = userRepository;
        this.userDomainService = userDomainService;
    }
    async createUser(input) {
        // Validate email uniqueness
        const validationResult = await this.userDomainService.validateUserCreation(input.email);
        if (validationResult.isFailure) {
            return result_1.Result.fail(validationResult.error);
        }
        // Create user entity
        const userResult = user_entity_1.User.create({
            email: input.email,
            name: input.name,
            password: input.password,
        });
        if (userResult.isFailure) {
            return result_1.Result.fail(userResult.error);
        }
        const user = userResult.value;
        // Hash password
        const hashedPassword = await this.userDomainService.hashPassword(input.password);
        user.updatePassword(hashedPassword);
        // Persist
        await this.userRepository.save(user);
        return result_1.Result.ok(this.toOutput(user));
    }
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return result_1.Result.fail(new domain_exception_1.EntityNotFoundException('User', id));
        }
        return result_1.Result.ok(this.toOutput(user));
    }
    async getUsers(input) {
        const users = await this.userRepository.findAll({
            limit: input.limit ?? 10,
            offset: input.offset ?? 0,
        });
        return result_1.Result.ok({
            users: users.map((user) => this.toOutput(user)),
        });
    }
    async updateUser(id, input) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return result_1.Result.fail(new domain_exception_1.EntityNotFoundException('User', id));
        }
        // Update email if provided
        if (input.email && input.email !== user.email) {
            const isUnique = await this.userDomainService.isEmailUnique(input.email, id);
            if (!isUnique) {
                return result_1.Result.fail(new domain_exception_1.ConflictException('Email is already in use'));
            }
            const emailResult = user.updateEmail(input.email);
            if (emailResult.isFailure) {
                return result_1.Result.fail(emailResult.error);
            }
        }
        // Update name if provided
        if (input.name) {
            const nameResult = user.updateName(input.name);
            if (nameResult.isFailure) {
                return result_1.Result.fail(nameResult.error);
            }
        }
        // Update password if provided
        if (input.password) {
            const hashedPassword = await this.userDomainService.hashPassword(input.password);
            user.updatePassword(hashedPassword);
        }
        await this.userRepository.save(user);
        return result_1.Result.ok(this.toOutput(user));
    }
    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return result_1.Result.fail(new domain_exception_1.EntityNotFoundException('User', id));
        }
        await this.userRepository.delete(id);
        return result_1.Result.ok(undefined);
    }
    toOutput(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.UserServiceImpl = UserServiceImpl;
exports.UserServiceImpl = UserServiceImpl = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        user_domain_service_1.UserDomainService])
], UserServiceImpl);
//# sourceMappingURL=user.service.impl.js.map
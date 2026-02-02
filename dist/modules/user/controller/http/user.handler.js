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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserHandler = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("../../application/service/user.service");
const user_dto_1 = require("../dto/user.dto");
/**
 * User HTTP Handler
 * Handles HTTP requests and delegates to application service
 */
let UserHandler = class UserHandler {
    constructor(userService) {
        this.userService = userService;
    }
    async create(request) {
        const result = await this.userService.createUser({
            email: request.email,
            name: request.name,
            password: request.password,
        });
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
    async getById(id) {
        const result = await this.userService.getUserById(id);
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
    async list(query) {
        const result = await this.userService.getUsers({
            limit: query.limit,
            offset: query.offset,
        });
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
    async update(id, request) {
        const result = await this.userService.updateUser(id, {
            email: request.email,
            name: request.name,
            password: request.password,
        });
        if (result.isFailure) {
            throw result.error;
        }
        return result.value;
    }
    async delete(id) {
        const result = await this.userService.deleteUser(id);
        if (result.isFailure) {
            throw result.error;
        }
    }
};
exports.UserHandler = UserHandler;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: user_dto_1.UserResponse }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserRequest]),
    __metadata("design:returntype", Promise)
], UserHandler.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserResponse }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserHandler.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List users' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserListResponse }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.PaginationQuery]),
    __metadata("design:returntype", Promise)
], UserHandler.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserResponse }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserRequest]),
    __metadata("design:returntype", Promise)
], UserHandler.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'User deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserHandler.prototype, "delete", null);
exports.UserHandler = UserHandler = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserHandler);
//# sourceMappingURL=user.handler.js.map
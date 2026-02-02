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
exports.UserRepositoryLocalAdapter = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
// ✨ Import TRỰC TIẾP Repository của User module
const user_repository_1 = require("../../../user/domain/repository/user.repository");
/**
 * User Repository Local Adapter
 *
 * MONOLITH: Adapter wrap trực tiếp UserRepository
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                           MONOLITH (Hiện tại)                           │
 * │                                                                          │
 * │  ┌───────────────┐  interface  ┌──────────────┐  import  ┌────────────┐ │
 * │  │PaymentService │◄───────────►│LocalAdapter  │◄────────►│   User     │ │
 * │  │               │             │(direct call) │          │ Repository │ │
 * │  └───────────────┘             └──────────────┘          └────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Khi tách Microservice:
 * - Đổi sang UserRepositoryHttpAdapter
 * - PaymentService KHÔNG cần thay đổi code
 */
let UserRepositoryLocalAdapter = class UserRepositoryLocalAdapter {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            return result_1.Result.fail(new Error(`User not found: ${id}`));
        }
        // Map User Entity -> ExternalUserData (Anti-Corruption Layer)
        const externalUser = {
            id: user.id,
            email: user.email,
            name: user.name,
        };
        return result_1.Result.ok(externalUser);
    }
    async exists(id) {
        const user = await this.userRepository.findById(id);
        return user !== null;
    }
    async findByIds(ids) {
        const userMap = new Map();
        // Trong production, nên optimize với batch query
        const promises = ids.map(async (id) => {
            const result = await this.findById(id);
            if (result.isSuccess) {
                userMap.set(id, result.value);
            }
        });
        await Promise.all(promises);
        return userMap;
    }
};
exports.UserRepositoryLocalAdapter = UserRepositoryLocalAdapter;
exports.UserRepositoryLocalAdapter = UserRepositoryLocalAdapter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_1.UserRepository)),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], UserRepositoryLocalAdapter);
//# sourceMappingURL=user-repository.local-adapter.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
// Controller
const user_handler_1 = require("./controller/http/user.handler");
// Application
const user_service_1 = require("./application/service/user.service");
const user_service_impl_1 = require("./application/service/user.service.impl");
// Domain
const user_repository_1 = require("./domain/repository/user.repository");
const user_domain_service_1 = require("./domain/service/user.domain.service");
const user_domain_service_impl_1 = require("./domain/service/user.domain.service.impl");
// Infrastructure
const user_repository_2 = require("./infrastructure/persistence/repository/user.repository");
// Core
const prisma_service_1 = require("../../core/prisma.service");
/**
 * User Module
 * Wires up all dependencies following DDD principles
 *
 * Exports UserRepository để các module khác có thể sử dụng
 * thông qua Interface + Adapter Pattern
 */
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        controllers: [user_handler_1.UserHandler],
        providers: [
            // Infrastructure
            prisma_service_1.PrismaService,
            // Repository binding
            {
                provide: user_repository_1.UserRepository,
                useClass: user_repository_2.PrismaUserRepository,
            },
            // Domain Service binding
            {
                provide: user_domain_service_1.UserDomainService,
                useClass: user_domain_service_impl_1.UserDomainServiceImpl,
            },
            // Application Service binding
            {
                provide: user_service_1.UserService,
                useClass: user_service_impl_1.UserServiceImpl,
            },
        ],
        exports: [
            user_service_1.UserService,
            user_repository_1.UserRepository, // ✨ Export để module khác có thể wrap bằng LocalAdapter
        ],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map
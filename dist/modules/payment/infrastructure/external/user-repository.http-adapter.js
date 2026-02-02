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
exports.UserRepositoryHttpAdapter = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
/**
 * User Repository HTTP Adapter
 *
 * MICROSERVICE: Adapter gọi User Service qua HTTP API
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                      MICROSERVICES (Sau khi tách)                        │
 * │                                                                          │
 * │  ┌──────────────────────────┐         ┌──────────────────────────┐      │
 * │  │    PAYMENT SERVICE       │         │      USER SERVICE        │      │
 * │  │                          │         │                          │      │
 * │  │ ┌───────────────┐        │  HTTP/  │          ┌────────────┐  │      │
 * │  │ │PaymentService │◄──┐    │  gRPC   │   ┌─────►│   User     │  │      │
 * │  │ └───────────────┘   │    │◄───────►│   │      │ Repository │  │      │
 * │  │                     │    │         │   │      └────────────┘  │      │
 * │  │         interface   │    │         │   │                      │      │
 * │  │              ▼      │    │         │   │                      │      │
 * │  │ ┌──────────────────┐│    │         │   │                      │      │
 * │  │ │ HTTPAdapter      ││    │         │   │                      │      │
 * │  │ │ (API calls)      │├────┼─────────┼───┘                      │      │
 * │  │ └──────────────────┘│    │         │                          │      │
 * │  └─────────────────────┴────┘         └──────────────────────────┘      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Cấu hình:
 * - USER_SERVICE_URL: URL của User Service (e.g., http://user-service:3001)
 * - USER_SERVICE_TIMEOUT: Timeout in milliseconds
 */
let UserRepositoryHttpAdapter = class UserRepositoryHttpAdapter {
    constructor() {
        this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
        this.timeout = parseInt(process.env.USER_SERVICE_TIMEOUT || '5000', 10);
    }
    async findById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(this.timeout),
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return result_1.Result.fail(new Error(`User not found: ${id}`));
                }
                return result_1.Result.fail(new Error(`Failed to fetch user: ${response.statusText}`));
            }
            const data = await response.json();
            return result_1.Result.ok(data);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[UserRepositoryHttpAdapter] Failed to fetch user ${id}:`, message);
            return result_1.Result.fail(new Error('Failed to fetch user from User Service'));
        }
    }
    async exists(id) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${id}`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(this.timeout),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async findByIds(ids) {
        const userMap = new Map();
        try {
            // Thử batch endpoint trước
            const response = await fetch(`${this.baseUrl}/users/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
                signal: AbortSignal.timeout(this.timeout),
            });
            if (response.ok) {
                const users = await response.json();
                for (const user of users) {
                    userMap.set(user.id, user);
                }
                return userMap;
            }
        }
        catch {
            // Fallback to individual requests
        }
        // Fallback: fetch từng user
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
exports.UserRepositoryHttpAdapter = UserRepositoryHttpAdapter;
exports.UserRepositoryHttpAdapter = UserRepositoryHttpAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UserRepositoryHttpAdapter);
//# sourceMappingURL=user-repository.http-adapter.js.map
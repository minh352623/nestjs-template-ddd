"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_USER_PORT = void 0;
/**
 * External User Repository Port (Interface)
 *
 * Interface định nghĩa contract để Payment module lấy data từ User
 *
 * ✅ Tuân thủ Dependency Inversion Principle (DIP):
 *
 * Controller → Application → Domain ← Infrastructure
 *                   ↑           ↑
 *             (depends on)  (implements)
 *
 * Pattern: Port & Adapter (Hexagonal Architecture)
 * - Port (Interface): Đặt trong DOMAIN layer
 * - Adapter (Implementation): Đặt trong INFRASTRUCTURE layer
 *   - LocalAdapter: wrap trực tiếp UserRepository (Monolith)
 *   - HTTPAdapter: gọi User Service API (Microservice)
 */
exports.EXTERNAL_USER_PORT = Symbol('EXTERNAL_USER_PORT');
//# sourceMappingURL=external-user.port.js.map
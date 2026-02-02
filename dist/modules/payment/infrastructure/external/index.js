"use strict";
/**
 * External Adapters
 *
 * Chứa các Adapters (implementations) để giao tiếp với modules/services khác
 *
 * ✅ Tuân thủ Dependency Inversion Principle (DIP):
 * - Interfaces (Ports) nằm trong DOMAIN layer: domain/ports/
 * - Implementations (Adapters) nằm trong INFRASTRUCTURE layer: infrastructure/external/
 *
 * Pattern: Port & Adapter (Hexagonal Architecture)
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    DEPENDENCY FLOW                          │
 * │                                                              │
 * │   Controller → Application → Domain ← Infrastructure        │
 * │                     ↑           ↑                            │
 * │               (depends on) (implements)                      │
 * │                                                              │
 * │   - Application import interface từ Domain                  │
 * │   - Infrastructure implement interface từ Domain            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Trong Monolith:
 *   - LocalAdapter import trực tiếp Repository của module khác
 *
 * Trong Microservices:
 *   - HTTPAdapter gọi API của service khác
 *   - Chỉ cần đổi 1 dòng trong module.ts
 *   - Business logic KHÔNG cần thay đổi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryHttpAdapter = exports.UserRepositoryLocalAdapter = void 0;
// Adapters (Implementations) - infrastructure layer implements domain interfaces
var user_repository_local_adapter_1 = require("./user-repository.local-adapter");
Object.defineProperty(exports, "UserRepositoryLocalAdapter", { enumerable: true, get: function () { return user_repository_local_adapter_1.UserRepositoryLocalAdapter; } });
var user_repository_http_adapter_1 = require("./user-repository.http-adapter");
Object.defineProperty(exports, "UserRepositoryHttpAdapter", { enumerable: true, get: function () { return user_repository_http_adapter_1.UserRepositoryHttpAdapter; } });
//# sourceMappingURL=index.js.map
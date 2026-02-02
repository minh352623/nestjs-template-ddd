"use strict";
/**
 * Domain Ports
 *
 * Chứa các interfaces (ports) cho cả internal và external communication
 *
 * Tuân thủ Dependency Inversion Principle (DIP):
 * - Application layer DEPENDS ON domain ports
 * - Infrastructure layer IMPLEMENTS domain ports
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    DEPENDENCY FLOW                          │
 * │                                                              │
 * │   Controller → Application → Domain ← Infrastructure        │
 * │                     ↑           ↑                            │
 * │               (depends on) (implements)                      │
 * │                                                              │
 * │   Domain layer KHÔNG phụ thuộc vào layer nào khác           │
 * │   Các layer khác đều phụ thuộc vào Domain                   │
 * └─────────────────────────────────────────────────────────────┘
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_USER_PORT = void 0;
// External ports - giao tiếp với bounded contexts khác
var external_user_port_1 = require("./external-user.port");
Object.defineProperty(exports, "EXTERNAL_USER_PORT", { enumerable: true, get: function () { return external_user_port_1.EXTERNAL_USER_PORT; } });
//# sourceMappingURL=index.js.map
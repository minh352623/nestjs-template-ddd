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

// External ports - giao tiếp với bounded contexts khác
export {
  EXTERNAL_USER_PORT,
  IExternalUserPort,
  ExternalUserData,
} from './external-user.port';

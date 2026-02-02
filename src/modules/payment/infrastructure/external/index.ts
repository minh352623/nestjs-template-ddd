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

// Adapters (Implementations) - infrastructure layer implements domain interfaces
export { UserRepositoryLocalAdapter } from './user-repository.local-adapter';
export { UserRepositoryHttpAdapter } from './user-repository.http-adapter';

import { Result } from '../../../../shared/domain/result';

/**
 * External User Data Interface
 * 
 * Định nghĩa data mà PaymentModule cần từ User
 * Đây là Anti-Corruption Layer - chỉ expose những gì cần thiết
 * 
 * ✅ Đặt trong Domain layer để tuân thủ DIP:
 * - Application layer import từ Domain (OK)
 * - Infrastructure layer implement interface từ Domain (OK)
 */
export interface ExternalUserData {
  id: string;
  email: string;
  name: string;
}

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
export const EXTERNAL_USER_PORT = Symbol('EXTERNAL_USER_PORT');

export interface IExternalUserPort {
  /**
   * Tìm user theo ID
   */
  findById(id: string): Promise<Result<ExternalUserData>>;

  /**
   * Kiểm tra user tồn tại
   */
  exists(id: string): Promise<boolean>;

  /**
   * Tìm nhiều users theo IDs
   */
  findByIds(ids: string[]): Promise<Map<string, ExternalUserData>>;
}

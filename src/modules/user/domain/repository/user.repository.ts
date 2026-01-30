import { User } from '../model/entity/user.entity';

/**
 * User Repository Interface
 * Defines the contract for user persistence operations
 */
export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(params?: { limit?: number; offset?: number }): Promise<User[]>;
  abstract delete(id: string): Promise<void>;
  abstract existsByEmail(email: string, excludeUserId?: string): Promise<boolean>;
}

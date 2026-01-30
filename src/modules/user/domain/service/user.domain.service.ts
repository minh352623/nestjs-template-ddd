import { User } from '../model/entity/user.entity';
import { Result } from '../../../../shared/domain/result';

/**
 * User Domain Service Interface
 * Handles domain logic that doesn't belong to a single entity
 */
export abstract class UserDomainService {
  /**
   * Check if email is unique
   */
  abstract isEmailUnique(email: string, excludeUserId?: string): Promise<boolean>;

  /**
   * Validate user can be created
   */
  abstract validateUserCreation(email: string): Promise<Result<void>>;

  /**
   * Hash password
   */
  abstract hashPassword(password: string): Promise<string>;

  /**
   * Verify password
   */
  abstract verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

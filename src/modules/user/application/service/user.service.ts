import { Result } from '../../../../shared/domain/result';
import {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
  UserOutput,
  UserListOutput,
} from './dto/user.dto';

/**
 * User Application Service Interface
 * Defines the use cases for user management
 */
export abstract class UserService {
  abstract createUser(input: CreateUserInput): Promise<Result<UserOutput>>;
  abstract getUserById(id: string): Promise<Result<UserOutput>>;
  abstract getUsers(input: ListUsersInput): Promise<Result<UserListOutput>>;
  abstract updateUser(id: string, input: UpdateUserInput): Promise<Result<UserOutput>>;
  abstract deleteUser(id: string): Promise<Result<void>>;
}

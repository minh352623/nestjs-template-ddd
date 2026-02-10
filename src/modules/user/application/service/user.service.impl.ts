import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { Result } from '../../../../shared/domain/result';
import {
  EntityNotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/domain.exception';
import { User } from '../../domain/model/entity/user.entity';
import { UserRepository } from '../../domain/repository/user.repository';
import { UserDomainService } from '../../domain/service/user.domain.service';
import {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
  UserOutput,
  UserListOutput,
} from './dto/user.dto';

/**
 * User Application Service Implementation
 * Orchestrates use cases by coordinating domain objects
 */
@Injectable()
export class UserServiceImpl extends UserService {
  private readonly logger = new Logger(UserServiceImpl.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDomainService: UserDomainService,
  ) {
    super();
  }

  async createUser(input: CreateUserInput): Promise<Result<UserOutput>> {
    // Validate email uniqueness
    const validationResult = await this.userDomainService.validateUserCreation(input.email);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // Create user entity
    const userResult = User.create({
      email: input.email,
      name: input.name,
      password: input.password,
    });

    if (userResult.isFailure) {
      return Result.fail(userResult.error);
    }

    const user = userResult.value;

    // Hash password
    const hashedPassword = await this.userDomainService.hashPassword(input.password);
    user.updatePassword(hashedPassword);

    // Persist
    await this.userRepository.save(user);
    this.logger.log(`User created: ${user.id}`);

    return Result.ok(this.toOutput(user));
  }

  async getUserById(id: string): Promise<Result<UserOutput>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return Result.fail(new EntityNotFoundException('User', id));
    }

    return Result.ok(this.toOutput(user));
  }

  async getUsers(input: ListUsersInput): Promise<Result<UserListOutput>> {
    const users = await this.userRepository.findAll({
      limit: input.limit ?? 10,
      offset: input.offset ?? 0,
    });

    return Result.ok({
      users: users.map((user) => this.toOutput(user)),
    });
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<Result<UserOutput>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return Result.fail(new EntityNotFoundException('User', id));
    }

    // Update email if provided
    if (input.email && input.email !== user.email) {
      const isUnique = await this.userDomainService.isEmailUnique(input.email, id);
      if (!isUnique) {
        return Result.fail(new ConflictException('Email is already in use'));
      }

      const emailResult = user.updateEmail(input.email);
      if (emailResult.isFailure) {
        return Result.fail(emailResult.error);
      }
    }

    // Update name if provided
    if (input.name) {
      const nameResult = user.updateName(input.name);
      if (nameResult.isFailure) {
        return Result.fail(nameResult.error);
      }
    }

    // Update password if provided
    if (input.password) {
      const hashedPassword = await this.userDomainService.hashPassword(input.password);
      user.updatePassword(hashedPassword);
    }

    await this.userRepository.save(user);
    this.logger.log(`User updated: ${user.id}`);

    return Result.ok(this.toOutput(user));
  }

  async deleteUser(id: string): Promise<Result<void>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return Result.fail(new EntityNotFoundException('User', id));
    }

    await this.userRepository.delete(id);
    this.logger.log(`User deleted: ${id}`);

    return Result.ok(undefined);
  }

  private toOutput(user: User): UserOutput {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserDomainService } from './user.domain.service';
import { UserRepository } from '../repository/user.repository';
import { Result } from '../../../../shared/domain/result';
import { ConflictException } from '../../../../shared/domain/exceptions/domain.exception';

/**
 * User Domain Service Implementation
 */
@Injectable()
export class UserDomainServiceImpl extends UserDomainService {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async isEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    const exists = await this.userRepository.existsByEmail(email, excludeUserId);
    return !exists;
  }

  async validateUserCreation(email: string): Promise<Result<void>> {
    const isUnique = await this.isEmailUnique(email);
    if (!isUnique) {
      return Result.fail(new ConflictException('Email is already in use'));
    }
    return Result.ok(undefined);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

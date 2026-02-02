import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../../shared/domain/result';

// ✅ Import interface từ DOMAIN layer (tuân thủ DIP)
import {
  IExternalUserPort,
  ExternalUserData,
} from '../../domain/ports';

// ✨ Import TRỰC TIẾP Repository của User module
import { UserRepository } from '../../../user/domain/repository/user.repository';

/**
 * User Repository Local Adapter
 * 
 * MONOLITH: Adapter wrap trực tiếp UserRepository
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                           MONOLITH (Hiện tại)                           │
 * │                                                                          │
 * │  ┌───────────────┐  interface  ┌──────────────┐  import  ┌────────────┐ │
 * │  │PaymentService │◄───────────►│LocalAdapter  │◄────────►│   User     │ │
 * │  │               │             │(direct call) │          │ Repository │ │
 * │  └───────────────┘             └──────────────┘          └────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Khi tách Microservice:
 * - Đổi sang UserRepositoryHttpAdapter
 * - PaymentService KHÔNG cần thay đổi code
 */
@Injectable()
export class UserRepositoryLocalAdapter implements IExternalUserPort {
  constructor(
    // ✨ Inject trực tiếp UserRepository từ User module
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async findById(id: string): Promise<Result<ExternalUserData>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return Result.fail(new Error(`User not found: ${id}`));
    }

    // Map User Entity -> ExternalUserData (Anti-Corruption Layer)
    const externalUser: ExternalUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return Result.ok(externalUser);
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    return user !== null;
  }

  async findByIds(ids: string[]): Promise<Map<string, ExternalUserData>> {
    const userMap = new Map<string, ExternalUserData>();

    // Trong production, nên optimize với batch query
    const promises = ids.map(async (id) => {
      const result = await this.findById(id);
      if (result.isSuccess) {
        userMap.set(id, result.value);
      }
    });

    await Promise.all(promises);
    return userMap;
  }
}

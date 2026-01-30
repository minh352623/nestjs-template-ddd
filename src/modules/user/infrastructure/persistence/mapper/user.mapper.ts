import { User } from '../../../domain/model/entity/user.entity';
import { PrismaUserModel } from '../model/user.model';

/**
 * User Mapper
 * Handles conversion between domain entity and persistence model
 */
export class UserMapper {
  /**
   * Convert persistence model to domain entity
   */
  static toDomain(model: PrismaUserModel): User {
    return User.reconstitute({
      id: model.id,
      email: model.email,
      name: model.name,
      password: model.password,
      createdAt: model.createdAt,
    });
  }

  /**
   * Convert domain entity to persistence model
   */
  static toPersistence(entity: User): PrismaUserModel {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      password: entity.password,
      createdAt: entity.createdAt,
    };
  }
}

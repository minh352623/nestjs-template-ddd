import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../core/prisma.service';
import { UserRepository } from '../../../domain/repository/user.repository';
import { User } from '../../../domain/model/entity/user.entity';
import { UserMapper } from '../mapper/user.mapper';

/**
 * Prisma User Repository Implementation
 * Infrastructure adapter for user persistence
 */
@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });

    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return record ? UserMapper.toDomain(record) : null;
  }

  async findAll(params?: { limit?: number; offset?: number }): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      take: params?.limit ?? 10,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(UserMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string, excludeUserId?: string): Promise<boolean> {
    const record = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(excludeUserId && { NOT: { id: excludeUserId } }),
      },
    });

    return !!record;
  }
}

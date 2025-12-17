import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../core/prisma.service";
import { UserRepository } from "../../domain/user.repository";
import { User } from "../../domain/user.entity";
import { PrismaUserMapper } from "./user.mapper";

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: user.password,
        createdAt: user.createdAt,
      },
    });
    return PrismaUserMapper.toDomain(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { email } });
    return found ? PrismaUserMapper.toDomain(found) : null;
  }
}

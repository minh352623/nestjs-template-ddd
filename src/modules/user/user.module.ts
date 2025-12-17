import { Module } from '@nestjs/common'
import { UserController } from './interface-adapters/user.controller'
import { CreateUserUseCase } from './application/create-user.use-case'
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository'
import { PrismaService } from '../../core/prisma.service'
import { UserRepository } from './domain/user.repository'

@Module({
  controllers: [UserController],
  providers: [
    PrismaService,
    { provide: UserRepository, useClass: PrismaUserRepository },
    CreateUserUseCase,
  ],
})
export class UserModule {}


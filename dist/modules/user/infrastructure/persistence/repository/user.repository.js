"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../core/prisma.service");
const user_repository_1 = require("../../../domain/repository/user.repository");
const user_mapper_1 = require("../mapper/user.mapper");
/**
 * Prisma User Repository Implementation
 * Infrastructure adapter for user persistence
 */
let PrismaUserRepository = class PrismaUserRepository extends user_repository_1.UserRepository {
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async save(user) {
        const data = user_mapper_1.UserMapper.toPersistence(user);
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
    async findById(id) {
        const record = await this.prisma.user.findUnique({
            where: { id },
        });
        return record ? user_mapper_1.UserMapper.toDomain(record) : null;
    }
    async findByEmail(email) {
        const record = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        return record ? user_mapper_1.UserMapper.toDomain(record) : null;
    }
    async findAll(params) {
        const records = await this.prisma.user.findMany({
            take: params?.limit ?? 10,
            skip: params?.offset ?? 0,
            orderBy: { createdAt: 'desc' },
        });
        return records.map(user_mapper_1.UserMapper.toDomain);
    }
    async delete(id) {
        await this.prisma.user.delete({
            where: { id },
        });
    }
    async existsByEmail(email, excludeUserId) {
        const record = await this.prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                ...(excludeUserId && { NOT: { id: excludeUserId } }),
            },
        });
        return !!record;
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=user.repository.js.map
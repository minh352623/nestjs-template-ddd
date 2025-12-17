// Prisma Service is an infrastructure concern; it is isolated from domain/application
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {}

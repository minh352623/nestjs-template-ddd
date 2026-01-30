/**
 * User Persistence Model
 * Represents the database schema structure
 */
export interface UserModel {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Prisma User type (matches Prisma schema)
 */
export type PrismaUserModel = {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
};

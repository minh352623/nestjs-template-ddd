import { User } from "../../domain/user.entity";

type PrismaUserModel = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};

export class PrismaUserMapper {
  static toDomain(model: PrismaUserModel): User {
    return new User({
      id: model.id,
      name: model.name,
      email: model.email,
      password: model.password,
      createdAt: model.createdAt,
    });
  }
}

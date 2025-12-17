// Repository interface defines the abstraction boundary; implementations live in infrastructure
import { User } from "./user.entity";

export abstract class UserRepository {
  abstract create(params: { name: string; email: string }): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
}

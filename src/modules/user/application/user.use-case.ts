// Use Cases encapsulate business rules; depend only on domain ports
import { UserRepository } from "../domain/user.repository.interface";
import { CreateUserInput } from "./dtos/create-user.input";
import { UserOutput } from "./dtos/user.output";

// Local mapper keeps Application layer independent from infra models
const toOutput = (u: import("../domain/user.entity").User): UserOutput =>
  new UserOutput(u.id, u.name, u.email.toString(), u.createdAt);

export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already in use");
    }
    const created = await this.userRepo.create({
      name: input.name,
      email: input.email,
    });
    return toOutput(created);
  }
}

export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(id: string): Promise<UserOutput> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return toOutput(user);
  }
}

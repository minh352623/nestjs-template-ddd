import { UserRepository } from "../domain/user.repository";
import { User } from "../domain/user.entity";

export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: { email: string; password: string }): Promise<User> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already in use");
    }

    // Hash password here (e.g., bcrypt). Placeholder:
    const hashedPassword = `hashed:${input.password}`;

    const user = new User({
      id: "temp",
      name: "Temp User",
      email: input.email,
      password: hashedPassword,
      createdAt: new Date(),
    });
    return this.userRepo.create(user);
  }
}

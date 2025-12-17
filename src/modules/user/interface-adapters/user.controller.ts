// Controller coordinates HTTP concerns and delegates to application use cases
import { Body, Controller, Post } from "@nestjs/common";
import { CreateUserUseCase } from "../application/create-user.use-case";
import { CreateUserDto } from "../application/create-user.dto";

@Controller("users")
export class UserController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute({
      email: dto.email,
      password: dto.password,
    });
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }
}

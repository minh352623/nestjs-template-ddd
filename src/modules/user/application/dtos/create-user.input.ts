// Application DTO is framework-agnostic to keep use cases pure
export class CreateUserInput {
  constructor(public readonly name: string, public readonly email: string) {}
}

// Output DTO returned by use cases; presentation can serialize it directly
export class UserOutput {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date
  ) {}
}

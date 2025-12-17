// Pure domain entity with minimal invariants; no framework/ORM dependencies
export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;

  constructor(params: {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
  }) {
    if (!/^\S+@\S+\.\S+$/.test(params.email)) {
      throw new Error("Invalid email");
    }
    if (!params.password || params.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!params.name || params.name.trim().length < 2) {
      throw new Error("User name must be at least 2 characters");
    }
    this.id = params.id;
    this.name = params.name.trim();
    this.email = params.email;
    this.password = params.password;
    this.createdAt = params.createdAt;
  }
}

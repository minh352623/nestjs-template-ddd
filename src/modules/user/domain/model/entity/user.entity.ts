import { AggregateRoot } from '../../../../../shared/domain/base.entity';
import { Result } from '../../../../../shared/domain/result';

/**
 * User props for entity construction
 */
export interface UserProps {
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * User Entity (Aggregate Root)
 * Pure domain entity with business invariants
 */
export class User extends AggregateRoot<string> {
  private _email: string;
  private _name: string;
  private _password: string;
  private readonly _createdAt: Date;
  private _updatedAt?: Date;

  private constructor(id: string, props: UserProps) {
    super(id);
    this._email = props.email;
    this._name = props.name;
    this._password = props.password;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  /**
   * Factory method - Create new User with validation
   */
  public static create(props: {
    id?: string;
    email: string;
    name: string;
    password: string;
  }): Result<User> {
    // Validate email
    if (!props.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
      return Result.fail(new Error('Invalid email format'));
    }

    // Validate name
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail(new Error('Name must be at least 2 characters'));
    }

    // Validate password
    if (!props.password || props.password.length < 8) {
      return Result.fail(new Error('Password must be at least 8 characters'));
    }

    const userId = props.id ?? crypto.randomUUID();
    const user = new User(userId, {
      email: props.email.toLowerCase().trim(),
      name: props.name.trim(),
      password: props.password,
      createdAt: new Date(),
    });

    return Result.ok(user);
  }

  /**
   * Reconstitute from persistence (no validation)
   */
  public static reconstitute(props: {
    id: string;
    email: string;
    name: string;
    password: string;
    createdAt: Date;
    updatedAt?: Date;
  }): User {
    return new User(props.id, {
      email: props.email,
      name: props.name,
      password: props.password,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Update email
   */
  public updateEmail(email: string): Result<void> {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Result.fail(new Error('Invalid email format'));
    }

    this._email = email.toLowerCase().trim();
    this._updatedAt = new Date();
    this.incrementVersion();
    return Result.ok(undefined);
  }

  /**
   * Update name
   */
  public updateName(name: string): Result<void> {
    if (!name || name.trim().length < 2) {
      return Result.fail(new Error('Name must be at least 2 characters'));
    }

    this._name = name.trim();
    this._updatedAt = new Date();
    this.incrementVersion();
    return Result.ok(undefined);
  }

  /**
   * Update password (already hashed)
   */
  public updatePassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this._updatedAt = new Date();
    this.incrementVersion();
  }
}

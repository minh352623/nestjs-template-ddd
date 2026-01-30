/**
 * Application Layer DTOs
 * Used for communication between Application Service and other layers
 */

// Input DTOs (Commands)
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

export interface ListUsersInput {
  limit?: number;
  offset?: number;
}

// Output DTOs
export interface UserOutput {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserListOutput {
  users: UserOutput[];
  total?: number;
}

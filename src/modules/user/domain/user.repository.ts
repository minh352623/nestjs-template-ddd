import { User } from './user.entity'

export abstract class UserRepository {
  abstract create(user: User): Promise<User>
  abstract findByEmail(email: string): Promise<User | null>
}


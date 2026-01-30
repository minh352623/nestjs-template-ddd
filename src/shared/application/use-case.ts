import { Result } from '../domain/result';

/**
 * Base Use Case interface
 * Follows Command/Query pattern with Result type for error handling
 */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<Result<TOutput>>;
}

/**
 * Query Use Case - for read operations
 */
export interface QueryUseCase<TInput, TOutput> extends UseCase<TInput, TOutput> {}

/**
 * Command Use Case - for write operations
 */
export interface CommandUseCase<TInput, TOutput> extends UseCase<TInput, TOutput> {}

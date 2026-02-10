import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard Response Format (BP §11.1)
 * Wraps all successful responses in a consistent structure
 */
export interface StandardResponse<T> {
  data: T;
  meta?: any;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returns { data, meta } structure, respect it
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            data: data.data,
            meta: data.meta,
            message: data.message ?? 'Success',
          };
        }

        // Default wrap
        return {
          data: data,
          message: 'Success',
        };
      }),
    );
  }
}

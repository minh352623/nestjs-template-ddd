import { Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/domain/result';

// ✅ Import interface từ DOMAIN layer (tuân thủ DIP)
import {
  IExternalUserPort,
  ExternalUserData,
} from '../../domain/ports';

/**
 * User Repository HTTP Adapter
 * 
 * MICROSERVICE: Adapter gọi User Service qua HTTP API
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                      MICROSERVICES (Sau khi tách)                        │
 * │                                                                          │
 * │  ┌──────────────────────────┐         ┌──────────────────────────┐      │
 * │  │    PAYMENT SERVICE       │         │      USER SERVICE        │      │
 * │  │                          │         │                          │      │
 * │  │ ┌───────────────┐        │  HTTP/  │          ┌────────────┐  │      │
 * │  │ │PaymentService │◄──┐    │  gRPC   │   ┌─────►│   User     │  │      │
 * │  │ └───────────────┘   │    │◄───────►│   │      │ Repository │  │      │
 * │  │                     │    │         │   │      └────────────┘  │      │
 * │  │         interface   │    │         │   │                      │      │
 * │  │              ▼      │    │         │   │                      │      │
 * │  │ ┌──────────────────┐│    │         │   │                      │      │
 * │  │ │ HTTPAdapter      ││    │         │   │                      │      │
 * │  │ │ (API calls)      │├────┼─────────┼───┘                      │      │
 * │  │ └──────────────────┘│    │         │                          │      │
 * │  └─────────────────────┴────┘         └──────────────────────────┘      │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Cấu hình:
 * - USER_SERVICE_URL: URL của User Service (e.g., http://user-service:3001)
 * - USER_SERVICE_TIMEOUT: Timeout in milliseconds
 */
@Injectable()
export class UserRepositoryHttpAdapter implements IExternalUserPort {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    this.timeout = parseInt(process.env.USER_SERVICE_TIMEOUT || '5000', 10);
  }

  async findById(id: string): Promise<Result<ExternalUserData>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return Result.fail(new Error(`User not found: ${id}`));
        }
        return Result.fail(new Error(`Failed to fetch user: ${response.statusText}`));
      }

      const data = await response.json() as ExternalUserData;
      return Result.ok(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[UserRepositoryHttpAdapter] Failed to fetch user ${id}:`, message);
      return Result.fail(new Error('Failed to fetch user from User Service'));
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(this.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async findByIds(ids: string[]): Promise<Map<string, ExternalUserData>> {
    const userMap = new Map<string, ExternalUserData>();

    try {
      // Thử batch endpoint trước
      const response = await fetch(`${this.baseUrl}/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.ok) {
        const users = await response.json() as ExternalUserData[];
        for (const user of users) {
          userMap.set(user.id, user);
        }
        return userMap;
      }
    } catch {
      // Fallback to individual requests
    }

    // Fallback: fetch từng user
    const promises = ids.map(async (id) => {
      const result = await this.findById(id);
      if (result.isSuccess) {
        userMap.set(id, result.value);
      }
    });
    await Promise.all(promises);

    return userMap;
  }
}

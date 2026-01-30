import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UserService } from '../../application/service/user.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  PaginationQuery,
  UserResponse,
  UserListResponse,
} from '../dto/user.dto';

/**
 * User HTTP Handler
 * Handles HTTP requests and delegates to application service
 */
@ApiTags('users')
@Controller('users')
export class UserHandler {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponse })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() request: CreateUserRequest): Promise<UserResponse> {
    const result = await this.userService.createUser({
      email: request.email,
      name: request.name,
      password: request.password,
    });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    const result = await this.userService.getUserById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, type: UserListResponse })
  async list(@Query() query: PaginationQuery): Promise<UserListResponse> {
    const result = await this.userService.getUsers({
      limit: query.limit,
      offset: query.offset,
    });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const result = await this.userService.updateUser(id, {
      email: request.email,
      name: request.name,
      password: request.password,
    });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.userService.deleteUser(id);

    if (result.isFailure) {
      throw result.error;
    }
  }
}

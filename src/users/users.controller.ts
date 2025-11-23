import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * UsersController - 處理所有 /users 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - POST   /users      創建新 user
 * - GET    /users      獲取所有 users
 * - GET    /users/:id  獲取單個 user
 * - PATCH  /users/:id  更新 user
 * - DELETE /users/:id  刪除 user
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  /**
   * Constructor - 注入 UsersService
   * 
   * NestJS 會自動 inject UsersService instance
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * 創建新 User
   * 
   * HTTP: POST /users
   * Request Body 例子:
   * {
   *   "name": "Kevin",
   *   "email": "kevin@example.com",
   *   "phone": "12345678",
   *   "avatarUrl": "https://example.com/avatar.jpg"
   * }
   * 
   * @Body() decorator 會自動將 JSON request body 轉做 CreateUserDto
   */
  @Post()
  @ApiOperation({ summary: '創建 User', description: '支援創建真實用戶或虛擬成員 (isVirtual: true)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 獲取所有 Users
   * 
   * HTTP: GET /users
   * Response: Array of user objects
   */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * 獲取單個 User
   * 
   * HTTP: GET /users/1
   * 
   * @Param('id') 會從 URL 拎到 id parameter
   * +id 會將 string 轉做 number (例如: "1" -> 1)
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  /**
   * 更新 User
   * 
   * HTTP: PATCH /users/1
   * Request Body 例子:
   * {
   *   "name": "New Name"
   * }
   * 
   * 只需要提供要 update 嘅 fields，其他 fields 保持不變
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  /**
   * 刪除 User
   * 
   * HTTP: DELETE /users/1
   * 
   * 會永久刪除 user record
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

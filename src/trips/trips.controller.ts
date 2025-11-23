import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { ClaimVirtualUserDto } from '../users/dto/claim-virtual-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * TripsController - 處理所有 /trips 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - POST   /trips                    創建新 trip
 * - GET    /trips                    獲取所有 trips
 * - GET    /trips/:id                獲取單個 trip
 * - PATCH  /trips/:id                更新 trip
 * - DELETE /trips/:id                刪除 trip
 * - POST   /trips/:id/members        加人入 trip
 * - DELETE /trips/:id/members/:userId 踢人出 trip
 */
@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 創建新 Trip
   * 
   * Request Body 例子:
   * {
   *   "name": "重廈旅行",
   *   "description": "去重慶同廈門",
   *   "startDate": "2025-10-23",
   *   "endDate": "2025-10-30",
   *   "creatorUserId": 1
   * }
   * 
   * 注意：creatorUserId 會自動加入做 trip member (Admin)
   */
  @Post()
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }

  /**
   * 獲取所有 Trips
   * 
   * Query Parameters:
   * - include: 指定要 include 咩 nested data (e.g. "members,expenses")
   * 
   * 例子:
   * GET /trips                        // 只要基本資料
   * GET /trips?include=members        // 要埋 members
   * GET /trips?include=members,expenses  // 要 members 同 expenses
   */
  @Get()
  @ApiOperation({ summary: '獲取所有 Trips', description: '支援 ?include=members 查詢參數' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members', example: 'members' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved trips' })
  findAll(@Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    return this.tripsService.findAll(includeOptions);
  }

  /**
   * 獲取單個 Trip
   * 
   * Query Parameters:
   * - include: 指定要 include 咩 nested data
   * 
   * 例子:
   * GET /trips/1                        // 只要基本資料
   * GET /trips/1?include=members        // 要埋 members
   * GET /trips/1?include=members,expenses,payments  // 要多樣野
   */
  @Get(':id')
  @ApiOperation({ summary: '獲取單個 Trip', description: '支援 ?include=members 查詢參數' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members', example: 'members' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved trip' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    return this.tripsService.findOne(+id, includeOptions);
  }

  /**
   * 更新 Trip
   * 
   * 例如: PATCH /trips/1
   * Body: { "name": "新名稱" }
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(+id, updateTripDto);
  }

  /**
   * 刪除 Trip
   * 
   * 例如: DELETE /trips/1
   * 注意：會自動刪除所有相關嘅 trip members (cascade delete)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(+id);
  }

  /**
   * 加人入 Trip
   * 
   * 例如: POST /trips/1/members
   * Body: { "userId": 2 }
   * 
   * 用途：比其他 user join 個 trip
   */
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body('userId') userId: number) {
    return this.tripsService.addMember(+id, userId);
  }

  /**
   * 踢人出 Trip
   * 
   * 例如: DELETE /trips/1/members/2
   * 
   * 用途：將 user 從 trip 移除
   */
  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tripsService.removeMember(+id, +userId);
  }

  /**
   * 認領虛擬成員
   * 
   * 當真人註冊後，可以 claim 之前嘅虛擬成員
   * 所有相關嘅 expenses 會自動轉去真人
   * 
   * 例子: POST /trips/1/members/claim
   * Body: { "virtualUserId": 100 }
   */
  @Post(':id/members/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '認領虛擬成員', description: '將虛擬成員嘅所有資料轉移去真實用戶' })
  @ApiResponse({ status: 201, description: 'Successfully claimed virtual member' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async claimVirtualMember(
    @Param('id') id: string,
    @Body() claimDto: ClaimVirtualUserDto,
    @Req() req,
  ) {
    const realUserId = req.user.userId; // From JwtStrategy
    return this.usersService.claimVirtualUser(
      claimDto.virtualUserId,
      realUserId,
      +id,
    );
  }
}

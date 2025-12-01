import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { ClaimVirtualUserDto } from '../users/dto/claim-virtual-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberTokenGuard } from '../auth/guards/member-token.guard';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';

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
  ) { }

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
  @UseGuards(OptionalJwtGuard)
  async create(@Body() createTripDto: CreateTripDto, @Req() req: Request & { user?: any }) {
    // If user is logged in (via JWT), use their ID
    console.log(req.user)
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
  @ApiQuery({ name: 'memberToken', required: false, description: 'User ID for filtering trips', example: '1' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved trips' })
  async findAll(@Query('include') include?: string, @Query('memberToken') memberToken?: string) {
    const includeOptions = include?.split(',') || [];
    const trips = await this.tripsService.findAll(includeOptions, memberToken);
    return trips.map(trip => this.mapTripResponse(trip));
  }

  /**
   * 根據 Share Code 獲取單個 Trip
   * 
   * GET /trips/share/:shareCode
   */
  @Get('share/:shareCode')
  @ApiOperation({ summary: '根據 Share Code 獲取 Trip', description: '支援 ?include=members,expenses' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members,expenses', example: 'members,expenses' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved trip' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findByShareCode(@Param('shareCode') shareCode: string, @Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    const trip = await this.tripsService.findByShareCode(shareCode, includeOptions);
    return this.mapTripResponse(trip);
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
  async findOne(@Param('id') id: string, @Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    const trip = await this.tripsService.findOne(+id, includeOptions);
    return this.mapTripResponse(trip);
  }

  /**
   * 更新 Trip
   * 
   * 例如: PATCH /trips/1
   * Body: { "name": "新名稱" }
   */
  @Patch(':id')
  @UseGuards(OptionalJwtGuard)
  update(
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    return this.tripsService.update(+id, memberToken, updateTripDto, req.user?.userId);
  }

  /**
   * 刪除 Trip
   * 
   * 例如: DELETE /trips/1
   * 注意：會自動刪除所有相關嘅 trip members (cascade delete)
   */
  @Delete(':id')
  @UseGuards(OptionalJwtGuard)
  remove(
    @Param('id') id: string,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    return this.tripsService.remove(+id, memberToken, req.user?.userId);
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
   * Join Trip (Guest)
   * 
   * Link: yourapp.com/t/ABCD1234 -> Frontend calls POST /trips/:id/join
   */
  @Post(':id/join')
  @ApiOperation({ summary: '加入 Trip (Guest)', description: '任何人點 Link 直接入團，生成 memberToken' })
  @ApiResponse({ status: 201, description: 'Successfully joined trip', schema: { example: { trip: {}, memberToken: 'uuid' } } })
  join(@Param('id') id: string, @Body('userName') userName?: string) {
    return this.tripsService.join(+id, userName);
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

  /**
   * 認領訪客成員 (Guest -> Real User)
   * 
   * 當 Guest User 登入後，將其 Guest 身份合併到 Real User
   * 
   * Header: x-member-token (Guest Member Token)
   * Auth: Bearer Token (Real User)
   */
  @Post(':id/members/claim-guest')
  @UseGuards(JwtAuthGuard, MemberTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '認領訪客成員', description: '將當前 Guest Member (x-member-token) 合併到登入用戶' })
  @ApiResponse({ status: 200, description: 'Successfully claimed guest member' })
  async claimGuestMember(
    @Param('id') id: string,
    @Req() req,
  ) {
    const realUserId = req.user.userId; // From JwtStrategy
    const guestMember = req.member; // From MemberTokenGuard

    return this.usersService.claimGuestMember(
      guestMember.userId,
      realUserId,
      +id,
    );
  }
  private mapTripResponse(trip: any) {
    if (trip.tripMembers) {
      trip.members = trip.tripMembers;
      delete trip.tripMembers;
    }
    return trip;
  }
}

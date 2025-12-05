import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ClaimVirtualUserDto } from '../users/dto/claim-virtual-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberTokenGuard } from '../auth/guards/member-token.guard';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';
import { CreateActivityMembersDto } from '../activitiesMembers/dto/create-activityMembers.dto';
import { formatSuccessResponse } from '../common/helpers';

/**
 * ActivitiesController - 處理所有 /activities 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - POST   /activities                    創建新 activity
 * - GET    /activities                    獲取所有 activities
 * - GET    /activities/:id                獲取單個 activity
 * - PATCH  /activities/:id                更新 activity
 * - DELETE /activities/:id                刪除 activity
 * - POST   /activities/:id/members        加人入 activity
 * - DELETE /activities/:id/members/:userId 踢人出 activity
 */
@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly usersService: UsersService,
  ) { }

  /**
   * 創建新 Activity
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
   * 注意：creatorUserId 會自動加入做 activity member (Admin)
   */
  @Post()
  @UseGuards(OptionalJwtGuard)
  async create(@Body() createActivityDto: CreateActivityDto, @Req() req: Request & { user?: any }) {
    // If user is logged in (via JWT), use their ID
    console.log(req.user)
    const activity = await this.activitiesService.create(createActivityDto);
    return formatSuccessResponse(activity, '成功創建 Activity');
  }

  /**
   * 獲取所有 Activities
   * 
   * Query Parameters:
   * - include: 指定要 include 咩 nested data (e.g. "members,expenses")
   * 
   * 例子:
   * GET /activities                        // 只要基本資料
   * GET /activities?include=members        // 要埋 members
   * GET /activities?include=members,expenses  // 要 members 同 expenses
   */
  @Get()
  @ApiOperation({ summary: '獲取所有 Activities', description: '支援 ?include=members 查詢參數' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members, expenses', example: 'members, expenses', isArray: true, type: String })
  @ApiQuery({ name: 'memberToken', required: false, description: 'User ID for filtering activities', example: '1', isArray: true, type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved activities' })
  async findAll(@Query('include') include?: string, @Query('memberToken') memberToken?: string | string[]) {
    const includeOptions = include?.split(',') || [];
    const activities = await this.activitiesService.findAll(includeOptions, memberToken);
    const mappedActivities = activities.map(activity => this.mapActivityResponse(activity));
    return formatSuccessResponse(mappedActivities, '成功獲取 Activities');
  }

  /**
   * 根據 Share Code 獲取單個 Activity
   * 
   * GET /activities/share/:shareCode
   */
  @Get('share/:shareCode')
  @ApiOperation({ summary: '根據 Share Code 獲取 Activity', description: '支援 ?include=members,expenses' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members, expenses', example: 'members, expenses', isArray: true, type: String })
  @ApiResponse({ status: 200, description: 'Successfully retrieved activity' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findByShareCode(@Param('shareCode') shareCode: string, @Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    const activity = await this.activitiesService.findByShareCode(shareCode, includeOptions);
    const mappedActivity = this.mapActivityResponse(activity);
    return formatSuccessResponse(mappedActivity, '成功獲取 Activity');
  }

  /**
   * 獲取單個 Activity
   * 
   * Query Parameters:
   * - include: 指定要 include 咩 nested data
   * 
   * 例子:
   * GET /activities/1                        // 只要基本資料
   * GET /activities/1?include=members        // 要埋 members
   * GET /activities/1?include=members,expenses,payments  // 要多樣野
   */
  @Get(':id')
  @ApiOperation({ summary: '獲取單個 Activity', description: '支援 ?include=members 查詢參數' })
  @ApiQuery({ name: 'include', required: false, description: 'Comma-separated list: members', example: 'members' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved activity' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(@Param('id') id: string, @Query('include') include?: string) {
    const includeOptions = include?.split(',') || [];
    const activity = await this.activitiesService.findOne(+id, includeOptions);
    const mappedActivity = this.mapActivityResponse(activity);
    return formatSuccessResponse(mappedActivity, '成功獲取 Activity');
  }

  /**
   * 更新 Activity
   * 
   * 例如: PATCH /activities/1
   * Body: { "name": "新名稱" }
   */
  @Patch(':id')
  @UseGuards(OptionalJwtGuard)
  async update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    const activity = await this.activitiesService.update(+id, memberToken, updateActivityDto, req.user?.userId);
    return formatSuccessResponse(activity, '成功更新 Activity');
  }

  /**
   * 刪除 Activity
   * 
   * 例如: DELETE /activities/1
   * 注意：會自動刪除所有相關嘅 activity members (cascade delete)
   */
  @Delete(':id')
  @UseGuards(OptionalJwtGuard)
  async remove(
    @Param('id') id: string,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    const result = await this.activitiesService.remove(+id, memberToken, req.user?.userId);
    return formatSuccessResponse(result, '成功刪除 Activity');
  }

  /**
   * 加人入 Activity
   * 
   * 例如: POST /activities/1/members
   * Body: { "userId": 2 }
   * 
   * 用途：比其他 user join 個 activity
   */
  @Post(':id/members')
  async addMember(@Param('id') id: number, @Body() createActivityMembersDto: CreateActivityMembersDto) {
    const member = await this.activitiesService.addMember(+id, createActivityMembersDto);
    return formatSuccessResponse(member, '成功加入成員');
  }

  /**
   * 踢人出 Activity
   * 
   * 例如: DELETE /activities/1/members/2
   * 
   * 用途：將 user 從 activity 移除
   */
  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    const result = await this.activitiesService.removeMember(+id, +userId);
    return formatSuccessResponse(result, '成功移除成員');
  }

  /**
   * Join Activity (Guest)
   * 
   * Link: yourapp.com/t/ABCD1234 -> Frontend calls POST /activities/:id/join
   */
  @Post(':id/join')
  @ApiOperation({ summary: '加入 Activity (Guest)', description: '任何人點 Link 直接入團，生成 memberToken' })
  @ApiResponse({ status: 201, description: 'Successfully joined activity', schema: { example: { activity: {}, memberToken: 'uuid' } } })
  async join(@Param('id') id: string, @Body('userName') userName?: string) {
    const result = await this.activitiesService.join(+id, userName);
    return formatSuccessResponse(result, '成功加入 Activity');
  }

  /**
   * 認領虛擬成員
   * 
   * 當真人註冊後，可以 claim 之前嘅虛擬成員
   * 所有相關嘅 expenses 會自動轉去真人
   * 
   * 例子: POST /activities/1/members/claim
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
    const result = await this.usersService.claimVirtualUser(
      claimDto.virtualUserId,
      realUserId,
      +id,
    );
    return formatSuccessResponse(result, '成功認領虛擬成員');
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

    const result = await this.usersService.claimGuestMember(
      guestMember.userId,
      realUserId,
      +id,
    );
    return formatSuccessResponse(result, '成功認領訪客成員');
  }
  private mapActivityResponse(activity: any) {
    if (activity.activityMembers) {
      activity.members = activity.activityMembers;
      delete activity.activityMembers;
    }
    return activity;
  }
}

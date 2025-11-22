import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

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
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

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
   */
  @Get()
  findAll() {
    return this.tripsService.findAll();
  }

  /**
   * 獲取單個 Trip
   * 
   * 例如: GET /trips/1
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(+id); // +id 將 string 轉做 number
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
}

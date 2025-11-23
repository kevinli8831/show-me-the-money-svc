import { IsInt } from 'class-validator';

/**
 * ClaimVirtualUserDto - 認領虛擬成員嘅 DTO
 * 
 * 用於 POST /trips/:tripId/members/claim
 */
export class ClaimVirtualUserDto {
  /**
   * 虛擬成員嘅 User ID
   */
  @IsInt()
  virtualUserId: number;
}

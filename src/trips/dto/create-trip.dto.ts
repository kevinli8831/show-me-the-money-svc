import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTripDto {
  name: string;
  description?: string;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  endDate?: Date;

  @Type(() => Number)
  creatorUserId?: number;
}

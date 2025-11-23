import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [TripsController],
  providers: [TripsService, UsersService],
})
export class TripsModule {}

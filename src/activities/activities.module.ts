import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [UsersModule, AuditModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule { }

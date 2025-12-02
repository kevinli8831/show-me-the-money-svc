import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ActivitiesModule, UsersModule, AuditModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule { }

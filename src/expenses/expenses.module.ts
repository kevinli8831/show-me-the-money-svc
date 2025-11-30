import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TripsModule } from '../trips/trips.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TripsModule, UsersModule, AuditModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule { }

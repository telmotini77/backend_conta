import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { SriWithholdingsService } from './sri-withholdings.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ReconciliationController],
  providers: [ReconciliationService, SriWithholdingsService, PrismaService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}

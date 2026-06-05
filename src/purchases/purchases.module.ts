import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { SriScraperService } from './sri-scraper.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService, SriScraperService, PrismaService],
  exports: [PurchasesService],
})
export class PurchasesModule {}

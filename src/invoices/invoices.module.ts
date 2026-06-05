import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from '../prisma.service';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, SriSignerService, SriSoapService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

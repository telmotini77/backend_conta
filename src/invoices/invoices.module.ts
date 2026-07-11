import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesSyncController } from './invoices-sync.controller';
import { PrismaService } from '../prisma.service';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';

@Module({
  controllers: [InvoicesController, InvoicesSyncController],
  providers: [InvoicesService, PrismaService, SriSignerService, SriSoapService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

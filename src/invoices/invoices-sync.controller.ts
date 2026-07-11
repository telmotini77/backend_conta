import { Controller, Post, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesSyncController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('sync-sale')
  async syncSale(
    @Body()
    dto: {
      userId: string;
      invoiceId: string;
      claveAcceso: string;
      clientName: string;
      amount: number;
      subtotal: number;
      iva: number;
      status: string;
      items: { productId: string; quantity: number }[];
    },
  ) {
    return this.invoicesService.syncSale(dto);
  }

  @Post('sync-status')
  async syncStatus(
    @Body()
    dto: {
      userId: string;
      claveAcceso: string;
      status: string;
    },
  ) {
    return this.invoicesService.syncStatus(dto);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ScrapedWithholding {
  numeroRetencion: string;
  claveAcceso: string;
  type: 'RECEIVED' | 'EMITTED';
  amountRenta: number;
  amountIva: number;
  amountTotal: number;
  date: Date;
  clientOrProviderRuc: string;
  clientOrProviderName: string;
  invoiceId?: string;
  purchaseId?: string;
}

@Injectable()
export class SriWithholdingsService {
  constructor(private prisma: PrismaService) {}

  async fetchMockWithholdings(userId: string): Promise<ScrapedWithholding[]> {
    console.log(
      `Simulando sincronización de retenciones SRI para usuario: ${userId}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network latency

    const today = new Date();
    const scraped: ScrapedWithholding[] = [];

    // 1. Fetch user's invoices to simulate RECEIVED withholdings (clients withholding from user)
    const invoices = await this.prisma.invoice.findMany({
      where: { userId },
      take: 2,
      orderBy: { createdAt: 'desc' },
    });

    for (const inv of invoices) {
      // Calculate realistic withholding amounts (e.g. 1.75% Income Tax, 30% VAT on 15% VAT base)
      const baseAmount = inv.amount;
      const amountRenta = Number((baseAmount * 0.0175).toFixed(2));
      const amountIva = Number((baseAmount * 0.15 * 0.3).toFixed(2)); // 30% of 15% VAT
      const amountTotal = Number((amountRenta + amountIva).toFixed(2));

      // Generate a 49-digit clave de acceso
      const dateStr = new Date(inv.createdAt)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');
      const typeCode = '07'; // Retencion
      const ruc = '1790012345001'; // Simulated client RUC
      const env = '1';
      const series = '001002';
      const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
      const numCode = Math.floor(
        Math.random() * 90000000 + 10000000,
      ).toString();
      const mode = '1';
      const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${env}${series}${seq}${numCode}${mode}`;
      const verifyDigit = '5'; // Simulated digit
      const claveAcceso = `${keyWithoutVerify}${verifyDigit}`;

      scraped.push({
        numeroRetencion: `001-002-${seq.slice(0, 9)}`,
        claveAcceso,
        type: 'RECEIVED',
        amountRenta,
        amountIva,
        amountTotal,
        date: new Date(inv.createdAt.getTime() + 1000 * 60 * 60 * 2), // 2 hours after invoice
        clientOrProviderRuc: ruc,
        clientOrProviderName: inv.clientName,
        invoiceId: inv.id, // Direct link simulation
      });
    }

    // 2. Fetch user's purchases to simulate EMITTED withholdings (user withholding from providers)
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      take: 2,
      orderBy: { date: 'desc' },
    });

    for (const pur of purchases) {
      const baseAmount = pur.amount;
      const amountRenta = Number((baseAmount * 0.0175).toFixed(2));
      const amountIva = Number((baseAmount * 0.15 * 0.3).toFixed(2));
      const amountTotal = Number((amountRenta + amountIva).toFixed(2));

      // Generate a 49-digit clave de acceso
      const dateStr = new Date(pur.date)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');
      const typeCode = '07'; // Retencion
      const ruc = '1790000000001'; // User's own RUC (simulated)
      const env = '1';
      const series = '001001';
      const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
      const numCode = Math.floor(
        Math.random() * 90000000 + 10000000,
      ).toString();
      const mode = '1';
      const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${env}${series}${seq}${numCode}${mode}`;
      const verifyDigit = '3'; // Simulated digit
      const claveAcceso = `${keyWithoutVerify}${verifyDigit}`;

      scraped.push({
        numeroRetencion: `001-001-${seq.slice(0, 9)}`,
        claveAcceso,
        type: 'EMITTED',
        amountRenta,
        amountIva,
        amountTotal,
        date: new Date(pur.date.getTime() + 1000 * 60 * 60 * 24), // 1 day after purchase
        clientOrProviderRuc: pur.providerRuc,
        clientOrProviderName: pur.providerName,
        purchaseId: pur.id, // Direct link simulation
      });
    }

    // 3. Add an orphan received withholding that does NOT match any invoice (to test manual matching)
    const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
    scraped.push({
      numeroRetencion: `002-005-${seq.slice(0, 9)}`,
      claveAcceso: `202605300717900123450011002005000${seq}123456789`,
      type: 'RECEIVED',
      amountRenta: 25.0,
      amountIva: 45.0,
      amountTotal: 70.0,
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      clientOrProviderRuc: '1790012345001',
      clientOrProviderName: 'CORPORACION EL ROSADO S.A.',
    });

    return scraped;
  }
}

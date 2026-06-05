import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SriScraperService } from './sri-scraper.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private sriScraper: SriScraperService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async syncPurchases(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Contribuyente no encontrado.');
    }

    // Call simulated SRI scraper
    const scraped = await this.sriScraper.scrapePurchases(user.ruc);
    const imported = [];

    for (const item of scraped) {
      // Check if already imported
      const existing = await this.prisma.purchase.findFirst({
        where: {
          claveAcceso: item.claveAcceso,
          userId,
        },
      });

      if (existing) {
        continue; // skip
      }

      // Create purchase record in DB
      const purchase = await this.prisma.purchase.create({
        data: {
          invoiceNum: item.invoiceNum,
          claveAcceso: item.claveAcceso,
          providerRuc: item.providerRuc,
          providerName: item.providerName,
          amount: Number(item.amount),
          date: item.date,
          userId,
        },
      });

      // If purchase lists specific product items, sync to inventory/Kárdex
      if (item.items && item.items.length > 0) {
        for (const lineItem of item.items) {
          // Look up product by SKU and user
          const product = await this.prisma.product.findFirst({
            where: {
              sku: lineItem.sku,
              userId,
            },
          });

          if (product) {
            // 1. Increment inventory stock
            const updatedProduct = await this.prisma.product.update({
              where: { id: product.id },
              data: {
                stock: { increment: lineItem.quantity },
              },
            });

            // 2. Log INGRESS in Kárdex Transactions
            await this.prisma.kardexTransaction.create({
              data: {
                productId: product.id,
                type: 'INGRESS',
                quantity: lineItem.quantity,
                unitCost: Number(lineItem.unitCost),
                totalCost: Number(lineItem.quantity * lineItem.unitCost),
                balanceStock: updatedProduct.stock,
                date: new Date(),
              },
            });
          }
        }
      }

      imported.push(purchase);
    }

    return imported;
  }
}

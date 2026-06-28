import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SriScraperService } from './sri-scraper.service';
import { AccountingService } from '../accounting/accounting.service';

export class CreatePurchaseDto {
  invoiceNum: string;
  providerRuc: string;
  providerName: string;
  amount: number;
  date: string;
  hasIva?: boolean;
  ivaRate?: number;
  items?: {
    sku: string;
    quantity: number;
    unitCost: number;
  }[];
}

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private sriScraper: SriScraperService,
    private accountingService: AccountingService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async create(userId: string, dto: CreatePurchaseDto) {
    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('El monto de la compra debe ser mayor a 0.');
    }

    // Check if invoice already exists
    const existing = await this.prisma.purchase.findFirst({
      where: {
        invoiceNum: dto.invoiceNum,
        providerRuc: dto.providerRuc,
        userId,
      },
    });

    if (existing) {
      throw new BadRequestException('Esta factura de compra ya se encuentra registrada.');
    }

    // Determine subtotal and IVA (Ecuador default: 15% IVA)
    const hasIva = dto.hasIva !== false;
    let subtotal = amount;
    let iva = 0;

    const ivaRate = dto.ivaRate !== undefined ? Number(dto.ivaRate) : 15;

    if (hasIva) {
      subtotal = Number((amount / (1 + ivaRate / 100)).toFixed(2));
      iva = Number((amount - subtotal).toFixed(2));
    }

    // Generate simulated access key for manual purchases if not provided
    const keyWithoutVerify = `${new Date(dto.date).toISOString().slice(0, 10).replace(/-/g, '')}01${dto.providerRuc}1001001000${Math.floor(Math.random() * 900000) + 100000}12345678`;
    const claveAcceso = `${keyWithoutVerify}1`;

    const purchase = await this.prisma.purchase.create({
      data: {
        invoiceNum: dto.invoiceNum,
        claveAcceso,
        providerRuc: dto.providerRuc,
        providerName: dto.providerName,
        amount,
        subtotal,
        iva,
        date: new Date(dto.date),
        synced: false,
        userId,
      },
    });

    // Update inventory stock and Kardex if items provided
    if (dto.items && dto.items.length > 0) {
      for (const lineItem of dto.items) {
        const product = await this.prisma.product.findFirst({
          where: { sku: lineItem.sku, userId },
        });

        if (product) {
          const updated = await this.prisma.product.update({
            where: { id: product.id },
            data: { stock: { increment: lineItem.quantity } },
          });

          await this.prisma.kardexTransaction.create({
            data: {
              productId: product.id,
              type: 'INGRESS',
              quantity: lineItem.quantity,
              unitCost: Number(lineItem.unitCost),
              totalCost: Number(lineItem.quantity * lineItem.unitCost),
              balanceStock: updated.stock,
              date: new Date(dto.date),
            },
          });
        }
      }
    }

    // Generate Purchase Journal Entry
    try {
      await this.accountingService.createAutomaticEntry(userId, {
        type: 'PURCHASE',
        description: `Compra Factura #${dto.invoiceNum} a ${dto.providerName}`,
        purchaseId: purchase.id,
        date: new Date(dto.date),
        lines: [
          {
            accountCode: '5.01.01',
            accountName: 'Inventario / Gasto Compra',
            debit: subtotal,
            credit: 0,
          },
          ...(iva > 0
            ? [
                {
                  accountCode: '1.01.03',
                  accountName: 'Crédito Tributario IVA (Compras)',
                  debit: iva,
                  credit: 0,
                },
              ]
            : []),
          {
            accountCode: '2.01.01',
            accountName: 'Cuentas por Pagar Proveedores',
            debit: 0,
            credit: amount,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to log automatic purchase entry:', err);
    }

    return purchase;
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

      // Default all scraped purchases to hasIva = true (except manual item check)
      const amount = Number(item.amount);
      const subtotal = Number((amount / 1.15).toFixed(2));
      const iva = Number((amount - subtotal).toFixed(2));

      // Create purchase record in DB
      const purchase = await this.prisma.purchase.create({
        data: {
          invoiceNum: item.invoiceNum,
          claveAcceso: item.claveAcceso,
          providerRuc: item.providerRuc,
          providerName: item.providerName,
          amount,
          subtotal,
          iva,
          date: item.date,
          userId,
        },
      });

      // If purchase lists specific product items, sync to inventory/Kárdex
      if (item.items && item.items.length > 0) {
        for (const lineItem of item.items) {
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

      // Generate Purchase Journal Entry
      try {
        await this.accountingService.createAutomaticEntry(userId, {
          type: 'PURCHASE',
          description: `Compra Sincronizada Factura #${item.invoiceNum} a ${item.providerName}`,
          purchaseId: purchase.id,
          date: item.date,
          lines: [
            {
              accountCode: '5.01.01',
              accountName: 'Inventario / Gasto Compra',
              debit: subtotal,
              credit: 0,
            },
            {
              accountCode: '1.01.03',
              accountName: 'Crédito Tributario IVA (Compras)',
              debit: iva,
              credit: 0,
            },
            {
              accountCode: '2.01.01',
              accountName: 'Cuentas por Pagar Proveedores',
              debit: 0,
              credit: amount,
            },
          ],
        });
      } catch (err) {
        console.error('Failed to log automatic sync purchase entry:', err);
      }

      imported.push(purchase);
    }

    return imported;
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCashTransactionDto,
  CreateWithholdingDto,
  MatchWithholdingDto,
} from './dto/reconciliation.dto';
import { SriWithholdingsService } from './sri-withholdings.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class ReconciliationService {
  constructor(
    private prisma: PrismaService,
    private sriWithholdings: SriWithholdingsService,
    private accountingService: AccountingService,
  ) {}

  async getSummary(userId: string) {
    // 1. Fetch all invoices & purchases with their links
    const [invoices, purchases, cashTx, withholdings] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { userId },
        include: {
          cashTransactions: true,
          withholdings: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.findMany({
        where: { userId },
        include: {
          cashTransactions: true,
          withholdings: true,
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.cashTransaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.withholding.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
    ]);

    // 2. Calculate Cash Flow metrics
    const totalRecaudado = cashTx
      .filter((tx) => tx.type === 'INGRESS')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalPagado = cashTx
      .filter((tx) => tx.type === 'EGRESS')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const flujoNeto = totalRecaudado - totalPagado;

    // 3. Calculate Withholding tax credit aggregates (Received ones)
    const creditIva = withholdings
      .filter((w) => w.type === 'RECEIVED')
      .reduce((sum, w) => sum + w.amountIva, 0);

    const creditRenta = withholdings
      .filter((w) => w.type === 'RECEIVED')
      .reduce((sum, w) => sum + w.amountRenta, 0);

    const creditoTotal = creditIva + creditRenta;

    // 4. Map Invoices with reconciliation balances
    const invoicesStatus = invoices.map((inv) => {
      const cashSum = inv.cashTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      const withholdingSum = inv.withholdings.reduce(
        (sum, w) => sum + w.amountTotal,
        0,
      );
      const balance = Number(
        (inv.amount - cashSum - withholdingSum).toFixed(2),
      );

      let status: 'CONCILIADO' | 'PARCIAL' | 'PENDING' = 'PENDING';
      if (balance <= 0) {
        status = 'CONCILIADO';
      } else if (cashSum + withholdingSum > 0) {
        status = 'PARCIAL';
      }

      return {
        id: inv.id,
        claveAcceso: inv.claveAcceso,
        clientName: inv.clientName,
        amount: inv.amount,
        createdAt: inv.createdAt,
        cashPaid: cashSum,
        withheld: withholdingSum,
        balance,
        status,
      };
    });

    // 5. Map Purchases with reconciliation balances
    const purchasesStatus = purchases.map((pur) => {
      const cashSum = pur.cashTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      const withholdingSum = pur.withholdings.reduce(
        (sum, w) => sum + w.amountTotal,
        0,
      );
      const balance = Number(
        (pur.amount - cashSum - withholdingSum).toFixed(2),
      );

      let status: 'CONCILIADO' | 'PARCIAL' | 'PENDING' = 'PENDING';
      if (balance <= 0) {
        status = 'CONCILIADO';
      } else if (cashSum + withholdingSum > 0) {
        status = 'PARCIAL';
      }

      return {
        id: pur.id,
        invoiceNum: pur.invoiceNum,
        providerName: pur.providerName,
        providerRuc: pur.providerRuc,
        amount: pur.amount,
        date: pur.date,
        cashPaid: cashSum,
        withheld: withholdingSum,
        balance,
        status,
      };
    });

    return {
      metrics: {
        totalRecaudado: Number(totalRecaudado.toFixed(2)),
        totalPagado: Number(totalPagado.toFixed(2)),
        flujoNeto: Number(flujoNeto.toFixed(2)),
        creditIva: Number(creditIva.toFixed(2)),
        creditRenta: Number(creditRenta.toFixed(2)),
        creditoTotal: Number(creditoTotal.toFixed(2)),
      },
      invoices: invoicesStatus,
      purchases: purchasesStatus,
      withholdings,
      cashTransactions: cashTx,
    };
  }

  async createCashTransaction(userId: string, dto: CreateCashTransactionDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException(
        'El monto de la transacción debe ser mayor a 0.',
      );
    }

    // Prepare link data
    const data: Prisma.CashTransactionUncheckedCreateInput = {
      type: dto.type,
      source: dto.source,
      amount: Number(dto.amount),
      description: dto.description || '',
      userId,
    };

    let invoiceClientName = '';
    let providerName = '';

    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, userId },
      });
      if (!invoice) {
        throw new NotFoundException('Factura de venta no encontrada.');
      }
      data.invoiceId = dto.invoiceId;
      data.source = 'SALE';
      data.type = 'INGRESS';
      invoiceClientName = invoice.clientName;
      data.description =
        data.description || `Cobro de Factura a ${invoice.clientName}`;
    } else if (dto.purchaseId) {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: dto.purchaseId, userId },
      });
      if (!purchase) {
        throw new NotFoundException('Factura de compra no encontrada.');
      }
      data.purchaseId = dto.purchaseId;
      data.source = 'PURCHASE';
      data.type = 'EGRESS';
      providerName = purchase.providerName;
      data.description =
        data.description || `Pago a Proveedor ${purchase.providerName}`;
    }

    const tx = await this.prisma.cashTransaction.create({ data });

    // Generate Journal Entry
    try {
      let debitAccount = '';
      let debitName = '';
      let creditAccount = '';
      let creditName = '';

      if (dto.invoiceId) {
        debitAccount = '1.01.01';
        debitName = 'Caja/Bancos';
        creditAccount = '1.01.02';
        creditName = 'Cuentas por Cobrar Clientes';
      } else if (dto.purchaseId) {
        debitAccount = '2.01.01';
        debitName = 'Cuentas por Pagar Proveedores';
        creditAccount = '1.01.01';
        creditName = 'Caja/Bancos';
      } else {
        if (dto.type === 'INGRESS') {
          debitAccount = '1.01.01';
          debitName = 'Caja/Bancos';
          creditAccount = '5.01.03';
          creditName = 'Otros Ingresos / Ajuste Caja';
        } else {
          debitAccount = '5.01.03';
          debitName = 'Otros Gastos / Ajuste Caja';
          creditAccount = '1.01.01';
          creditName = 'Caja/Bancos';
        }
      }

      await this.accountingService.createAutomaticEntry(userId, {
        type: 'CASH',
        description: data.description || `Movimiento de caja: ${dto.type}`,
        date: new Date(),
        lines: [
          {
            accountCode: debitAccount,
            accountName: debitName,
            debit: tx.amount,
            credit: 0,
          },
          {
            accountCode: creditAccount,
            accountName: creditName,
            debit: 0,
            credit: tx.amount,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to log automatic cash journal entry:', err);
    }

    return tx;
  }

  async createWithholding(userId: string, dto: CreateWithholdingDto) {
    const amountTotal = Number(dto.amountTotal);
    if (amountTotal <= 0) {
      throw new BadRequestException(
        'El monto total de retención debe ser mayor a 0.',
      );
    }

    const data: Prisma.WithholdingUncheckedCreateInput = {
      numeroRetencion: dto.numeroRetencion,
      claveAcceso: dto.claveAcceso || null,
      type: dto.type,
      amountRenta: Number(dto.amountRenta || 0),
      amountIva: Number(dto.amountIva || 0),
      amountTotal,
      date: new Date(dto.date),
      clientOrProviderRuc: dto.clientOrProviderRuc,
      clientOrProviderName: dto.clientOrProviderName,
      userId,
    };

    // If explicit document IDs are provided, link them
    if (dto.invoiceId) {
      data.invoiceId = dto.invoiceId;
    } else if (dto.purchaseId) {
      data.purchaseId = dto.purchaseId;
    } else {
      // Perform automated matching!
      if (dto.type === 'RECEIVED') {
        // Auto-match for sales invoices
        // Match by client RUC/name and amount proximity
        const matchedInvoice = await this.prisma.invoice.findFirst({
          where: {
            userId,
            clientName: {
              contains: dto.clientOrProviderName,
              mode: 'insensitive',
            },
            // Check if amount is greater than base or matches base. In Ecuador, base amount can be derived from Base + VAT.
            // Let's see if we can find an invoice whose remaining balance is close to the base or total
            status: 'AUTHORIZED',
          },
        });
        if (matchedInvoice) {
          data.invoiceId = matchedInvoice.id;
          console.log(
            `Auto-matching: linked withholding ${dto.numeroRetencion} to Invoice ${matchedInvoice.claveAcceso}`,
          );
        }
      } else {
        // Auto-match for purchase invoices
        const matchedPurchase = await this.prisma.purchase.findFirst({
          where: {
            userId,
            providerRuc: dto.clientOrProviderRuc,
          },
        });
        if (matchedPurchase) {
          data.purchaseId = matchedPurchase.id;
          console.log(
            `Auto-matching: linked withholding ${dto.numeroRetencion} to Purchase ${matchedPurchase.invoiceNum}`,
          );
        }
      }
    }

    return this.prisma.withholding.create({ data });
  }

  async matchWithholding(userId: string, dto: MatchWithholdingDto) {
    const withholding = await this.prisma.withholding.findFirst({
      where: { id: dto.withholdingId, userId },
    });

    if (!withholding) {
      throw new NotFoundException('Comprobante de retención no encontrado.');
    }

    const updateData: Prisma.WithholdingUncheckedUpdateInput = {};

    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, userId },
      });
      if (!invoice) {
        throw new NotFoundException('Factura de venta no encontrada.');
      }
      updateData.invoiceId = dto.invoiceId;
      updateData.purchaseId = null;
    } else if (dto.purchaseId) {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: dto.purchaseId, userId },
      });
      if (!purchase) {
        throw new NotFoundException('Factura de compra no encontrada.');
      }
      updateData.purchaseId = dto.purchaseId;
      updateData.invoiceId = null;
    } else {
      updateData.invoiceId = null;
      updateData.purchaseId = null;
    }

    return this.prisma.withholding.update({
      where: { id: dto.withholdingId },
      data: updateData,
    });
  }

  async syncWithholdings(userId: string) {
    const scraped = await this.sriWithholdings.fetchMockWithholdings(userId);
    const imported = [];

    for (const item of scraped) {
      // 1. Check if already exists in DB (by access key if available, otherwise check unique properties)
      const orConditions: Prisma.WithholdingWhereInput[] = [];
      if (item.claveAcceso) {
        orConditions.push({ claveAcceso: item.claveAcceso });
      }
      orConditions.push({
        numeroRetencion: item.numeroRetencion,
        type: item.type,
        date: item.date,
      });

      const existing = await this.prisma.withholding.findFirst({
        where: {
          userId,
          OR: orConditions,
        },
      });

      if (existing) {
        continue; // Skip
      }

      // 2. Try to auto-match if not linked directly
      let invoiceId = item.invoiceId;
      let purchaseId = item.purchaseId;

      if (!invoiceId && !purchaseId) {
        if (item.type === 'RECEIVED') {
          // Fuzzy match invoice by client name contains
          const matchInv = await this.prisma.invoice.findFirst({
            where: {
              userId,
              clientName: {
                contains: item.clientOrProviderName.split(' ')[0],
                mode: 'insensitive',
              },
            },
          });
          if (matchInv) invoiceId = matchInv.id;
        } else {
          // Exact match purchase by provider RUC
          const matchPur = await this.prisma.purchase.findFirst({
            where: {
              userId,
              providerRuc: item.clientOrProviderRuc,
            },
          });
          if (matchPur) purchaseId = matchPur.id;
        }
      }

      // 3. Create in DB
      const withholding = await this.prisma.withholding.create({
        data: {
          numeroRetencion: item.numeroRetencion,
          claveAcceso: item.claveAcceso,
          type: item.type,
          amountRenta: item.amountRenta,
          amountIva: item.amountIva,
          amountTotal: item.amountTotal,
          date: item.date,
          clientOrProviderRuc: item.clientOrProviderRuc,
          clientOrProviderName: item.clientOrProviderName,
          invoiceId: invoiceId || null,
          purchaseId: purchaseId || null,
          userId,
        },
      });

      imported.push(withholding);
    }

    return imported;
  }
}

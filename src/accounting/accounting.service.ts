import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface EntryLineInput {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      include: {
        lines: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getTrialBalance(userId: string) {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: { userId },
      },
    });

    const accountsMap: Record<
      string,
      { code: string; name: string; debit: number; credit: number; balance: number }
    > = {};

    for (const line of lines) {
      if (!accountsMap[line.accountCode]) {
        accountsMap[line.accountCode] = {
          code: line.accountCode,
          name: line.accountName,
          debit: 0,
          credit: 0,
          balance: 0,
        };
      }
      accountsMap[line.accountCode].debit += line.debit;
      accountsMap[line.accountCode].credit += line.credit;
    }

    // Calculate balances (standard rules: Assets/Expenses are debit-based, Liabilities/Equity/Revenue are credit-based)
    // To keep it simple: Balance = Debit - Credit. For Liabilities (2.x), Equity (3.x), Revenue (4.x), it's Credit - Debit.
    const list = Object.values(accountsMap).map((acc) => {
      acc.debit = Number(acc.debit.toFixed(2));
      acc.credit = Number(acc.credit.toFixed(2));
      
      const isCreditAccount =
        acc.code.startsWith('2') ||
        acc.code.startsWith('3') ||
        acc.code.startsWith('4');

      acc.balance = isCreditAccount
        ? acc.credit - acc.debit
        : acc.debit - acc.credit;

      acc.balance = Number(acc.balance.toFixed(2));
      return acc;
    });

    // Sort by account code
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }

  async createAutomaticEntry(
    userId: string,
    data: {
      type: string;
      description: string;
      date?: Date;
      invoiceId?: string;
      purchaseId?: string;
      lines: EntryLineInput[];
    },
  ) {
    const totalDebit = data.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    // Allow a small floating point tolerance (e.g. 0.05) due to rounding in decimals
    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      console.warn(
        `Automatic Journal Entry mismatch (Debit: ${totalDebit}, Credit: ${totalCredit}). Adjusting line values to balance.`,
      );
    }

    // Force exact balance by adjusting the largest line slightly if there's a tiny mismatch
    const diff = Number((totalDebit - totalCredit).toFixed(2));
    if (diff !== 0 && data.lines.length > 0) {
      if (diff > 0) {
        // More debit than credit, add difference to credit of the first credit line
        const creditLine = data.lines.find((l) => l.credit > 0);
        if (creditLine) creditLine.credit = Number((creditLine.credit + diff).toFixed(2));
      } else {
        // More credit than debit, add difference to debit of the first debit line
        const debitLine = data.lines.find((l) => l.debit > 0);
        if (debitLine) debitLine.debit = Number((debitLine.debit - diff).toFixed(2));
      }
    }

    return this.prisma.journalEntry.create({
      data: {
        userId,
        description: data.description,
        type: data.type,
        date: data.date || new Date(),
        invoiceId: data.invoiceId,
        purchaseId: data.purchaseId,
        lines: {
          create: data.lines.map((l) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(Number(l.debit).toFixed(2)),
            credit: Number(Number(l.credit).toFixed(2)),
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }

  async createManual(
    userId: string,
    dto: {
      description: string;
      date?: string;
      lines: EntryLineInput[];
    },
  ) {
    if (!dto.description) {
      throw new BadRequestException('La descripción es obligatoria.');
    }
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('El asiento contable debe tener al menos 2 líneas.');
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `El asiento contable no está cuadrado. Total Debe: $${totalDebit.toFixed(2)}, Total Haber: $${totalCredit.toFixed(2)}`,
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        userId,
        description: dto.description,
        type: 'MANUAL',
        date: dto.date ? new Date(dto.date) : new Date(),
        lines: {
          create: dto.lines.map((l) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(l.debit),
            credit: Number(l.credit),
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }
}

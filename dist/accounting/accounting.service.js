"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AccountingService = class AccountingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
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
    async getTrialBalance(userId) {
        const lines = await this.prisma.journalEntryLine.findMany({
            where: {
                journalEntry: { userId },
            },
        });
        const accountsMap = {};
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
        const list = Object.values(accountsMap).map((acc) => {
            acc.debit = Number(acc.debit.toFixed(2));
            acc.credit = Number(acc.credit.toFixed(2));
            const isCreditAccount = acc.code.startsWith('2') ||
                acc.code.startsWith('3') ||
                acc.code.startsWith('4');
            acc.balance = isCreditAccount
                ? acc.credit - acc.debit
                : acc.debit - acc.credit;
            acc.balance = Number(acc.balance.toFixed(2));
            return acc;
        });
        return list.sort((a, b) => a.code.localeCompare(b.code));
    }
    async createAutomaticEntry(userId, data) {
        const totalDebit = data.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
        const totalCredit = data.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.05) {
            console.warn(`Automatic Journal Entry mismatch (Debit: ${totalDebit}, Credit: ${totalCredit}). Adjusting line values to balance.`);
        }
        const diff = Number((totalDebit - totalCredit).toFixed(2));
        if (diff !== 0 && data.lines.length > 0) {
            if (diff > 0) {
                const creditLine = data.lines.find((l) => l.credit > 0);
                if (creditLine)
                    creditLine.credit = Number((creditLine.credit + diff).toFixed(2));
            }
            else {
                const debitLine = data.lines.find((l) => l.debit > 0);
                if (debitLine)
                    debitLine.debit = Number((debitLine.debit - diff).toFixed(2));
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
    async createManual(userId, dto) {
        if (!dto.description) {
            throw new common_1.BadRequestException('La descripción es obligatoria.');
        }
        if (!dto.lines || dto.lines.length < 2) {
            throw new common_1.BadRequestException('El asiento contable debe tener al menos 2 líneas.');
        }
        const totalDebit = dto.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
        const totalCredit = dto.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new common_1.BadRequestException(`El asiento contable no está cuadrado. Total Debe: $${totalDebit.toFixed(2)}, Total Haber: $${totalCredit.toFixed(2)}`);
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
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map
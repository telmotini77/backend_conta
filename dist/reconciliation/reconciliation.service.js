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
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const sri_withholdings_service_1 = require("./sri-withholdings.service");
const accounting_service_1 = require("../accounting/accounting.service");
let ReconciliationService = class ReconciliationService {
    prisma;
    sriWithholdings;
    accountingService;
    constructor(prisma, sriWithholdings, accountingService) {
        this.prisma = prisma;
        this.sriWithholdings = sriWithholdings;
        this.accountingService = accountingService;
    }
    async getSummary(userId) {
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
        const totalRecaudado = cashTx
            .filter((tx) => tx.type === 'INGRESS')
            .reduce((sum, tx) => sum + tx.amount, 0);
        const totalPagado = cashTx
            .filter((tx) => tx.type === 'EGRESS')
            .reduce((sum, tx) => sum + tx.amount, 0);
        const flujoNeto = totalRecaudado - totalPagado;
        const creditIva = withholdings
            .filter((w) => w.type === 'RECEIVED')
            .reduce((sum, w) => sum + w.amountIva, 0);
        const creditRenta = withholdings
            .filter((w) => w.type === 'RECEIVED')
            .reduce((sum, w) => sum + w.amountRenta, 0);
        const creditoTotal = creditIva + creditRenta;
        const invoicesStatus = invoices.map((inv) => {
            const cashSum = inv.cashTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const withholdingSum = inv.withholdings.reduce((sum, w) => sum + w.amountTotal, 0);
            const balance = Number((inv.amount - cashSum - withholdingSum).toFixed(2));
            let status = 'PENDING';
            if (balance <= 0) {
                status = 'CONCILIADO';
            }
            else if (cashSum + withholdingSum > 0) {
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
        const purchasesStatus = purchases.map((pur) => {
            const cashSum = pur.cashTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const withholdingSum = pur.withholdings.reduce((sum, w) => sum + w.amountTotal, 0);
            const balance = Number((pur.amount - cashSum - withholdingSum).toFixed(2));
            let status = 'PENDING';
            if (balance <= 0) {
                status = 'CONCILIADO';
            }
            else if (cashSum + withholdingSum > 0) {
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
    async createCashTransaction(userId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('El monto de la transacción debe ser mayor a 0.');
        }
        const data = {
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
                throw new common_1.NotFoundException('Factura de venta no encontrada.');
            }
            data.invoiceId = dto.invoiceId;
            data.source = 'SALE';
            data.type = 'INGRESS';
            invoiceClientName = invoice.clientName;
            data.description =
                data.description || `Cobro de Factura a ${invoice.clientName}`;
        }
        else if (dto.purchaseId) {
            const purchase = await this.prisma.purchase.findFirst({
                where: { id: dto.purchaseId, userId },
            });
            if (!purchase) {
                throw new common_1.NotFoundException('Factura de compra no encontrada.');
            }
            data.purchaseId = dto.purchaseId;
            data.source = 'PURCHASE';
            data.type = 'EGRESS';
            providerName = purchase.providerName;
            data.description =
                data.description || `Pago a Proveedor ${purchase.providerName}`;
        }
        const tx = await this.prisma.cashTransaction.create({ data });
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
            }
            else if (dto.purchaseId) {
                debitAccount = '2.01.01';
                debitName = 'Cuentas por Pagar Proveedores';
                creditAccount = '1.01.01';
                creditName = 'Caja/Bancos';
            }
            else {
                if (dto.type === 'INGRESS') {
                    debitAccount = '1.01.01';
                    debitName = 'Caja/Bancos';
                    creditAccount = '5.01.03';
                    creditName = 'Otros Ingresos / Ajuste Caja';
                }
                else {
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
        }
        catch (err) {
            console.error('Failed to log automatic cash journal entry:', err);
        }
        return tx;
    }
    async createWithholding(userId, dto) {
        const amountTotal = Number(dto.amountTotal);
        if (amountTotal <= 0) {
            throw new common_1.BadRequestException('El monto total de retención debe ser mayor a 0.');
        }
        const data = {
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
        if (dto.invoiceId) {
            data.invoiceId = dto.invoiceId;
        }
        else if (dto.purchaseId) {
            data.purchaseId = dto.purchaseId;
        }
        else {
            if (dto.type === 'RECEIVED') {
                const matchedInvoice = await this.prisma.invoice.findFirst({
                    where: {
                        userId,
                        clientName: {
                            contains: dto.clientOrProviderName,
                            mode: 'insensitive',
                        },
                        status: 'AUTHORIZED',
                    },
                });
                if (matchedInvoice) {
                    data.invoiceId = matchedInvoice.id;
                    console.log(`Auto-matching: linked withholding ${dto.numeroRetencion} to Invoice ${matchedInvoice.claveAcceso}`);
                }
            }
            else {
                const matchedPurchase = await this.prisma.purchase.findFirst({
                    where: {
                        userId,
                        providerRuc: dto.clientOrProviderRuc,
                    },
                });
                if (matchedPurchase) {
                    data.purchaseId = matchedPurchase.id;
                    console.log(`Auto-matching: linked withholding ${dto.numeroRetencion} to Purchase ${matchedPurchase.invoiceNum}`);
                }
            }
        }
        return this.prisma.withholding.create({ data });
    }
    async matchWithholding(userId, dto) {
        const withholding = await this.prisma.withholding.findFirst({
            where: { id: dto.withholdingId, userId },
        });
        if (!withholding) {
            throw new common_1.NotFoundException('Comprobante de retención no encontrado.');
        }
        const updateData = {};
        if (dto.invoiceId) {
            const invoice = await this.prisma.invoice.findFirst({
                where: { id: dto.invoiceId, userId },
            });
            if (!invoice) {
                throw new common_1.NotFoundException('Factura de venta no encontrada.');
            }
            updateData.invoiceId = dto.invoiceId;
            updateData.purchaseId = null;
        }
        else if (dto.purchaseId) {
            const purchase = await this.prisma.purchase.findFirst({
                where: { id: dto.purchaseId, userId },
            });
            if (!purchase) {
                throw new common_1.NotFoundException('Factura de compra no encontrada.');
            }
            updateData.purchaseId = dto.purchaseId;
            updateData.invoiceId = null;
        }
        else {
            updateData.invoiceId = null;
            updateData.purchaseId = null;
        }
        return this.prisma.withholding.update({
            where: { id: dto.withholdingId },
            data: updateData,
        });
    }
    async syncWithholdings(userId) {
        const scraped = await this.sriWithholdings.fetchMockWithholdings(userId);
        const imported = [];
        for (const item of scraped) {
            const orConditions = [];
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
                continue;
            }
            let invoiceId = item.invoiceId;
            let purchaseId = item.purchaseId;
            if (!invoiceId && !purchaseId) {
                if (item.type === 'RECEIVED') {
                    const matchInv = await this.prisma.invoice.findFirst({
                        where: {
                            userId,
                            clientName: {
                                contains: item.clientOrProviderName.split(' ')[0],
                                mode: 'insensitive',
                            },
                        },
                    });
                    if (matchInv)
                        invoiceId = matchInv.id;
                }
                else {
                    const matchPur = await this.prisma.purchase.findFirst({
                        where: {
                            userId,
                            providerRuc: item.clientOrProviderRuc,
                        },
                    });
                    if (matchPur)
                        purchaseId = matchPur.id;
                }
            }
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
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sri_withholdings_service_1.SriWithholdingsService,
        accounting_service_1.AccountingService])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map
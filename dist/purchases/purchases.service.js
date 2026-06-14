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
exports.PurchasesService = exports.CreatePurchaseDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const sri_scraper_service_1 = require("./sri-scraper.service");
const accounting_service_1 = require("../accounting/accounting.service");
class CreatePurchaseDto {
    invoiceNum;
    providerRuc;
    providerName;
    amount;
    date;
    hasIva;
    items;
}
exports.CreatePurchaseDto = CreatePurchaseDto;
let PurchasesService = class PurchasesService {
    prisma;
    sriScraper;
    accountingService;
    constructor(prisma, sriScraper, accountingService) {
        this.prisma = prisma;
        this.sriScraper = sriScraper;
        this.accountingService = accountingService;
    }
    async findAll(userId) {
        return this.prisma.purchase.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }
    async create(userId, dto) {
        const amount = Number(dto.amount);
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto de la compra debe ser mayor a 0.');
        }
        const existing = await this.prisma.purchase.findFirst({
            where: {
                invoiceNum: dto.invoiceNum,
                providerRuc: dto.providerRuc,
                userId,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Esta factura de compra ya se encuentra registrada.');
        }
        const hasIva = dto.hasIva !== false;
        let subtotal = amount;
        let iva = 0;
        if (hasIva) {
            subtotal = Number((amount / 1.15).toFixed(2));
            iva = Number((amount - subtotal).toFixed(2));
        }
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
        }
        catch (err) {
            console.error('Failed to log automatic purchase entry:', err);
        }
        return purchase;
    }
    async syncPurchases(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('Contribuyente no encontrado.');
        }
        const scraped = await this.sriScraper.scrapePurchases(user.ruc);
        const imported = [];
        for (const item of scraped) {
            const existing = await this.prisma.purchase.findFirst({
                where: {
                    claveAcceso: item.claveAcceso,
                    userId,
                },
            });
            if (existing) {
                continue;
            }
            const amount = Number(item.amount);
            const subtotal = Number((amount / 1.15).toFixed(2));
            const iva = Number((amount - subtotal).toFixed(2));
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
            if (item.items && item.items.length > 0) {
                for (const lineItem of item.items) {
                    const product = await this.prisma.product.findFirst({
                        where: {
                            sku: lineItem.sku,
                            userId,
                        },
                    });
                    if (product) {
                        const updatedProduct = await this.prisma.product.update({
                            where: { id: product.id },
                            data: {
                                stock: { increment: lineItem.quantity },
                            },
                        });
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
            }
            catch (err) {
                console.error('Failed to log automatic sync purchase entry:', err);
            }
            imported.push(purchase);
        }
        return imported;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sri_scraper_service_1.SriScraperService,
        accounting_service_1.AccountingService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map
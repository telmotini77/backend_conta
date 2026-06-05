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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const sri_scraper_service_1 = require("./sri-scraper.service");
let PurchasesService = class PurchasesService {
    prisma;
    sriScraper;
    constructor(prisma, sriScraper) {
        this.prisma = prisma;
        this.sriScraper = sriScraper;
    }
    async findAll(userId) {
        return this.prisma.purchase.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
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
            imported.push(purchase);
        }
        return imported;
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sri_scraper_service_1.SriScraperService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map
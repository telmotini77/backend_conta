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
exports.SriWithholdingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SriWithholdingsService = class SriWithholdingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fetchMockWithholdings(userId) {
        console.log(`Simulando sincronización de retenciones SRI para usuario: ${userId}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        const today = new Date();
        const scraped = [];
        const invoices = await this.prisma.invoice.findMany({
            where: { userId },
            take: 2,
            orderBy: { createdAt: 'desc' },
        });
        for (const inv of invoices) {
            const baseAmount = inv.amount;
            const amountRenta = Number((baseAmount * 0.0175).toFixed(2));
            const amountIva = Number((baseAmount * 0.15 * 0.3).toFixed(2));
            const amountTotal = Number((amountRenta + amountIva).toFixed(2));
            const dateStr = new Date(inv.createdAt)
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, '');
            const typeCode = '07';
            const ruc = '1790012345001';
            const env = '1';
            const series = '001002';
            const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
            const numCode = Math.floor(Math.random() * 90000000 + 10000000).toString();
            const mode = '1';
            const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${env}${series}${seq}${numCode}${mode}`;
            const verifyDigit = '5';
            const claveAcceso = `${keyWithoutVerify}${verifyDigit}`;
            scraped.push({
                numeroRetencion: `001-002-${seq.slice(0, 9)}`,
                claveAcceso,
                type: 'RECEIVED',
                amountRenta,
                amountIva,
                amountTotal,
                date: new Date(inv.createdAt.getTime() + 1000 * 60 * 60 * 2),
                clientOrProviderRuc: ruc,
                clientOrProviderName: inv.clientName,
                invoiceId: inv.id,
            });
        }
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
            const dateStr = new Date(pur.date)
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, '');
            const typeCode = '07';
            const ruc = '1790000000001';
            const env = '1';
            const series = '001001';
            const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
            const numCode = Math.floor(Math.random() * 90000000 + 10000000).toString();
            const mode = '1';
            const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${env}${series}${seq}${numCode}${mode}`;
            const verifyDigit = '3';
            const claveAcceso = `${keyWithoutVerify}${verifyDigit}`;
            scraped.push({
                numeroRetencion: `001-001-${seq.slice(0, 9)}`,
                claveAcceso,
                type: 'EMITTED',
                amountRenta,
                amountIva,
                amountTotal,
                date: new Date(pur.date.getTime() + 1000 * 60 * 60 * 24),
                clientOrProviderRuc: pur.providerRuc,
                clientOrProviderName: pur.providerName,
                purchaseId: pur.id,
            });
        }
        const seq = Math.floor(Math.random() * 900000000 + 100000000).toString();
        scraped.push({
            numeroRetencion: `002-005-${seq.slice(0, 9)}`,
            claveAcceso: `202605300717900123450011002005000${seq}123456789`,
            type: 'RECEIVED',
            amountRenta: 25.0,
            amountIva: 45.0,
            amountTotal: 70.0,
            date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
            clientOrProviderRuc: '1790012345001',
            clientOrProviderName: 'CORPORACION EL ROSADO S.A.',
        });
        return scraped;
    }
};
exports.SriWithholdingsService = SriWithholdingsService;
exports.SriWithholdingsService = SriWithholdingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SriWithholdingsService);
//# sourceMappingURL=sri-withholdings.service.js.map
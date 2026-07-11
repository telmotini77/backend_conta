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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const sri_signer_service_1 = require("./sri-signer.service");
const sri_soap_service_1 = require("./sri-soap.service");
const accounting_service_1 = require("../accounting/accounting.service");
let InvoicesService = class InvoicesService {
    prisma;
    sriSigner;
    sriSoap;
    accountingService;
    constructor(prisma, sriSigner, sriSoap, accountingService) {
        this.prisma = prisma;
        this.sriSigner = sriSigner;
        this.sriSoap = sriSoap;
        this.accountingService = accountingService;
    }
    async findAll(userId) {
        return this.prisma.invoice.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    getModulo11Digit(key) {
        let multiplier = 2;
        let sum = 0;
        for (let i = key.length - 1; i >= 0; i--) {
            sum += parseInt(key[i], 10) * multiplier;
            multiplier++;
            if (multiplier > 7) {
                multiplier = 2;
            }
        }
        const remainder = sum % 11;
        const digit = 11 - remainder;
        if (digit === 11)
            return '0';
        if (digit === 10)
            return '1';
        return digit.toString();
    }
    async create(userId, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('El monto de la factura debe ser mayor a 0.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('Contribuyente/usuario no encontrado.');
        }
        const hasIva = dto.hasIva !== false;
        const amount = Number(dto.amount);
        let subtotal = amount;
        let iva = 0;
        const ivaRate = dto.ivaRate !== undefined ? Number(dto.ivaRate) : 15;
        if (hasIva) {
            subtotal = Number((amount / (1 + ivaRate / 100)).toFixed(2));
            iva = Number((amount - subtotal).toFixed(2));
        }
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const typeCode = '01';
        const ruc = user.ruc;
        const environment = user.sriEnvironment || '1';
        const series = '001002';
        const sequential = Math.floor(Math.random() * 900000000 + 100000000).toString();
        const numericCode = Math.floor(Math.random() * 90000000 + 10000000).toString();
        const mode = '1';
        const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${environment}${series}${sequential}${numericCode}${mode}`;
        const verifyDigit = this.getModulo11Digit(keyWithoutVerify);
        const accessKey = `${keyWithoutVerify}${verifyDigit}`;
        const rawXml = this.sriSigner.generateInvoiceXml({
            clientName: dto.clientName,
            amount: amount,
            claveAcceso: accessKey,
            createdAt: new Date(),
            ruc: user.ruc,
            companyName: user.name,
            environment: environment,
            ivaRate: hasIva ? ivaRate : 0,
        });
        const p12Buffer = user.signatureBase64
            ? Buffer.from(user.signatureBase64, 'base64')
            : undefined;
        const signedXml = this.sriSigner.signXml(rawXml, p12Buffer, user.signaturePassword || undefined);
        const reception = await this.sriSoap.sendToSri(signedXml, user.sriSimulate, environment);
        const invoiceStatus = reception.status === 'RECEIVED'
            ? client_1.InvoiceStatus.RECEIVED
            : client_1.InvoiceStatus.REJECTED;
        const invoice = await this.prisma.invoice.create({
            data: {
                claveAcceso: accessKey,
                clientName: dto.clientName,
                amount: amount,
                subtotal: subtotal,
                iva: iva,
                status: invoiceStatus,
                userId,
            },
        });
        if (dto.items && dto.items.length > 0) {
            for (const item of dto.items) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (product) {
                    const qty = Number(item.quantity);
                    const newStock = product.stock - qty;
                    await this.prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: newStock },
                    });
                    await this.prisma.kardexTransaction.create({
                        data: {
                            productId: item.productId,
                            type: 'EGRESS',
                            quantity: qty,
                            unitCost: product.cost,
                            totalCost: product.cost * qty,
                            balanceStock: newStock,
                        },
                    });
                }
            }
        }
        try {
            await this.accountingService.createAutomaticEntry(userId, {
                type: 'SALE',
                description: `Venta Factura #${sequential} a ${dto.clientName}`,
                invoiceId: invoice.id,
                lines: [
                    {
                        accountCode: '1.01.02',
                        accountName: 'Cuentas por Cobrar Clientes',
                        debit: amount,
                        credit: 0,
                    },
                    {
                        accountCode: '4.01.01',
                        accountName: 'Ventas de Servicios/Mercaderías',
                        debit: 0,
                        credit: subtotal,
                    },
                    ...(iva > 0
                        ? [
                            {
                                accountCode: '2.01.03',
                                accountName: 'IVA Ventas Cobrado',
                                debit: 0,
                                credit: iva,
                            },
                        ]
                        : []),
                ],
            });
        }
        catch (err) {
            console.error('Failed to log automatic sales entry:', err);
        }
        if (invoiceStatus === client_1.InvoiceStatus.RECEIVED) {
            setTimeout(() => {
                void (async () => {
                    try {
                        const authResult = await this.sriSoap.authorizeComprobante(accessKey, user.sriSimulate, environment);
                        await this.prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                status: authResult.status === 'AUTHORIZED'
                                    ? client_1.InvoiceStatus.AUTHORIZED
                                    : client_1.InvoiceStatus.REJECTED,
                            },
                        });
                    }
                    catch (err) {
                        console.error('Error in background SRI invoice authorization:', err);
                    }
                })();
            }, 4000);
        }
        return invoice;
    }
    async sendInvoiceToClient(userId, id) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, userId },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Factura no encontrada.');
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
        return this.prisma.invoice.update({
            where: { id },
            data: {
                sentToClient: true,
            },
        });
    }
    async getInvoiceXml(userId, id) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, userId },
            include: { user: true },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Factura no encontrada.');
        }
        return this.sriSigner.generateInvoiceXml({
            clientName: invoice.clientName,
            amount: invoice.amount,
            claveAcceso: invoice.claveAcceso,
            createdAt: invoice.createdAt,
            ruc: invoice.user.ruc,
            companyName: invoice.user.name,
        });
    }
    async syncSale(dto) {
        const invoice = await this.prisma.invoice.create({
            data: {
                id: dto.invoiceId,
                claveAcceso: dto.claveAcceso,
                clientName: dto.clientName,
                amount: Number(dto.amount),
                subtotal: Number(dto.subtotal),
                iva: Number(dto.iva),
                status: dto.status,
                userId: dto.userId,
            },
        });
        if (dto.items && dto.items.length > 0) {
            for (const item of dto.items) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (product) {
                    const qty = Number(item.quantity);
                    const newStock = product.stock - qty;
                    await this.prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: newStock },
                    });
                    await this.prisma.kardexTransaction.create({
                        data: {
                            productId: item.productId,
                            type: 'EGRESS',
                            quantity: qty,
                            unitCost: product.cost,
                            totalCost: product.cost * qty,
                            balanceStock: newStock,
                        },
                    });
                }
            }
        }
        const sequential = dto.claveAcceso.slice(30, 39);
        try {
            await this.accountingService.createAutomaticEntry(dto.userId, {
                type: 'SALE',
                description: `Venta Factura #${sequential} a ${dto.clientName}`,
                invoiceId: invoice.id,
                lines: [
                    {
                        accountCode: '1.01.02',
                        accountName: 'Cuentas por Cobrar Clientes',
                        debit: Number(dto.amount),
                        credit: 0,
                    },
                    {
                        accountCode: '4.01.01',
                        accountName: 'Ventas de Servicios/Mercaderías',
                        debit: 0,
                        credit: Number(dto.subtotal),
                    },
                    ...(Number(dto.iva) > 0
                        ? [
                            {
                                accountCode: '2.01.03',
                                accountName: 'IVA Ventas Cobrado',
                                debit: 0,
                                credit: Number(dto.iva),
                            },
                        ]
                        : []),
                ],
            });
        }
        catch (err) {
            console.error('Failed to log automatic sales entry in sync:', err);
        }
        return invoice;
    }
    async syncStatus(dto) {
        return this.prisma.invoice.update({
            where: { claveAcceso: dto.claveAcceso },
            data: { status: dto.status },
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sri_signer_service_1.SriSignerService,
        sri_soap_service_1.SriSoapService,
        accounting_service_1.AccountingService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map
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
let InvoicesService = class InvoicesService {
    prisma;
    sriSigner;
    sriSoap;
    constructor(prisma, sriSigner, sriSoap) {
        this.prisma = prisma;
        this.sriSigner = sriSigner;
        this.sriSoap = sriSoap;
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
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const typeCode = '01';
        const ruc = user.ruc;
        const environment = '1';
        const series = '001002';
        const sequential = Math.floor(Math.random() * 900000000 + 100000000).toString();
        const numericCode = Math.floor(Math.random() * 90000000 + 10000000).toString();
        const mode = '1';
        const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${environment}${series}${sequential}${numericCode}${mode}`;
        const verifyDigit = this.getModulo11Digit(keyWithoutVerify);
        const accessKey = `${keyWithoutVerify}${verifyDigit}`;
        const rawXml = this.sriSigner.generateInvoiceXml({
            clientName: dto.clientName,
            amount: Number(dto.amount),
            claveAcceso: accessKey,
            createdAt: new Date(),
            ruc: user.ruc,
            companyName: user.name,
        });
        const signedXml = this.sriSigner.signXml(rawXml);
        const reception = await this.sriSoap.sendToSri(signedXml, true);
        const invoiceStatus = reception.status === 'RECEIVED'
            ? client_1.InvoiceStatus.RECEIVED
            : client_1.InvoiceStatus.REJECTED;
        const invoice = await this.prisma.invoice.create({
            data: {
                claveAcceso: accessKey,
                clientName: dto.clientName,
                amount: Number(dto.amount),
                status: invoiceStatus,
                userId,
            },
        });
        if (invoiceStatus === client_1.InvoiceStatus.RECEIVED) {
            setTimeout(() => {
                void (async () => {
                    try {
                        const authResult = await this.sriSoap.authorizeComprobante(accessKey, true);
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
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sri_signer_service_1.SriSignerService,
        sri_soap_service_1.SriSoapService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map
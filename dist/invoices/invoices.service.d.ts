import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';
import { AccountingService } from '../accounting/accounting.service';
export declare class InvoicesService {
    private prisma;
    private sriSigner;
    private sriSoap;
    private accountingService;
    constructor(prisma: PrismaService, sriSigner: SriSignerService, sriSoap: SriSoapService, accountingService: AccountingService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        sentToClient: boolean;
    }[]>;
    private getModulo11Digit;
    create(userId: string, dto: CreateInvoiceDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        sentToClient: boolean;
    }>;
    sendInvoiceToClient(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        sentToClient: boolean;
    }>;
    getInvoiceXml(userId: string, id: string): Promise<string>;
    syncSale(dto: {
        userId: string;
        invoiceId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: string;
        items: {
            productId: string;
            quantity: number;
        }[];
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        sentToClient: boolean;
    }>;
    syncStatus(dto: {
        userId: string;
        claveAcceso: string;
        status: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        claveAcceso: string;
        clientName: string;
        amount: number;
        subtotal: number;
        iva: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        sentToClient: boolean;
    }>;
}

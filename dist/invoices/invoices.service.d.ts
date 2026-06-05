import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';
export declare class InvoicesService {
    private prisma;
    private sriSigner;
    private sriSoap;
    constructor(prisma: PrismaService, sriSigner: SriSignerService, sriSoap: SriSoapService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        amount: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        claveAcceso: string;
        clientName: string;
    }[]>;
    private getModulo11Digit;
    create(userId: string, dto: CreateInvoiceDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        amount: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        claveAcceso: string;
        clientName: string;
    }>;
}

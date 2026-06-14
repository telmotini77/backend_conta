import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    findAll(req: RequestWithUser): Promise<{
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
    create(req: RequestWithUser, dto: CreateInvoiceDto): Promise<{
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
    send(req: RequestWithUser, id: string): Promise<{
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
    getXml(req: RequestWithUser, id: string): Promise<{
        xml: string;
    }>;
}
export {};

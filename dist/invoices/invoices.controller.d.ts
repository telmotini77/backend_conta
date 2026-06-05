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
        amount: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        claveAcceso: string;
        clientName: string;
    }[]>;
    create(req: RequestWithUser, dto: CreateInvoiceDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        amount: number;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        claveAcceso: string;
        clientName: string;
    }>;
}
export {};

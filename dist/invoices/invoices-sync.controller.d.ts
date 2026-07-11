import { InvoicesService } from './invoices.service.js';
export declare class InvoicesSyncController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
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

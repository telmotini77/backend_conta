import { PurchasesService, CreatePurchaseDto } from './purchases.service';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    findAll(req: RequestWithUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        claveAcceso: string;
        amount: number;
        subtotal: number;
        iva: number;
        invoiceNum: string;
        providerRuc: string;
        providerName: string;
        synced: boolean;
    }[]>;
    create(req: RequestWithUser, dto: CreatePurchaseDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        claveAcceso: string;
        amount: number;
        subtotal: number;
        iva: number;
        invoiceNum: string;
        providerRuc: string;
        providerName: string;
        synced: boolean;
    }>;
    sync(req: RequestWithUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        claveAcceso: string;
        amount: number;
        subtotal: number;
        iva: number;
        invoiceNum: string;
        providerRuc: string;
        providerName: string;
        synced: boolean;
    }[]>;
}
export {};

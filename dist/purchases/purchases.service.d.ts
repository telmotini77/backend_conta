import { PrismaService } from '../prisma.service';
import { SriScraperService } from './sri-scraper.service';
import { AccountingService } from '../accounting/accounting.service';
export declare class CreatePurchaseDto {
    invoiceNum: string;
    providerRuc: string;
    providerName: string;
    amount: number;
    date: string;
    hasIva?: boolean;
    items?: {
        sku: string;
        quantity: number;
        unitCost: number;
    }[];
}
export declare class PurchasesService {
    private prisma;
    private sriScraper;
    private accountingService;
    constructor(prisma: PrismaService, sriScraper: SriScraperService, accountingService: AccountingService);
    findAll(userId: string): Promise<{
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
    create(userId: string, dto: CreatePurchaseDto): Promise<{
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
    syncPurchases(userId: string): Promise<{
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

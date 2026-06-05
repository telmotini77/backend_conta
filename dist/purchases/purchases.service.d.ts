import { PrismaService } from '../prisma.service';
import { SriScraperService } from './sri-scraper.service';
export declare class PurchasesService {
    private prisma;
    private sriScraper;
    constructor(prisma: PrismaService, sriScraper: SriScraperService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        amount: number;
        claveAcceso: string;
        invoiceNum: string;
        providerRuc: string;
        providerName: string;
        synced: boolean;
    }[]>;
    syncPurchases(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        amount: number;
        claveAcceso: string;
        invoiceNum: string;
        providerRuc: string;
        providerName: string;
        synced: boolean;
    }[]>;
}

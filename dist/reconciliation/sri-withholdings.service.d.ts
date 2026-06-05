import { PrismaService } from '../prisma.service';
export interface ScrapedWithholding {
    numeroRetencion: string;
    claveAcceso: string;
    type: 'RECEIVED' | 'EMITTED';
    amountRenta: number;
    amountIva: number;
    amountTotal: number;
    date: Date;
    clientOrProviderRuc: string;
    clientOrProviderName: string;
    invoiceId?: string;
    purchaseId?: string;
}
export declare class SriWithholdingsService {
    private prisma;
    constructor(prisma: PrismaService);
    fetchMockWithholdings(userId: string): Promise<ScrapedWithholding[]>;
}

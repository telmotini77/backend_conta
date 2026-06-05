import { PrismaService } from '../prisma.service';
import { CreateCashTransactionDto, CreateWithholdingDto, MatchWithholdingDto } from './dto/reconciliation.dto';
import { SriWithholdingsService } from './sri-withholdings.service';
export declare class ReconciliationService {
    private prisma;
    private sriWithholdings;
    constructor(prisma: PrismaService, sriWithholdings: SriWithholdingsService);
    getSummary(userId: string): Promise<{
        metrics: {
            totalRecaudado: number;
            totalPagado: number;
            flujoNeto: number;
            creditIva: number;
            creditRenta: number;
            creditoTotal: number;
        };
        invoices: {
            id: string;
            claveAcceso: string;
            clientName: string;
            amount: number;
            createdAt: Date;
            cashPaid: number;
            withheld: number;
            balance: number;
            status: "CONCILIADO" | "PARCIAL" | "PENDING";
        }[];
        purchases: {
            id: string;
            invoiceNum: string;
            providerName: string;
            providerRuc: string;
            amount: number;
            date: Date;
            cashPaid: number;
            withheld: number;
            balance: number;
            status: "CONCILIADO" | "PARCIAL" | "PENDING";
        }[];
        withholdings: {
            id: string;
            createdAt: Date;
            userId: string;
            date: Date;
            type: import("@prisma/client").$Enums.WithholdingType;
            claveAcceso: string | null;
            invoiceId: string | null;
            purchaseId: string | null;
            numeroRetencion: string;
            amountRenta: number;
            amountIva: number;
            amountTotal: number;
            clientOrProviderRuc: string;
            clientOrProviderName: string;
        }[];
        cashTransactions: {
            id: string;
            createdAt: Date;
            userId: string;
            date: Date;
            type: import("@prisma/client").$Enums.CashTransactionType;
            amount: number;
            source: import("@prisma/client").$Enums.CashTransactionSource;
            description: string | null;
            invoiceId: string | null;
            purchaseId: string | null;
        }[];
    }>;
    createCashTransaction(userId: string, dto: CreateCashTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        type: import("@prisma/client").$Enums.CashTransactionType;
        amount: number;
        source: import("@prisma/client").$Enums.CashTransactionSource;
        description: string | null;
        invoiceId: string | null;
        purchaseId: string | null;
    }>;
    createWithholding(userId: string, dto: CreateWithholdingDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        type: import("@prisma/client").$Enums.WithholdingType;
        claveAcceso: string | null;
        invoiceId: string | null;
        purchaseId: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
    }>;
    matchWithholding(userId: string, dto: MatchWithholdingDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        type: import("@prisma/client").$Enums.WithholdingType;
        claveAcceso: string | null;
        invoiceId: string | null;
        purchaseId: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
    }>;
    syncWithholdings(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        type: import("@prisma/client").$Enums.WithholdingType;
        claveAcceso: string | null;
        invoiceId: string | null;
        purchaseId: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
    }[]>;
}

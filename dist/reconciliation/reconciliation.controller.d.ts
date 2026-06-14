import { ReconciliationService } from './reconciliation.service';
import { CreateCashTransactionDto, CreateWithholdingDto, MatchWithholdingDto } from './dto/reconciliation.dto';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class ReconciliationController {
    private readonly reconciliationService;
    constructor(reconciliationService: ReconciliationService);
    getSummary(req: RequestWithUser): Promise<{
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
            type: import("@prisma/client").$Enums.WithholdingType;
            date: Date;
            claveAcceso: string | null;
            numeroRetencion: string;
            amountRenta: number;
            amountIva: number;
            amountTotal: number;
            clientOrProviderRuc: string;
            clientOrProviderName: string;
            invoiceId: string | null;
            purchaseId: string | null;
        }[];
        cashTransactions: {
            description: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.CashTransactionType;
            date: Date;
            amount: number;
            invoiceId: string | null;
            purchaseId: string | null;
            source: import("@prisma/client").$Enums.CashTransactionSource;
        }[];
    }>;
    createCashTransaction(req: RequestWithUser, dto: CreateCashTransactionDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.CashTransactionType;
        date: Date;
        amount: number;
        invoiceId: string | null;
        purchaseId: string | null;
        source: import("@prisma/client").$Enums.CashTransactionSource;
    }>;
    createWithholding(req: RequestWithUser, dto: CreateWithholdingDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.WithholdingType;
        date: Date;
        claveAcceso: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
        invoiceId: string | null;
        purchaseId: string | null;
    }>;
    matchWithholding(req: RequestWithUser, dto: MatchWithholdingDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.WithholdingType;
        date: Date;
        claveAcceso: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
        invoiceId: string | null;
        purchaseId: string | null;
    }>;
    syncWithholdings(req: RequestWithUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.WithholdingType;
        date: Date;
        claveAcceso: string | null;
        numeroRetencion: string;
        amountRenta: number;
        amountIva: number;
        amountTotal: number;
        clientOrProviderRuc: string;
        clientOrProviderName: string;
        invoiceId: string | null;
        purchaseId: string | null;
    }[]>;
}
export {};

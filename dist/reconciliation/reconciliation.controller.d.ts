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
    createCashTransaction(req: RequestWithUser, dto: CreateCashTransactionDto): Promise<{
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
    createWithholding(req: RequestWithUser, dto: CreateWithholdingDto): Promise<{
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
    matchWithholding(req: RequestWithUser, dto: MatchWithholdingDto): Promise<{
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
    syncWithholdings(req: RequestWithUser): Promise<{
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
export {};

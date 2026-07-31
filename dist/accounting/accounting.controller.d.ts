import { AccountingService, EntryLineInput } from './accounting.service';
interface RequestWithUser {
    user: {
        id: string;
    };
}
declare class CreateManualEntryDto {
    description: string;
    date?: string;
    lines: EntryLineInput[];
}
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    findAll(req: RequestWithUser): Promise<({
        lines: {
            id: string;
            journalEntryId: string;
            accountCode: string;
            accountName: string;
            debit: number;
            credit: number;
        }[];
    } & {
        description: string;
        id: string;
        invoiceId: string | null;
        createdAt: Date;
        userId: string;
        type: string;
        date: Date;
        purchaseId: string | null;
    })[]>;
    getTrialBalance(req: RequestWithUser): Promise<{
        code: string;
        name: string;
        debit: number;
        credit: number;
        balance: number;
    }[]>;
    createManual(req: RequestWithUser, dto: CreateManualEntryDto): Promise<{
        lines: {
            id: string;
            journalEntryId: string;
            accountCode: string;
            accountName: string;
            debit: number;
            credit: number;
        }[];
    } & {
        description: string;
        id: string;
        invoiceId: string | null;
        createdAt: Date;
        userId: string;
        type: string;
        date: Date;
        purchaseId: string | null;
    }>;
}
export {};

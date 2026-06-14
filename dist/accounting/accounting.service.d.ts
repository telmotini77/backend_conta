import { PrismaService } from '../prisma.service';
export interface EntryLineInput {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
}
export declare class AccountingService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
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
        createdAt: Date;
        userId: string;
        type: string;
        date: Date;
        invoiceId: string | null;
        purchaseId: string | null;
    })[]>;
    getTrialBalance(userId: string): Promise<{
        code: string;
        name: string;
        debit: number;
        credit: number;
        balance: number;
    }[]>;
    createAutomaticEntry(userId: string, data: {
        type: string;
        description: string;
        date?: Date;
        invoiceId?: string;
        purchaseId?: string;
        lines: EntryLineInput[];
    }): Promise<{
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
        createdAt: Date;
        userId: string;
        type: string;
        date: Date;
        invoiceId: string | null;
        purchaseId: string | null;
    }>;
    createManual(userId: string, dto: {
        description: string;
        date?: string;
        lines: EntryLineInput[];
    }): Promise<{
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
        createdAt: Date;
        userId: string;
        type: string;
        date: Date;
        invoiceId: string | null;
        purchaseId: string | null;
    }>;
}

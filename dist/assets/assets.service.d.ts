import { PrismaService } from '../prisma.service';
import { CreateAssetDto } from './dto/assets.dto';
import { AccountingService } from '../accounting/accounting.service';
export declare class AssetsService {
    private prisma;
    private accountingService;
    constructor(prisma: PrismaService, accountingService: AccountingService);
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        userId: string;
        value: number;
        residualValue: number;
        yearsOfLife: number;
        purchaseDate: Date;
    }[]>;
    create(userId: string, dto: CreateAssetDto): Promise<{
        id: string;
        name: string;
        userId: string;
        value: number;
        residualValue: number;
        yearsOfLife: number;
        purchaseDate: Date;
    }>;
    getDepreciations(userId: string): Promise<({
        asset: {
            id: string;
            name: string;
            userId: string;
            value: number;
            residualValue: number;
            yearsOfLife: number;
            purchaseDate: Date;
        };
    } & {
        id: string;
        date: Date;
        amount: number;
        assetId: string;
        period: string;
    })[]>;
    generateMonthlyDepreciations(userId: string, period: string): Promise<({
        asset: {
            id: string;
            name: string;
            userId: string;
            value: number;
            residualValue: number;
            yearsOfLife: number;
            purchaseDate: Date;
        };
    } & {
        id: string;
        date: Date;
        amount: number;
        assetId: string;
        period: string;
    })[]>;
}

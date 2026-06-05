import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/assets.dto';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    findAll(req: RequestWithUser): Promise<{
        id: string;
        name: string;
        userId: string;
        value: number;
        residualValue: number;
        yearsOfLife: number;
        purchaseDate: Date;
    }[]>;
    create(req: RequestWithUser, dto: CreateAssetDto): Promise<{
        id: string;
        name: string;
        userId: string;
        value: number;
        residualValue: number;
        yearsOfLife: number;
        purchaseDate: Date;
    }>;
    getDepreciations(req: RequestWithUser): Promise<({
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
        assetId: string;
        amount: number;
        period: string;
    })[]>;
    depreciate(req: RequestWithUser, body: {
        period?: string;
    }): Promise<({
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
        assetId: string;
        amount: number;
        period: string;
    })[]>;
}
export {};

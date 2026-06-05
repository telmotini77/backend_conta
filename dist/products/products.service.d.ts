import { PrismaService } from '../prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateProductDto } from './dto/products.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        transactions: {
            id: string;
            date: Date;
            productId: string;
            type: import("@prisma/client").$Enums.TransactionType;
            quantity: number;
            unitCost: number;
            totalCost: number;
            balanceStock: number;
        }[];
    } & {
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        userId: string;
    })[]>;
    create(userId: string, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        userId: string;
    }>;
    seedInitialProducts(userId: string): Promise<void>;
    createTransaction(userId: string, productId: string, type: TransactionType, quantity: number): Promise<{
        id: string;
        date: Date;
        productId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        quantity: number;
        unitCost: number;
        totalCost: number;
        balanceStock: number;
    }>;
}

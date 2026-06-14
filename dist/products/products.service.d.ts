import { PrismaService } from '../prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateProductDto } from './dto/products.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        transactions: {
            id: string;
            productId: string;
            type: import("@prisma/client").$Enums.TransactionType;
            quantity: number;
            unitCost: number;
            totalCost: number;
            balanceStock: number;
            date: Date;
        }[];
    } & {
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    })[]>;
    create(userId: string, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    }>;
    toggleIva(userId: string, productId: string): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    }>;
    seedInitialProducts(userId: string): Promise<void>;
    createTransaction(userId: string, productId: string, type: TransactionType, quantity: number): Promise<{
        id: string;
        productId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        quantity: number;
        unitCost: number;
        totalCost: number;
        balanceStock: number;
        date: Date;
    }>;
}

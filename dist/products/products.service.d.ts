import { PrismaService } from '../prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        } | null;
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
        categoryId: string | null;
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
        categoryId: string | null;
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
        categoryId: string | null;
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
    delete(userId: string, productId: string): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
        categoryId: string | null;
    }>;
    update(userId: string, productId: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        } | null;
    } & {
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
        categoryId: string | null;
    }>;
}

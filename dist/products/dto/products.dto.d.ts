import { TransactionType } from '@prisma/client';
export declare class CreateProductDto {
    sku: string;
    name: string;
    cost: number;
    price: number;
    stock?: number;
    hasIva?: boolean;
}
export declare class CreateTransactionDto {
    productId: string;
    type: TransactionType;
    quantity: number;
}

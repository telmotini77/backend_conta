import { TransactionType } from '@prisma/client';
export declare class CreateProductDto {
    sku: string;
    name: string;
    cost: number;
    price: number;
    stock?: number;
    hasIva?: boolean;
    categoryId?: string;
}
export declare class CreateTransactionDto {
    productId: string;
    type: TransactionType;
    quantity: number;
}
export declare class UpdateProductDto {
    price?: number;
    categoryId?: string;
    addedStock?: number;
}

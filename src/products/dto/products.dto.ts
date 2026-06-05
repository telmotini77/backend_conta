import { TransactionType } from '@prisma/client';

export class CreateProductDto {
  sku: string;
  name: string;
  cost: number;
  price: number;
  stock?: number;
}

export class CreateTransactionDto {
  productId: string;
  type: TransactionType;
  quantity: number;
}

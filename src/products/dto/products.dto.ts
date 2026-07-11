import { TransactionType } from '@prisma/client';

export class CreateProductDto {
  sku: string;
  name: string;
  cost: number;
  price: number;
  stock?: number;
  hasIva?: boolean;
  categoryId?: string;
}

export class CreateTransactionDto {
  productId: string;
  type: TransactionType;
  quantity: number;
}

export class UpdateProductDto {
  price?: number;
  categoryId?: string;
  addedStock?: number;
}


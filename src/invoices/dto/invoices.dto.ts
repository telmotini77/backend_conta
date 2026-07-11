export class InvoiceItemDto {
  productId: string;
  quantity: number;
}

export class CreateInvoiceDto {
  clientName: string;
  amount: number;
  hasIva?: boolean;
  ivaRate?: number;
  items?: InvoiceItemDto[];
}

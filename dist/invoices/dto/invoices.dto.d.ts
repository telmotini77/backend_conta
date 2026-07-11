export declare class InvoiceItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateInvoiceDto {
    clientName: string;
    amount: number;
    hasIva?: boolean;
    ivaRate?: number;
    items?: InvoiceItemDto[];
}

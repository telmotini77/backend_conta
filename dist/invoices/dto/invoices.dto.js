"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceDto = exports.InvoiceItemDto = void 0;
class InvoiceItemDto {
    productId;
    quantity;
}
exports.InvoiceItemDto = InvoiceItemDto;
class CreateInvoiceDto {
    clientName;
    amount;
    hasIva;
    ivaRate;
    items;
}
exports.CreateInvoiceDto = CreateInvoiceDto;
//# sourceMappingURL=invoices.dto.js.map
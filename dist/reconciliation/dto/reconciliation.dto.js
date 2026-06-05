"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchWithholdingDto = exports.CreateWithholdingDto = exports.CreateCashTransactionDto = void 0;
class CreateCashTransactionDto {
    type;
    source;
    amount;
    description;
    invoiceId;
    purchaseId;
}
exports.CreateCashTransactionDto = CreateCashTransactionDto;
class CreateWithholdingDto {
    numeroRetencion;
    claveAcceso;
    type;
    amountRenta;
    amountIva;
    amountTotal;
    date;
    clientOrProviderRuc;
    clientOrProviderName;
    invoiceId;
    purchaseId;
}
exports.CreateWithholdingDto = CreateWithholdingDto;
class MatchWithholdingDto {
    withholdingId;
    invoiceId;
    purchaseId;
}
exports.MatchWithholdingDto = MatchWithholdingDto;
//# sourceMappingURL=reconciliation.dto.js.map
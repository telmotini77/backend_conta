export class CreateCashTransactionDto {
  type: 'INGRESS' | 'EGRESS';
  source: 'SALE' | 'PURCHASE' | 'MANUAL';
  amount: number;
  description?: string;
  invoiceId?: string;
  purchaseId?: string;
}

export class CreateWithholdingDto {
  numeroRetencion: string;
  claveAcceso?: string;
  type: 'RECEIVED' | 'EMITTED';
  amountRenta?: number;
  amountIva?: number;
  amountTotal: number;
  date: string;
  clientOrProviderRuc: string;
  clientOrProviderName: string;
  invoiceId?: string;
  purchaseId?: string;
}

export class MatchWithholdingDto {
  withholdingId: string;
  invoiceId?: string;
  purchaseId?: string;
}

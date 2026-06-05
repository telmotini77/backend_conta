import { Injectable } from '@nestjs/common';

export interface ScrapedPurchaseItem {
  sku: string;
  quantity: number;
  unitCost: number;
}

export interface ScrapedPurchase {
  invoiceNum: string;
  claveAcceso: string;
  providerRuc: string;
  providerName: string;
  amount: number;
  date: Date;
  items?: ScrapedPurchaseItem[];
}

@Injectable()
export class SriScraperService {
  async scrapePurchases(userRuc: string): Promise<ScrapedPurchase[]> {
    console.log(`Iniciando scrape de compras para el RUC: ${userRuc}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const today = new Date();

    // We generate 3 realistic invoices from providers in Ecuador
    return [
      {
        invoiceNum: `001-002-${Math.floor(Math.random() * 900000) + 100000}`,
        claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117921445670012001002000${Math.floor(Math.random() * 900000) + 100000}123456781`,
        providerRuc: '1792144567001',
        providerName: 'TELCONET S.A. (Conectividad Internet)',
        amount: 89.6,
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // yesterday
      },
      {
        invoiceNum: `005-001-${Math.floor(Math.random() * 900000) + 100000}`,
        claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117900123450012005001000${Math.floor(Math.random() * 900000) + 100000}876543211`,
        providerRuc: '1790012345001',
        providerName: 'CORPORACION FAVORITA S.A. (Consumos y Limpieza)',
        amount: 145.2,
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        invoiceNum: `002-003-${Math.floor(Math.random() * 900000) + 100000}`,
        claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117912345670012002003000${Math.floor(Math.random() * 900000) + 100000}112233441`,
        providerRuc: '1791234567001',
        providerName: 'DISTRIBUIDORA TECNOLOGICA DEL ECUADOR',
        amount: 1350.0,
        date: new Date(today.getTime() - 12 * 60 * 60 * 1000), // today
        items: [
          { sku: 'COMP-001', quantity: 3, unitCost: 450.0 }, // Matches standard catalog SKU
        ],
      },
    ];
  }
}

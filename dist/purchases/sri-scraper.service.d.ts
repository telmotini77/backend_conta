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
export declare class SriScraperService {
    scrapePurchases(userRuc: string): Promise<ScrapedPurchase[]>;
}

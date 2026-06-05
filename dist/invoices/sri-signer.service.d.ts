export interface InvoiceData {
    clientName: string;
    amount: number;
    claveAcceso: string;
    createdAt: Date;
    ruc?: string;
    companyName?: string;
}
export declare class SriSignerService {
    generateInvoiceXml(data: InvoiceData): string;
    signXml(xmlContent: string, p12Buffer?: Buffer, passphrase?: string): string;
    private sha1Base64;
    private canonicalizeXml;
    private formatDate;
    private escapeXml;
    private generateMockP12;
}

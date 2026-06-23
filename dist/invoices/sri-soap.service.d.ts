export interface SriResponse {
    success: boolean;
    status: 'RECEIVED' | 'AUTHORIZED' | 'REJECTED';
    authNumber?: string;
    authDate?: string;
    errorMessage?: string;
    rawResponse?: string;
}
export declare class SriSoapService {
    private getUrls;
    sendToSri(signedXml: string, simulate?: boolean, environment?: string): Promise<SriResponse>;
    authorizeComprobante(claveAcceso: string, simulate?: boolean, environment?: string): Promise<SriResponse>;
    private parseReceptionResponse;
    private parseAuthorizationResponse;
}

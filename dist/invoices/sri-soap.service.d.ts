export interface SriResponse {
    success: boolean;
    status: 'RECEIVED' | 'AUTHORIZED' | 'REJECTED';
    authNumber?: string;
    authDate?: string;
    errorMessage?: string;
    rawResponse?: string;
}
export declare class SriSoapService {
    private readonly receptionUrl;
    private readonly authorizationUrl;
    sendToSri(signedXml: string, simulate?: boolean): Promise<SriResponse>;
    authorizeComprobante(claveAcceso: string, simulate?: boolean): Promise<SriResponse>;
    private parseReceptionResponse;
    private parseAuthorizationResponse;
}

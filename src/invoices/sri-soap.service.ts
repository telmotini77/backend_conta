import { Injectable } from '@nestjs/common';

export interface SriResponse {
  success: boolean;
  status: 'RECEIVED' | 'AUTHORIZED' | 'REJECTED';
  authNumber?: string;
  authDate?: string;
  errorMessage?: string;
  rawResponse?: string;
}

@Injectable()
export class SriSoapService {
  // SRI SOAP Endpoints (Sandbox/Testing by default)
  private readonly receptionUrl =
    'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline';
  private readonly authorizationUrl =
    'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';

  // Transmit XML to SRI Recepcion
  async sendToSri(signedXml: string, simulate = true): Promise<SriResponse> {
    if (simulate) {
      // Return a simulated successful reception response after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        success: true,
        status: 'RECEIVED',
      };
    }

    const xmlBase64 = Buffer.from(signedXml, 'utf8').toString('base64');
    const soapEnvelope =
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">` +
      `<soapenv:Header/>` +
      `<soapenv:Body>` +
      `<ec:validarComprobante>` +
      `<xml>${xmlBase64}</xml>` +
      `</ec:validarComprobante>` +
      `</soapenv:Body>` +
      `</soapenv:Envelope>`;

    try {
      const response = await fetch(this.receptionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        body: soapEnvelope,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseText = await response.text();
      return this.parseReceptionResponse(responseText);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('SRI SOAP Reception connection error:', errorMsg);
      return {
        success: false,
        status: 'REJECTED',
        errorMessage: `No se pudo conectar al SRI Recepción: ${errorMsg}. Entrando en modo simulado local.`,
      };
    }
  }

  // Check authorization status from SRI
  async authorizeComprobante(
    claveAcceso: string,
    simulate = true,
  ): Promise<SriResponse> {
    if (simulate) {
      // Return a simulated successful authorization response after 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const authNum = Math.floor(Math.random() * 900000000000) + 100000000000;
      return {
        success: true,
        status: 'AUTHORIZED',
        authNumber: `280520260117924558940012001002${authNum}`,
        authDate: new Date().toISOString(),
      };
    }

    const soapEnvelope =
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">` +
      `<soapenv:Header/>` +
      `<soapenv:Body>` +
      `<ec:autorizacionComprobante>` +
      `<claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>` +
      `</ec:autorizacionComprobante>` +
      `</soapenv:Body>` +
      `</soapenv:Envelope>`;

    try {
      const response = await fetch(this.authorizationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          SOAPAction: '',
        },
        body: soapEnvelope,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseText = await response.text();
      return this.parseAuthorizationResponse(responseText);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('SRI SOAP Authorization connection error:', errorMsg);
      return {
        success: false,
        status: 'RECEIVED', // remains as received to retry
        errorMessage: `No se pudo conectar al SRI Autorización: ${errorMsg}.`,
      };
    }
  }

  // Parse SOAP reception response
  private parseReceptionResponse(xml: string): SriResponse {
    const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/);
    const estado = estadoMatch ? estadoMatch[1] : null;

    if (estado === 'RECIBIDA') {
      return {
        success: true,
        status: 'RECEIVED',
        rawResponse: xml,
      };
    } else {
      const mensajeMatch = xml.match(/<mensaje>(.*?)<\/mensaje>/);
      const informacionAdicionalMatch = xml.match(
        /<informacionAdicional>(.*?)<\/informacionAdicional>/,
      );
      const detail = mensajeMatch
        ? mensajeMatch[1]
        : informacionAdicionalMatch
          ? informacionAdicionalMatch[1]
          : 'Error desconocido SRI';
      return {
        success: false,
        status: 'REJECTED',
        errorMessage: detail,
        rawResponse: xml,
      };
    }
  }

  // Parse SOAP authorization response
  private parseAuthorizationResponse(xml: string): SriResponse {
    const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/);
    const estado = estadoMatch ? estadoMatch[1] : null;

    if (estado === 'AUTORIZADO') {
      const numAuthMatch = xml.match(
        /<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/,
      );
      const fechaAuthMatch = xml.match(
        /<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/,
      );
      return {
        success: true,
        status: 'AUTHORIZED',
        authNumber: numAuthMatch ? numAuthMatch[1] : 'MOCK_AUTH_NUM',
        authDate: fechaAuthMatch ? fechaAuthMatch[1] : new Date().toISOString(),
        rawResponse: xml,
      };
    } else {
      const mensajeMatch = xml.match(/<mensaje>(.*?)<\/mensaje>/);
      const detail = mensajeMatch
        ? mensajeMatch[1]
        : 'Factura no autorizada por el SRI.';
      return {
        success: false,
        status: 'REJECTED',
        errorMessage: detail,
        rawResponse: xml,
      };
    }
  }
}

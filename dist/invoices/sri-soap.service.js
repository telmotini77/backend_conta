"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SriSoapService = void 0;
const common_1 = require("@nestjs/common");
let SriSoapService = class SriSoapService {
    getUrls(environment = '1') {
        const isProduction = environment === '2';
        const baseUrl = isProduction
            ? 'https://cel.sri.gob.ec'
            : 'https://celcer.sri.gob.ec';
        return {
            receptionUrl: `${baseUrl}/comprobantes-electronicos-ws/RecepcionComprobantesOffline`,
            authorizationUrl: `${baseUrl}/comprobantes-electronicos-ws/AutorizacionComprobantesOffline`,
        };
    }
    async sendToSri(signedXml, simulate = true, environment = '1') {
        if (simulate) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return {
                success: true,
                status: 'RECEIVED',
            };
        }
        const xmlBase64 = Buffer.from(signedXml, 'utf8').toString('base64');
        const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">` +
            `<soapenv:Header/>` +
            `<soapenv:Body>` +
            `<ec:validarComprobante>` +
            `<xml>${xmlBase64}</xml>` +
            `</ec:validarComprobante>` +
            `</soapenv:Body>` +
            `</soapenv:Envelope>`;
        const urls = this.getUrls(environment);
        try {
            const response = await fetch(urls.receptionUrl, {
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
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('SRI SOAP Reception connection error:', errorMsg);
            return {
                success: false,
                status: 'REJECTED',
                errorMessage: `No se pudo conectar al SRI Recepción (${urls.receptionUrl}): ${errorMsg}.`,
            };
        }
    }
    async authorizeComprobante(claveAcceso, simulate = true, environment = '1') {
        if (simulate) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const authNum = Math.floor(Math.random() * 900000000000) + 100000000000;
            return {
                success: true,
                status: 'AUTHORIZED',
                authNumber: `280520260117924558940012001002${authNum}`,
                authDate: new Date().toISOString(),
            };
        }
        const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">` +
            `<soapenv:Header/>` +
            `<soapenv:Body>` +
            `<ec:autorizacionComprobante>` +
            `<claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>` +
            `</ec:autorizacionComprobante>` +
            `</soapenv:Body>` +
            `</soapenv:Envelope>`;
        const urls = this.getUrls(environment);
        try {
            const response = await fetch(urls.authorizationUrl, {
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
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('SRI SOAP Authorization connection error:', errorMsg);
            return {
                success: false,
                status: 'RECEIVED',
                errorMessage: `No se pudo conectar al SRI Autorización (${urls.authorizationUrl}): ${errorMsg}.`,
            };
        }
    }
    parseReceptionResponse(xml) {
        const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/);
        const estado = estadoMatch ? estadoMatch[1] : null;
        if (estado === 'RECIBIDA') {
            return {
                success: true,
                status: 'RECEIVED',
                rawResponse: xml,
            };
        }
        else {
            const mensajeMatch = xml.match(/<mensaje>(.*?)<\/mensaje>/);
            const informacionAdicionalMatch = xml.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/);
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
    parseAuthorizationResponse(xml) {
        const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/);
        const estado = estadoMatch ? estadoMatch[1] : null;
        if (estado === 'AUTORIZADO') {
            const numAuthMatch = xml.match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/);
            const fechaAuthMatch = xml.match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/);
            return {
                success: true,
                status: 'AUTHORIZED',
                authNumber: numAuthMatch ? numAuthMatch[1] : 'MOCK_AUTH_NUM',
                authDate: fechaAuthMatch ? fechaAuthMatch[1] : new Date().toISOString(),
                rawResponse: xml,
            };
        }
        else {
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
};
exports.SriSoapService = SriSoapService;
exports.SriSoapService = SriSoapService = __decorate([
    (0, common_1.Injectable)()
], SriSoapService);
//# sourceMappingURL=sri-soap.service.js.map
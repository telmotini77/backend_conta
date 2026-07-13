"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SriSignerService = void 0;
const common_1 = require("@nestjs/common");
const forge = __importStar(require("node-forge"));
let SriSignerService = class SriSignerService {
    generateInvoiceXml(data) {
        const total = Number(data.amount);
        const ivaRate = data.ivaRate !== undefined ? Number(data.ivaRate) : 15;
        const base = ivaRate > 0 ? Number((total / (1 + ivaRate / 100)).toFixed(2)) : total;
        const iva = Number((total - base).toFixed(2));
        const dateStr = this.formatDate(data.createdAt);
        const companyName = data.companyName || 'AURA CONTABLE AUTÓNOMO S.A.';
        const companyRuc = data.ruc || '1792455894001';
        const env = data.environment || '1';
        const estab = data.establishmentCode || '001';
        const ptoEmi = data.emissionPoint || '002';
        const address = data.establishmentAddress || 'Av. de los Granados N45 y Eloy Alfaro, Quito';
        let codigoPorcentaje = '4';
        if (ivaRate === 0)
            codigoPorcentaje = '0';
        else if (ivaRate === 12)
            codigoPorcentaje = '2';
        else if (ivaRate === 14)
            codigoPorcentaje = '3';
        else if (ivaRate === 15)
            codigoPorcentaje = '4';
        else if (ivaRate === 5)
            codigoPorcentaje = '5';
        return (`<factura id="comprobante" version="1.1.0">` +
            `<infoTributaria>` +
            `<ambiente>${env}</ambiente>` +
            `<tipoEmision>1</tipoEmision>` +
            `<razonSocial>${this.escapeXml(companyName)}</razonSocial>` +
            `<nombreComercial>${this.escapeXml(companyName)}</nombreComercial>` +
            `<ruc>${companyRuc}</ruc>` +
            `<claveAcceso>${data.claveAcceso}</claveAcceso>` +
            `<codDoc>01</codDoc>` +
            `<estab>${estab}</estab>` +
            `<ptoEmi>${ptoEmi}</ptoEmi>` +
            `<secuencial>${data.claveAcceso.slice(30, 39)}</secuencial>` +
            `<dirMatriz>${this.escapeXml(address)}</dirMatriz>` +
            `</infoTributaria>` +
            `<infoFactura>` +
            `<fechaEmision>${dateStr}</fechaEmision>` +
            `<dirEstablecimiento>${this.escapeXml(address)}</dirEstablecimiento>` +
            `<obligadoContabilidad>SI</obligadoContabilidad>` +
            `<tipoIdentificacionComprador>05</tipoIdentificacionComprador>` +
            `<razonSocialComprador>${this.escapeXml(data.clientName)}</razonSocialComprador>` +
            `<identificacionComprador>1713567890</identificacionComprador>` +
            `<totalSinImpuestos>${base.toFixed(2)}</totalSinImpuestos>` +
            `<totalDescuento>0.00</totalDescuento>` +
            `<totalConImpuestos>` +
            `<totalImpuesto>` +
            `<codigo>2</codigo>` +
            `<codigoPorcentaje>${codigoPorcentaje}</codigoPorcentaje>` +
            `<baseImponible>${base.toFixed(2)}</baseImponible>` +
            `<valor>${iva.toFixed(2)}</valor>` +
            `</totalImpuesto>` +
            `</totalConImpuestos>` +
            `<propina>0.00</propina>` +
            `<importeTotal>${total.toFixed(2)}</importeTotal>` +
            `<moneda>DOLAR</moneda>` +
            `<pagos>` +
            `<pago>` +
            `<formaPago>20</formaPago>` +
            `<total>${total.toFixed(2)}</total>` +
            `</pago>` +
            `</pagos>` +
            `</infoFactura>` +
            `<detalles>` +
            `<detalle>` +
            `<codigoPrincipal>SERV-AURA</codigoPrincipal>` +
            `<descripcion>SERVICIOS CONTABLES AUTOMATIZADOS AURA</descripcion>` +
            `<cantidad>1.00</cantidad>` +
            `<precioUnitario>${base.toFixed(2)}</precioUnitario>` +
            `<descuento>0.00</descuento>` +
            `<precioTotalSinImpuesto>${base.toFixed(2)}</precioTotalSinImpuesto>` +
            `<impuestos>` +
            `<impuesto>` +
            `<codigo>2</codigo>` +
            `<codigoPorcentaje>${codigoPorcentaje}</codigoPorcentaje>` +
            `<tarifa>${ivaRate.toFixed(2)}</tarifa>` +
            `<baseImponible>${base.toFixed(2)}</baseImponible>` +
            `<valor>${iva.toFixed(2)}</valor>` +
            `</impuesto>` +
            `</impuestos>` +
            `</detalle>` +
            `</detalles>` +
            `</factura>`);
    }
    signXml(xmlContent, p12Buffer, passphrase) {
        let keys;
        let cert;
        if (p12Buffer && passphrase) {
            try {
                const p12Der = p12Buffer.toString('binary');
                const asn1 = forge.asn1.fromDer(p12Der);
                const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, passphrase);
                const bags = p12.getBags({
                    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
                });
                const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
                if (!keyBag) {
                    throw new Error('No private key bag found in PKCS12 file');
                }
                keys = { privateKey: keyBag.key };
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certBag = certBags[forge.pki.oids.certBag]?.[0];
                if (!certBag) {
                    throw new Error('No certificate bag found in PKCS12 file');
                }
                cert = certBag.cert;
            }
            catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error('Failed to load PKCS12 certificate, falling back to mock certificate:', errMsg);
                const devCert = this.generateMockP12();
                keys = devCert.keys;
                cert = devCert.cert;
            }
        }
        else {
            const devCert = this.generateMockP12();
            keys = devCert.keys;
            cert = devCert.cert;
        }
        if (!cert || !keys) {
            throw new Error('Certificate or keys were not loaded.');
        }
        const certDer = forge.asn1
            .toDer(forge.pki.certificateToAsn1(cert))
            .getBytes();
        const certBase64 = forge.util.encode64(certDer);
        const certDigest = this.sha1Base64(certDer);
        const rsaPublicKey = cert.publicKey;
        const modulusHex = rsaPublicKey.n.toString(16);
        const modulusBase64 = forge.util.encode64(forge.util.hexToBytes(modulusHex));
        const exponentHex = rsaPublicKey.e.toString(16);
        const exponentBase64 = forge.util.encode64(forge.util.hexToBytes(exponentHex));
        const issuerName = cert.issuer.attributes
            .map((attr) => `${attr.shortName || attr.name.toUpperCase()}=${attr.value}`)
            .join(', ');
        const serialNumber = parseInt(cert.serialNumber, 16).toString();
        const r = Math.floor(Math.random() * 900000) + 100000;
        const signatureId = `Signature${r}`;
        const signedPropertiesId = `Signature-SignedProperties${r}`;
        const signatureValueId = `SignatureValue${r}`;
        const certificateKeyInfoId = `CertificateKeyInfo${r}`;
        const signatureObjectId = `Signature-Object${r}`;
        const signedInfoId = `Signature-SignedInfo${r}`;
        const signingTime = new Date().toISOString();
        const cleanXml = this.canonicalizeXml(xmlContent);
        const invoiceDigest = this.sha1Base64(cleanXml);
        const signedPropertiesXml = `<etsi:SignedProperties Id="${signedPropertiesId}">` +
            `<etsi:SignedSignatureProperties>` +
            `<etsi:SigningTime>${signingTime}</etsi:SigningTime>` +
            `<etsi:SigningCertificate>` +
            `<etsi:Cert>` +
            `<etsi:CertDigest>` +
            `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
            `<ds:DigestValue>${certDigest}</ds:DigestValue>` +
            `</etsi:CertDigest>` +
            `<etsi:IssuerSerial>` +
            `<ds:X509IssuerName>${issuerName}</ds:X509IssuerName>` +
            `<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>` +
            `</etsi:IssuerSerial>` +
            `</etsi:Cert>` +
            `</etsi:SigningCertificate>` +
            `</etsi:SignedSignatureProperties>` +
            `</etsi:SignedProperties>`;
        const signedPropertiesDigest = this.sha1Base64(signedPropertiesXml);
        const keyInfoXml = `<ds:KeyInfo Id="${certificateKeyInfoId}">` +
            `<ds:X509Data>` +
            `<ds:X509Certificate>${certBase64.replace(/\r?\n|\r/g, '')}</ds:X509Certificate>` +
            `</ds:X509Data>` +
            `<ds:KeyValue>` +
            `<ds:RSAKeyValue>` +
            `<ds:Modulus>${modulusBase64.replace(/\r?\n|\r/g, '')}</ds:Modulus>` +
            `<ds:Exponent>${exponentBase64.replace(/\r?\n|\r/g, '')}</ds:Exponent>` +
            `</ds:RSAKeyValue>` +
            `</ds:KeyValue>` +
            `</ds:KeyInfo>`;
        const keyInfoDigest = this.sha1Base64(keyInfoXml);
        const signedInfoXml = `<ds:SignedInfo Id="${signedInfoId}">` +
            `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
            `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
            `<ds:Reference Id="SignedPropertiesID${r}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}">` +
            `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
            `<ds:DigestValue>${signedPropertiesDigest}</ds:DigestValue>` +
            `</ds:Reference>` +
            `<ds:Reference Id="CertificateKeyInfo${r}" URI="#${certificateKeyInfoId}">` +
            `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
            `<ds:DigestValue>${keyInfoDigest}</ds:DigestValue>` +
            `</ds:Reference>` +
            `<ds:Reference Id="Reference-ID-Comprobante" URI="#comprobante">` +
            `<ds:Transforms>` +
            `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
            `</ds:Transforms>` +
            `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
            `<ds:DigestValue>${invoiceDigest}</ds:DigestValue>` +
            `</ds:Reference>` +
            `</ds:SignedInfo>`;
        const md = forge.md.sha1.create();
        md.update(signedInfoXml, 'utf8');
        const signatureBytes = keys.privateKey.sign(md);
        const signatureBase64 = forge.util.encode64(signatureBytes);
        const signatureXml = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">` +
            signedInfoXml +
            `<ds:SignatureValue Id="${signatureValueId}">${signatureBase64.replace(/\r?\n|\r/g, '')}</ds:SignatureValue>` +
            keyInfoXml +
            `<ds:Object Id="${signatureObjectId}">` +
            `<etsi:QualifyingProperties Target="#${signatureId}">` +
            signedPropertiesXml +
            `</etsi:QualifyingProperties>` +
            `</ds:Object>` +
            `</ds:Signature>`;
        const closingTagIndex = cleanXml.lastIndexOf('</');
        if (closingTagIndex === -1) {
            throw new Error('Invalid XML structure generated.');
        }
        return (cleanXml.substring(0, closingTagIndex) +
            signatureXml +
            cleanXml.substring(closingTagIndex));
    }
    sha1Base64(data) {
        const md = forge.md.sha1.create();
        md.update(data, 'utf8');
        return forge.util.encode64(md.digest().getBytes());
    }
    canonicalizeXml(xml) {
        return xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    }
    formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '&':
                    return '&amp;';
                case "'":
                    return '&apos;';
                case '"':
                    return '&quot;';
                default:
                    return c;
            }
        });
    }
    generateMockP12() {
        const keys = forge.pki.rsa.generateKeyPair(1024);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        const attrs = [
            { name: 'commonName', value: 'Aura Contable Dev Certificate' },
            { name: 'countryName', value: 'EC' },
            { name: 'organizationName', value: 'Aura Contable S.A.' },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey);
        return { keys: { privateKey: keys.privateKey }, cert };
    }
};
exports.SriSignerService = SriSignerService;
exports.SriSignerService = SriSignerService = __decorate([
    (0, common_1.Injectable)()
], SriSignerService);
//# sourceMappingURL=sri-signer.service.js.map
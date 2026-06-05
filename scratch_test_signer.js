const forge = require('node-forge');
const crypto = require('crypto');
const fs = require('fs');

// Helper to calculate SHA-1 digest in Base64
function sha1Base64(data) {
  const md = forge.md.sha1.create();
  md.update(data, 'utf8');
  return forge.util.encode64(md.digest().getBytes());
}

// Simple XML canonicalizer (removes formatting spaces between tags for verification digest)
function canonicalizeXml(xml) {
  return xml
    .replace(/>\s+</g, '><') // remove whitespace between tags
    .replace(/\s+/g, ' ')   // normalize whitespace
    .trim();
}

function generateMockP12() {
  console.log('Generating temporary self-signed RSA key and certificate...');
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{
    name: 'commonName',
    value: 'Aura Contable Dev Cert'
  }, {
    name: 'countryName',
    value: 'EC'
  }, {
    name: 'organizationName',
    value: 'Aura Contable'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  return { keys, cert };
}

function signInvoice(xmlContent, keys, cert) {
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const certBase64 = forge.util.encode64(certDer);
  const certDigest = sha1Base64(certDer);

  // Extract modulus and exponent
  const modulusHex = keys.publicKey.n.toString(16);
  const modulusBase64 = forge.util.encode64(forge.util.hexToBytes(modulusHex));
  const exponentHex = keys.publicKey.e.toString(16);
  const exponentBase64 = forge.util.encode64(forge.util.hexToBytes(exponentHex));

  // Certificate issuer distinguished name
  // SRI Ecuador requires a specific format for issuer name, standard RFC 2253 style
  const issuerName = cert.issuer.attributes
    .map(attr => `${attr.shortName || attr.name.toUpperCase()}=${attr.value}`)
    .join(', ');
  const serialNumber = parseInt(cert.serialNumber, 16).toString();

  // Signature IDs
  const r = Math.floor(Math.random() * 900000) + 100000;
  const signatureId = `Signature${r}`;
  const signedPropertiesId = `Signature-SignedProperties${r}`;
  const signatureValueId = `SignatureValue${r}`;
  const certificateKeyInfoId = `CertificateKeyInfo${r}`;
  const signatureObjectId = `Signature-Object${r}`;
  const signedInfoId = `Signature-SignedInfo${r}`;

  // Time
  const signingTime = new Date().toISOString();

  // Canonicalize the original XML
  const cleanXml = canonicalizeXml(xmlContent);
  const invoiceDigest = sha1Base64(cleanXml);

  // 1. Build SignedProperties XML (need to digest it)
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
  const signedPropertiesDigest = sha1Base64(signedPropertiesXml);

  // 2. Build KeyInfo XML (need to digest it)
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
  const keyInfoDigest = sha1Base64(keyInfoXml);

  // 3. Build SignedInfo XML (which we actually sign)
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

  // Sign SignedInfo using private key
  const md = forge.md.sha1.create();
  md.update(signedInfoXml, 'utf8');
  const signatureBytes = keys.privateKey.sign(md);
  const signatureBase64 = forge.util.encode64(signatureBytes);

  // 4. Assemble the full <ds:Signature>
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

  // Insert signature XML before the closing tag of the root element
  const closingTagIndex = cleanXml.lastIndexOf('</');
  if (closingTagIndex === -1) {
    throw new Error('Invalid XML');
  }

  const signedXml = cleanXml.substring(0, closingTagIndex) + signatureXml + cleanXml.substring(closingTagIndex);
  return signedXml;
}

const mockXml = `<factura id="comprobante" version="1.1.0">` +
  `<infoTributaria>` +
    `<ambiente>1</ambiente>` +
    `<tipoEmision>1</tipoEmision>` +
    `<razonSocial>Contribuyente Prueba</razonSocial>` +
    `<ruc>1792455894001</ruc>` +
    `<claveAcceso>2805202601179245589400110010020000456121234567814</claveAcceso>` +
    `<codDoc>01</codDoc>` +
    `<estab>001</estab>` +
    `<ptoEmi>002</ptoEmi>` +
    `<secuencial>000045612</secuencial>` +
  `</infoTributaria>` +
  `<infoFactura>` +
    `<fechaEmision>28/05/2026</fechaEmision>` +
    `<importeTotal>115.00</importeTotal>` +
  `</infoFactura>` +
`</factura>`;

const { keys, cert } = generateMockP12();
const signed = signInvoice(mockXml, keys, cert);
console.log('Signed XML successfully!');
console.log(signed.substring(0, 500) + ' ... [TRUNCATED] ... ' + signed.substring(signed.length - 200));

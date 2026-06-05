import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
import { InvoiceStatus } from '@prisma/client';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private sriSigner: SriSignerService,
    private sriSoap: SriSoapService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Modulo 11 verification digit calculator for SRI Clave de Acceso
  private getModulo11Digit(key: string): string {
    let multiplier = 2;
    let sum = 0;
    for (let i = key.length - 1; i >= 0; i--) {
      sum += parseInt(key[i], 10) * multiplier;
      multiplier++;
      if (multiplier > 7) {
        multiplier = 2;
      }
    }
    const remainder = sum % 11;
    const digit = 11 - remainder;
    if (digit === 11) return '0';
    if (digit === 10) return '1';
    return digit.toString();
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException(
        'El monto de la factura debe ser mayor a 0.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Contribuyente/usuario no encontrado.');
    }

    // Generate a real 49-digit access key
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeCode = '01'; // Factura
    const ruc = user.ruc;
    const environment = '1'; // 1 = Pruebas, 2 = Producción
    const series = '001002';
    const sequential = Math.floor(
      Math.random() * 900000000 + 100000000,
    ).toString(); // 9 digits
    const numericCode = Math.floor(
      Math.random() * 90000000 + 10000000,
    ).toString(); // 8 digits
    const mode = '1'; // Normal

    const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${environment}${series}${sequential}${numericCode}${mode}`;
    const verifyDigit = this.getModulo11Digit(keyWithoutVerify);
    const accessKey = `${keyWithoutVerify}${verifyDigit}`;

    // 1. Generate XML Invoice structure
    const rawXml = this.sriSigner.generateInvoiceXml({
      clientName: dto.clientName,
      amount: Number(dto.amount),
      claveAcceso: accessKey,
      createdAt: new Date(),
      ruc: user.ruc,
      companyName: user.name,
    });

    // 2. Perform XAdES-BES cryptographic signature
    const signedXml = this.sriSigner.signXml(rawXml);

    // 3. Send SOAP envelope to SRI Recepcion
    // Using simulated responses for dev, but fully operational code path
    const reception = await this.sriSoap.sendToSri(signedXml, true);

    const invoiceStatus =
      reception.status === 'RECEIVED'
        ? InvoiceStatus.RECEIVED
        : InvoiceStatus.REJECTED;

    const invoice = await this.prisma.invoice.create({
      data: {
        claveAcceso: accessKey,
        clientName: dto.clientName,
        amount: Number(dto.amount),
        status: invoiceStatus,
        userId,
      },
    });

    // 4. Background check for authorization
    if (invoiceStatus === InvoiceStatus.RECEIVED) {
      setTimeout(() => {
        void (async () => {
          try {
            const authResult = await this.sriSoap.authorizeComprobante(
              accessKey,
              true,
            );
            await this.prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status:
                  authResult.status === 'AUTHORIZED'
                    ? InvoiceStatus.AUTHORIZED
                    : InvoiceStatus.REJECTED,
              },
            });
          } catch (err) {
            console.error(
              'Error in background SRI invoice authorization:',
              err,
            );
          }
        })();
      }, 4000);
    }

    return invoice;
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
import { InvoiceStatus } from '@prisma/client';
import { SriSignerService } from './sri-signer.service';
import { SriSoapService } from './sri-soap.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private sriSigner: SriSignerService,
    private sriSoap: SriSoapService,
    private accountingService: AccountingService,
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

    // Determine subtotal and IVA (Ecuador default: 15% IVA)
    const hasIva = dto.hasIva !== false;
    const amount = Number(dto.amount);
    let subtotal = amount;
    let iva = 0;

    const ivaRate = dto.ivaRate !== undefined ? Number(dto.ivaRate) : 15;

    if (hasIva) {
      subtotal = Number((amount / (1 + ivaRate / 100)).toFixed(2));
      iva = Number((amount - subtotal).toFixed(2));
    }

    // Generate a real 49-digit access key
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeCode = '01'; // Factura
    const ruc = user.ruc;
    const environment = user.sriEnvironment || '1'; // 1 = Pruebas, 2 = Producción
    const series = '001002';
    const sequential = Math.floor(
      Math.random() * 900000000 + 100000000
    ).toString(); // 9 digits
    const numericCode = Math.floor(
      Math.random() * 90000000 + 10000000
    ).toString(); // 8 digits
    const mode = '1'; // Normal

    const keyWithoutVerify = `${dateStr}${typeCode}${ruc}${environment}${series}${sequential}${numericCode}${mode}`;
    const verifyDigit = this.getModulo11Digit(keyWithoutVerify);
    const accessKey = `${keyWithoutVerify}${verifyDigit}`;

    // 1. Generate XML Invoice structure
    const rawXml = this.sriSigner.generateInvoiceXml({
      clientName: dto.clientName,
      amount: amount,
      claveAcceso: accessKey,
      createdAt: new Date(),
      ruc: user.ruc,
      companyName: user.name,
      environment: environment,
      ivaRate: hasIva ? ivaRate : 0,
    });

    // 2. Perform XAdES-BES cryptographic signature
    const p12Buffer = user.signatureBase64
      ? Buffer.from(user.signatureBase64, 'base64')
      : undefined;
    const signedXml = this.sriSigner.signXml(
      rawXml,
      p12Buffer,
      user.signaturePassword || undefined,
    );

    // 3. Send SOAP envelope to SRI Recepcion
    const reception = await this.sriSoap.sendToSri(
      signedXml,
      user.sriSimulate,
      environment,
    );

    const invoiceStatus =
      reception.status === 'RECEIVED'
        ? InvoiceStatus.RECEIVED
        : InvoiceStatus.REJECTED;

    const invoice = await this.prisma.invoice.create({
      data: {
        claveAcceso: accessKey,
        clientName: dto.clientName,
        amount: amount,
        subtotal: subtotal,
        iva: iva,
        status: invoiceStatus,
        userId,
      },
    });

    // Automatic Accounting Journal Entry
    try {
      await this.accountingService.createAutomaticEntry(userId, {
        type: 'SALE',
        description: `Venta Factura #${sequential} a ${dto.clientName}`,
        invoiceId: invoice.id,
        lines: [
          {
            accountCode: '1.01.02',
            accountName: 'Cuentas por Cobrar Clientes',
            debit: amount,
            credit: 0,
          },
          {
            accountCode: '4.01.01',
            accountName: 'Ventas de Servicios/Mercaderías',
            debit: 0,
            credit: subtotal,
          },
          ...(iva > 0
            ? [
                {
                  accountCode: '2.01.03',
                  accountName: 'IVA Ventas Cobrado',
                  debit: 0,
                  credit: iva,
                },
              ]
            : []),
        ],
      });
    } catch (err) {
      console.error('Failed to log automatic sales entry:', err);
    }

    // 4. Background check for authorization
    if (invoiceStatus === InvoiceStatus.RECEIVED) {
      setTimeout(() => {
        void (async () => {
          try {
            const authResult = await this.sriSoap.authorizeComprobante(
              accessKey,
              user.sriSimulate,
              environment,
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

  async sendInvoiceToClient(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada.');
    }

    // Simulate sending email/dispatch to customer
    await new Promise((resolve) => setTimeout(resolve, 800));

    return this.prisma.invoice.update({
      where: { id },
      data: {
        sentToClient: true,
      },
    });
  }

  async getInvoiceXml(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: { user: true },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada.');
    }

    return this.sriSigner.generateInvoiceXml({
      clientName: invoice.clientName,
      amount: invoice.amount,
      claveAcceso: invoice.claveAcceso,
      createdAt: invoice.createdAt,
      ruc: invoice.user.ruc,
      companyName: invoice.user.name,
    });
  }
}

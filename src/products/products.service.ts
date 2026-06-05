import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateProductDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.product.findMany({
      where: { userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(userId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { sku: dto.sku, userId },
    });
    if (existing) {
      throw new BadRequestException('El producto con este SKU ya existe.');
    }
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        cost: Number(dto.cost),
        price: Number(dto.price),
        stock: Number(dto.stock || 0),
        userId,
      },
    });
  }

  async seedInitialProducts(userId: string) {
    const count = await this.prisma.product.count({ where: { userId } });
    if (count === 0) {
      await this.prisma.product.createMany({
        data: [
          {
            sku: `COMP-${userId.slice(0, 4)}`,
            name: 'Computadora Portátil Intel i7',
            stock: 15,
            cost: 450,
            price: 800,
            userId,
          },
          {
            sku: `SMART-${userId.slice(0, 4)}`,
            name: 'Smartphone Android Pro',
            stock: 24,
            cost: 280,
            price: 500,
            userId,
          },
          {
            sku: `MON-${userId.slice(0, 4)}`,
            name: 'Monitor Gamer 27"',
            stock: 8,
            cost: 120,
            price: 250,
            userId,
          },
        ],
      });
    }
  }

  async createTransaction(
    userId: string,
    productId: string,
    type: TransactionType,
    quantity: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado.');
    }

    if (type === TransactionType.EGRESS && product.stock < quantity) {
      throw new BadRequestException('Stock insuficiente.');
    }

    const newStock =
      type === TransactionType.INGRESS
        ? product.stock + quantity
        : product.stock - quantity;

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      return tx.kardexTransaction.create({
        data: {
          productId,
          type,
          quantity,
          unitCost: product.cost,
          totalCost: product.cost * quantity,
          balanceStock: newStock,
        },
      });
    });
  }
}

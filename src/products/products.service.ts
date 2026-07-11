import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
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
        hasIva: dto.hasIva !== false,
        userId,
        categoryId: dto.categoryId || null,
      },
    });
  }

  async toggleIva(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado.');
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { hasIva: !product.hasIva },
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
            hasIva: true,
            userId,
          },
          {
            sku: `SMART-${userId.slice(0, 4)}`,
            name: 'Smartphone Android Pro',
            stock: 24,
            cost: 280,
            price: 500,
            hasIva: true,
            userId,
          },
          {
            sku: `MON-${userId.slice(0, 4)}`,
            name: 'Monitor Gamer 27"',
            stock: 8,
            cost: 120,
            price: 250,
            hasIva: true,
            userId,
          },
          {
            sku: `BOOK-${userId.slice(0, 4)}`,
            name: 'Libro de Contabilidad General (Ecuador)',
            stock: 30,
            cost: 12,
            price: 25,
            hasIva: false,
            userId,
          },
          {
            sku: `MILK-${userId.slice(0, 4)}`,
            name: 'Leche Semidescremada 1L (Canasta Básica)',
            stock: 50,
            cost: 0.75,
            price: 1.10,
            hasIva: false,
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

    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    return this.prisma.kardexTransaction.create({
      data: {
        productId,
        type,
        quantity,
        unitCost: product.cost,
        totalCost: product.cost * quantity,
        balanceStock: newStock,
      },
    });
  }

  async delete(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado.');
    }
    // Delete related KardexTransactions first
    await this.prisma.kardexTransaction.deleteMany({
      where: { productId },
    });
    // Delete the product itself
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId },
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado.');
    }

    const updateData: any = {};
    if (dto.price !== undefined) {
      updateData.price = Number(dto.price);
    }
    if (dto.categoryId !== undefined) {
      updateData.categoryId = dto.categoryId || null;
    }

    if (dto.addedStock && Number(dto.addedStock) > 0) {
      const addedQty = Number(dto.addedStock);
      const newStock = product.stock + addedQty;
      updateData.stock = newStock;

      // Register an INGRESS Kardex transaction for consistency
      await this.prisma.kardexTransaction.create({
        data: {
          productId,
          type: TransactionType.INGRESS,
          quantity: addedQty,
          unitCost: product.cost,
          totalCost: product.cost * addedQty,
          balanceStock: newStock,
        },
      });
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });
  }
}

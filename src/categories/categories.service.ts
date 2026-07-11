import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, name: string) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre de la categoría es requerido.');
    }
    const cleanName = name.trim();
    const existing = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: cleanName,
          mode: 'insensitive',
        },
        userId,
      },
    });
    if (existing) {
      throw new BadRequestException('La categoría ya existe.');
    }
    return this.prisma.category.create({
      data: {
        name: cleanName,
        userId,
      },
    });
  }
}

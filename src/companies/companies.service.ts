import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.company.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    data: { type: string; identification: string; name: string; description: string },
  ) {
    const { type, identification, name, description } = data;

    if (!type || !identification || !name) {
      throw new BadRequestException('Tipo, Identificación y Razón Social son requeridos.');
    }

    const existing = await this.prisma.company.findFirst({
      where: { userId, identification },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una empresa registrada con esa identificación.');
    }

    // Auto-generate DB Name: db_cleanName_identification
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/(^_|_$)/g, '');
    const dbName = `db_${cleanName}_${identification}`;

    return this.prisma.company.create({
      data: {
        type,
        identification,
        name,
        description: description || '',
        dbName,
        userId,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { type: string; identification: string; name: string; description: string },
  ) {
    const { type, identification, name, description } = data;

    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company || company.userId !== userId) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    if (identification !== company.identification) {
      const duplicate = await this.prisma.company.findFirst({
        where: { userId, identification },
      });
      if (duplicate) {
        throw new BadRequestException('Ya existe otra empresa registrada con esa identificación.');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        type: type || company.type,
        identification: identification || company.identification,
        name: name || company.name,
        description: description !== undefined ? description : company.description,
      },
    });
  }

  async remove(userId: string, id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company || company.userId !== userId) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    return this.prisma.company.delete({
      where: { id },
    });
  }
}

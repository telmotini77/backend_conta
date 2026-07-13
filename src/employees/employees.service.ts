import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(ownerId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { ownerId },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return employees;
  }

  async create(ownerId: string, dto: { name: string; email: string; password: string }) {
    // Check if email already taken (user or employee)
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('El correo ya pertenece a una cuenta de empresa.');

    const existingEmployee = await this.prisma.employee.findUnique({ where: { email: dto.email } });
    if (existingEmployee) throw new BadRequestException('El correo ya está registrado para otro empleado.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const employee = await this.prisma.employee.create({
      data: { name: dto.name, email: dto.email, password: hashed, ownerId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return employee;
  }

  async remove(id: string, ownerId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Empleado no encontrado.');
    if (employee.ownerId !== ownerId) throw new ForbiddenException('No autorizado.');
    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }
}

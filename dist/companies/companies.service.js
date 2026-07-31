"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.company.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(userId, data) {
        const { type, identification, name, description } = data;
        if (!type || !identification || !name) {
            throw new common_1.BadRequestException('Tipo, Identificación y Razón Social son requeridos.');
        }
        const existing = await this.prisma.company.findFirst({
            where: { userId, identification },
        });
        if (existing) {
            throw new common_1.BadRequestException('Ya existe una empresa registrada con esa identificación.');
        }
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
    async update(userId, id, data) {
        const { type, identification, name, description } = data;
        const company = await this.prisma.company.findUnique({
            where: { id },
        });
        if (!company || company.userId !== userId) {
            throw new common_1.NotFoundException('Empresa no encontrada.');
        }
        if (identification !== company.identification) {
            const duplicate = await this.prisma.company.findFirst({
                where: { userId, identification },
            });
            if (duplicate) {
                throw new common_1.BadRequestException('Ya existe otra empresa registrada con esa identificación.');
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
    async remove(userId, id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
        });
        if (!company || company.userId !== userId) {
            throw new common_1.NotFoundException('Empresa no encontrada.');
        }
        return this.prisma.company.delete({
            where: { id },
        });
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map
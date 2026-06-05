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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AssetsService = class AssetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.asset.findMany({
            where: { userId },
            orderBy: { purchaseDate: 'desc' },
        });
    }
    async create(userId, dto) {
        if (dto.value <= 0) {
            throw new common_1.BadRequestException('El valor de adquisición debe ser mayor a 0.');
        }
        if (dto.residualValue >= dto.value) {
            throw new common_1.BadRequestException('El valor residual no puede ser mayor o igual al valor de adquisición.');
        }
        return this.prisma.asset.create({
            data: {
                name: dto.name,
                value: Number(dto.value),
                residualValue: Number(dto.residualValue),
                yearsOfLife: Number(dto.yearsOfLife),
                userId,
            },
        });
    }
    async getDepreciations(userId) {
        return this.prisma.depreciationEntry.findMany({
            where: {
                asset: { userId },
            },
            include: {
                asset: true,
            },
            orderBy: { period: 'desc' },
        });
    }
    async generateMonthlyDepreciations(userId, period) {
        if (!/^\d{4}-\d{2}$/.test(period)) {
            throw new common_1.BadRequestException('Formato de período inválido. Debe ser AAAA-MM.');
        }
        const assets = await this.prisma.asset.findMany({
            where: { userId },
        });
        const generated = [];
        for (const asset of assets) {
            const existing = await this.prisma.depreciationEntry.findFirst({
                where: {
                    assetId: asset.id,
                    period,
                },
            });
            if (existing) {
                continue;
            }
            const depreciableValue = asset.value - asset.residualValue;
            if (depreciableValue <= 0)
                continue;
            const monthlyAmount = Number((depreciableValue / (asset.yearsOfLife * 12)).toFixed(2));
            const entry = await this.prisma.depreciationEntry.create({
                data: {
                    assetId: asset.id,
                    amount: monthlyAmount,
                    period,
                },
                include: {
                    asset: true,
                },
            });
            generated.push(entry);
        }
        return generated;
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map
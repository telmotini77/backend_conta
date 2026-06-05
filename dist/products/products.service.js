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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
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
    async create(userId, dto) {
        const existing = await this.prisma.product.findFirst({
            where: { sku: dto.sku, userId },
        });
        if (existing) {
            throw new common_1.BadRequestException('El producto con este SKU ya existe.');
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
    async seedInitialProducts(userId) {
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
    async createTransaction(userId, productId, type, quantity) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, userId },
        });
        if (!product) {
            throw new common_1.BadRequestException('Producto no encontrado.');
        }
        if (type === client_1.TransactionType.EGRESS && product.stock < quantity) {
            throw new common_1.BadRequestException('Stock insuficiente.');
        }
        const newStock = type === client_1.TransactionType.INGRESS
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map
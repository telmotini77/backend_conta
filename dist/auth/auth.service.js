"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async signup(dto) {
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingEmail) {
            throw new common_1.BadRequestException('El correo electrónico ya está registrado.');
        }
        const existingRuc = await this.prisma.user.findUnique({
            where: { ruc: dto.ruc },
        });
        if (existingRuc) {
            throw new common_1.BadRequestException('El RUC ya está registrado.');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                ruc: dto.ruc,
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            ruc: user.ruc,
            createdAt: user.createdAt,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const payload = { email: user.email, sub: user.id };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                ruc: user.ruc,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async loginEmployee(dto) {
        const employee = await this.prisma.employee.findUnique({
            where: { email: dto.email },
            include: { owner: true },
        });
        if (employee) {
            const isPasswordValid = await bcrypt.compare(dto.password, employee.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Credenciales incorrectas.');
            }
            const payload = { email: employee.email, sub: employee.id, role: 'employee', ownerId: employee.ownerId };
            return {
                user: {
                    id: employee.id,
                    email: employee.email,
                    name: employee.name,
                    role: 'employee',
                    ownerId: employee.ownerId,
                    ownerRuc: employee.owner.ruc,
                    ownerName: employee.owner.name,
                },
                accessToken: this.jwtService.sign(payload),
            };
        }
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const payload = { email: user.email, sub: user.id, role: 'owner', ownerId: user.id };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: 'owner',
                ownerId: user.id,
                ownerRuc: user.ruc,
                ownerName: user.name,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async getSriConfig(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('Usuario no encontrado');
        }
        return {
            sriSimulate: user.sriSimulate,
            sriEnvironment: user.sriEnvironment,
            hasSignature: !!user.signatureBase64,
            signaturePasswordLength: user.signaturePassword ? user.signaturePassword.length : 0,
            isBranch: user.isBranch,
            parentCompanyRuc: user.parentCompanyRuc,
            establishmentCode: user.establishmentCode,
            emissionPoint: user.emissionPoint,
            establishmentAddress: user.establishmentAddress,
        };
    }
    async getSriConfigInternal(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('Usuario no encontrado');
        }
        return {
            signatureBase64: user.signatureBase64,
            signaturePassword: user.signaturePassword,
            isBranch: user.isBranch,
            parentCompanyRuc: user.parentCompanyRuc,
            establishmentCode: user.establishmentCode,
            emissionPoint: user.emissionPoint,
            establishmentAddress: user.establishmentAddress,
        };
    }
    async updateSriConfig(userId, dto) {
        const updateData = {
            sriSimulate: dto.sriSimulate,
            sriEnvironment: dto.sriEnvironment,
        };
        if (dto.signatureBase64 !== undefined) {
            updateData.signatureBase64 = dto.signatureBase64 || null;
        }
        if (dto.signaturePassword !== undefined) {
            updateData.signaturePassword = dto.signaturePassword || null;
        }
        if (dto.isBranch !== undefined) {
            updateData.isBranch = dto.isBranch;
        }
        if (dto.parentCompanyRuc !== undefined) {
            updateData.parentCompanyRuc = dto.parentCompanyRuc || null;
        }
        if (dto.establishmentCode !== undefined) {
            updateData.establishmentCode = dto.establishmentCode;
        }
        if (dto.emissionPoint !== undefined) {
            updateData.emissionPoint = dto.emissionPoint;
        }
        if (dto.establishmentAddress !== undefined) {
            updateData.establishmentAddress = dto.establishmentAddress;
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        return {
            success: true,
            sriSimulate: user.sriSimulate,
            sriEnvironment: user.sriEnvironment,
            hasSignature: !!user.signatureBase64,
            isBranch: user.isBranch,
            parentCompanyRuc: user.parentCompanyRuc,
            establishmentCode: user.establishmentCode,
            emissionPoint: user.emissionPoint,
            establishmentAddress: user.establishmentAddress,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signup(dto: SignupDto): Promise<{
        id: string;
        email: string;
        name: string;
        ruc: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            ruc: string;
            province: string;
            city: string;
            whatsapp: string;
            businessTypes: string[];
            establishmentAddress: string;
        };
        accessToken: string;
    }>;
    loginEmployee(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            ownerId: string;
            ownerRuc: string;
            ownerName: string;
            province?: undefined;
            city?: undefined;
            whatsapp?: undefined;
            businessTypes?: undefined;
            establishmentAddress?: undefined;
        };
        accessToken: string;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            ownerId: string;
            ownerRuc: string;
            ownerName: string;
            province: string;
            city: string;
            whatsapp: string;
            businessTypes: string[];
            establishmentAddress: string;
        };
        accessToken: string;
    }>;
    getSriConfig(userId: string): Promise<{
        sriSimulate: boolean;
        sriEnvironment: string;
        hasSignature: boolean;
        signaturePasswordLength: number;
        isBranch: boolean;
        parentCompanyRuc: string | null;
        establishmentCode: string;
        emissionPoint: string;
        establishmentAddress: string;
    }>;
    getSriConfigInternal(userId: string): Promise<{
        signatureBase64: string | null;
        signaturePassword: string | null;
        isBranch: boolean;
        parentCompanyRuc: string | null;
        establishmentCode: string;
        emissionPoint: string;
        establishmentAddress: string;
    }>;
    updateSriConfig(userId: string, dto: {
        sriSimulate: boolean;
        sriEnvironment: string;
        signatureBase64?: string;
        signaturePassword?: string;
        isBranch?: boolean;
        parentCompanyRuc?: string;
        establishmentCode?: string;
        emissionPoint?: string;
        establishmentAddress?: string;
    }): Promise<{
        success: boolean;
        sriSimulate: boolean;
        sriEnvironment: string;
        hasSignature: boolean;
        isBranch: boolean;
        parentCompanyRuc: string | null;
        establishmentCode: string;
        emissionPoint: string;
        establishmentAddress: string;
    }>;
}

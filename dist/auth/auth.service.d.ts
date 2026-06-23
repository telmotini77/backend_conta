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
        };
        accessToken: string;
    }>;
    getSriConfig(userId: string): Promise<{
        sriSimulate: boolean;
        sriEnvironment: string;
        hasSignature: boolean;
        signaturePasswordLength: number;
    }>;
    updateSriConfig(userId: string, dto: {
        sriSimulate: boolean;
        sriEnvironment: string;
        signatureBase64?: string;
        signaturePassword?: string;
    }): Promise<{
        success: boolean;
        sriSimulate: boolean;
        sriEnvironment: string;
        hasSignature: boolean;
    }>;
}

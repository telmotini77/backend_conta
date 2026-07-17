import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        role?: string;
        ownerId?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        ruc: string;
        province: string;
        city: string;
        whatsapp: string;
        businessTypes: string[];
        establishmentAddress: string;
        isEmployee: boolean;
        employeeId: string | undefined;
    }>;
}
export {};

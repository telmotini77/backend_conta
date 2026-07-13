import { PrismaService } from '../prisma.service';
export declare class EmployeesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(ownerId: string): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }[]>;
    create(ownerId: string, dto: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }>;
    remove(id: string, ownerId: string): Promise<{
        success: boolean;
    }>;
}

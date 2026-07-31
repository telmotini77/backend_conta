import { PrismaService } from '../prisma.service';
export declare class CompaniesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        description: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: string;
        identification: string;
        dbName: string;
    }[]>;
    create(userId: string, data: {
        type: string;
        identification: string;
        name: string;
        description: string;
    }): Promise<{
        description: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: string;
        identification: string;
        dbName: string;
    }>;
    update(userId: string, id: string, data: {
        type: string;
        identification: string;
        name: string;
        description: string;
    }): Promise<{
        description: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: string;
        identification: string;
        dbName: string;
    }>;
    remove(userId: string, id: string): Promise<{
        description: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: string;
        identification: string;
        dbName: string;
    }>;
}

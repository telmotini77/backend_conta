import { CompaniesService } from './companies.service';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    findAll(req: RequestWithUser): Promise<{
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
    create(req: RequestWithUser, dto: {
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
    update(req: RequestWithUser, id: string, dto: {
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
    remove(req: RequestWithUser, id: string): Promise<{
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
export {};

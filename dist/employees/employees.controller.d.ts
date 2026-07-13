import { EmployeesService } from './employees.service';
interface RequestWithUser {
    user: {
        id: string;
        email: string;
        name: string;
        ruc: string;
    };
}
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    findAll(req: RequestWithUser): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }[]>;
    create(req: RequestWithUser, dto: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }>;
    remove(id: string, req: RequestWithUser): Promise<{
        success: boolean;
    }>;
}
export {};

import { CategoriesService } from './categories.service';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(req: RequestWithUser): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    create(req: RequestWithUser, name: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
export {};

import { ProductsService } from './products.service';
import { CreateProductDto, CreateTransactionDto } from './dto/products.dto';
interface RequestWithUser {
    user: {
        id: string;
    };
}
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(req: RequestWithUser): Promise<({
        transactions: {
            id: string;
            productId: string;
            type: import("@prisma/client").$Enums.TransactionType;
            quantity: number;
            unitCost: number;
            totalCost: number;
            balanceStock: number;
            date: Date;
        }[];
    } & {
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    })[]>;
    create(req: RequestWithUser, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    }>;
    createTransaction(req: RequestWithUser, dto: CreateTransactionDto): Promise<{
        id: string;
        productId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        quantity: number;
        unitCost: number;
        totalCost: number;
        balanceStock: number;
        date: Date;
    }>;
    toggleIva(req: RequestWithUser, id: string): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        cost: number;
        price: number;
        hasIva: boolean;
        userId: string;
    }>;
}
export {};

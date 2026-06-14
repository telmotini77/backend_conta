import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    private localClient;
    private renderClient;
    constructor();
    onModuleInit(): Promise<void>;
}

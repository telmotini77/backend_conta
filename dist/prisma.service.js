"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
function createDualClientProxy(local, render) {
    return new Proxy(local, {
        get(target, prop, receiver) {
            const localProp = target[prop];
            if (typeof prop === 'string' &&
                !prop.startsWith('$') &&
                typeof localProp === 'object' &&
                localProp !== null) {
                return new Proxy(localProp, {
                    get(modelTarget, modelProp) {
                        const originalMethod = modelTarget[modelProp];
                        if (typeof originalMethod === 'function') {
                            const writeOps = [
                                'create',
                                'update',
                                'delete',
                                'createMany',
                                'updateMany',
                                'deleteMany',
                                'upsert',
                            ];
                            if (typeof modelProp === 'string' && writeOps.includes(modelProp)) {
                                return async (...args) => {
                                    console.log(`[Dual DB Write] Executing: ${prop}.${modelProp}`);
                                    if (args[0] && typeof args[0] === 'object') {
                                        if (modelProp === 'create') {
                                            if (args[0].data && typeof args[0].data === 'object' && !args[0].data.id) {
                                                args[0].data.id = (0, crypto_1.randomUUID)();
                                            }
                                        }
                                        else if (modelProp === 'createMany') {
                                            if (Array.isArray(args[0].data)) {
                                                args[0].data = args[0].data.map((item) => {
                                                    if (item && typeof item === 'object' && !item.id) {
                                                        return { ...item, id: (0, crypto_1.randomUUID)() };
                                                    }
                                                    return item;
                                                });
                                            }
                                        }
                                        else if (modelProp === 'upsert') {
                                            if (args[0].create && typeof args[0].create === 'object' && !args[0].create.id) {
                                                args[0].create.id = (0, crypto_1.randomUUID)();
                                            }
                                        }
                                    }
                                    const renderProp = render[prop];
                                    const renderMethod = renderProp ? renderProp[modelProp] : null;
                                    if (!renderMethod) {
                                        return originalMethod.apply(modelTarget, args);
                                    }
                                    const [localResult] = await Promise.all([
                                        originalMethod.apply(modelTarget, args),
                                        renderMethod.apply(renderProp, args),
                                    ]);
                                    return localResult;
                                };
                            }
                        }
                        return typeof originalMethod === 'function'
                            ? originalMethod.bind(modelTarget)
                            : originalMethod;
                    },
                });
            }
            if (typeof prop === 'string' && prop.startsWith('$')) {
                if (prop === '$connect') {
                    return async () => {
                        console.log('[Dual DB] Connecting to Local and Render databases...');
                        await Promise.all([local.$connect(), render.$connect()]);
                    };
                }
                if (prop === '$disconnect') {
                    return async () => {
                        console.log('[Dual DB] Disconnecting from Local and Render databases...');
                        await Promise.all([local.$disconnect(), render.$disconnect()]);
                    };
                }
                if (prop === '$executeRaw' ||
                    prop === '$queryRaw' ||
                    prop === '$executeRawUnsafe' ||
                    prop === '$queryRawUnsafe') {
                    const isWriteRaw = prop.includes('executeRaw');
                    if (isWriteRaw) {
                        return async (...args) => {
                            console.log(`[Dual DB Write Raw] Executing ${prop} on both databases`);
                            const [localResult] = await Promise.all([
                                local[prop].apply(local, args),
                                render[prop].apply(render, args),
                            ]);
                            return localResult;
                        };
                    }
                    else {
                        return local[prop].bind(local);
                    }
                }
                if (prop === '$transaction') {
                    return async (arg, options) => {
                        if (typeof arg === 'function') {
                            console.log('[Dual DB] Running interactive transaction on both databases');
                            return await local.$transaction(async (localTx) => {
                                return await render.$transaction(async (renderTx) => {
                                    const proxiedTx = createDualClientProxy(localTx, renderTx);
                                    return await arg(proxiedTx);
                                }, options);
                            }, options);
                        }
                        else if (Array.isArray(arg)) {
                            console.log('[Dual DB] Sequential transaction requested, executing fallback to local transaction');
                            return await local.$transaction(arg, options);
                        }
                    };
                }
            }
            const val = target[prop];
            return typeof val === 'function' ? val.bind(target) : val;
        },
    });
}
let PrismaService = class PrismaService extends client_1.PrismaClient {
    localClient;
    renderClient;
    constructor() {
        super();
        this.localClient = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        this.renderClient = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.RENDER_DATABASE_URL,
                },
            },
        });
        return createDualClientProxy(this.localClient, this.renderClient);
    }
    async onModuleInit() {
        await this.$connect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map
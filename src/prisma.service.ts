import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

function createDualClientProxy(local: PrismaClient, render: PrismaClient): any {
  return new Proxy(local, {
    get(target, prop, receiver) {
      // If it's a model delegate (e.g. user, product, invoice, purchase, journalEntry, etc.)
      const localProp = target[prop as keyof PrismaClient];
      if (
        typeof prop === 'string' &&
        !prop.startsWith('$') &&
        typeof localProp === 'object' &&
        localProp !== null
      ) {
        return new Proxy(localProp, {
          get(modelTarget: any, modelProp) {
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
                return async (...args: any[]) => {
                  console.log(
                    `[Dual DB Write] Executing: ${prop}.${modelProp}`,
                  );

                  // ID Generation Safeguard: Ensure client-side generated UUIDs match across both databases
                  if (args[0] && typeof args[0] === 'object') {
                    if (modelProp === 'create') {
                      if (args[0].data && typeof args[0].data === 'object' && !args[0].data.id) {
                        args[0].data.id = randomUUID();
                      }
                    } else if (modelProp === 'createMany') {
                      if (Array.isArray(args[0].data)) {
                        args[0].data = args[0].data.map((item: any) => {
                          if (item && typeof item === 'object' && !item.id) {
                            return { ...item, id: randomUUID() };
                          }
                          return item;
                        });
                      }
                    } else if (modelProp === 'upsert') {
                      if (args[0].create && typeof args[0].create === 'object' && !args[0].create.id) {
                        args[0].create.id = randomUUID();
                      }
                    }
                  }

                  const renderProp = (render as any)[prop];
                  const renderMethod = renderProp ? renderProp[modelProp] : null;

                  if (!renderMethod) {
                    return originalMethod.apply(modelTarget, args);
                  }

                  // Optimize response times: Execute local write first and return immediately.
                  // Sync Render database in the background asynchronously.
                  const localPromise = originalMethod.apply(modelTarget, args);
                  
                  localPromise.then((localResult: any) => {
                    renderMethod.apply(renderProp, args).catch((err: any) => {
                      console.error(`[Dual DB Background Sync Error] failed for ${prop}.${modelProp}:`, err);
                    });
                  }).catch((err: any) => {
                    console.error(`[Dual DB Local Write Error] failed for ${prop}.${modelProp}:`, err);
                  });

                  return await localPromise;
                };
              }
            }
            // Bind read/other methods to local target
            return typeof originalMethod === 'function'
              ? originalMethod.bind(modelTarget)
              : originalMethod;
          },
        });
      }

      // Handle raw queries and Prisma hooks ($connect, $disconnect, $transaction, $queryRaw, $executeRaw)
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
        if (
          prop === '$executeRaw' ||
          prop === '$queryRaw' ||
          prop === '$executeRawUnsafe' ||
          prop === '$queryRawUnsafe'
        ) {
          const isWriteRaw = prop.includes('executeRaw');
          if (isWriteRaw) {
            return async (...args: any[]) => {
              console.log(`[Dual DB Write Raw] Executing ${prop} on local and in background on Render`);
              const localPromise = (local as any)[prop].apply(local, args);
              localPromise.then(() => {
                (render as any)[prop].apply(render, args).catch((err: any) => {
                  console.error(`[Dual DB Background Raw Write Error] failed for ${prop}:`, err);
                });
              }).catch(() => {});
              return await localPromise;
            };
          } else {
            return (local as any)[prop].bind(local);
          }
        }
        if (prop === '$transaction') {
          return async (arg: any, options?: any) => {
            if (typeof arg === 'function') {
              console.log('[Dual DB] Running interactive transaction on both databases');
              return await local.$transaction(async (localTx) => {
                return await render.$transaction(async (renderTx) => {
                  const proxiedTx = createDualClientProxy(localTx as any, renderTx as any);
                  return await arg(proxiedTx);
                }, options);
              }, options);
            } else if (Array.isArray(arg)) {
              console.log('[Dual DB] Sequential transaction requested, executing fallback to local transaction');
              return await local.$transaction(arg, options);
            }
          };
        }
      }

      // Default property fallback
      const val = target[prop as keyof PrismaClient];
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private localClient: PrismaClient;
  private renderClient: PrismaClient;

  constructor() {
    // Call super() to satisfy the class structure, using default process.env.DATABASE_URL
    super();

    this.localClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    const renderDbUrl = process.env.RENDER_DATABASE_URL;
    if (renderDbUrl) {
      this.renderClient = new PrismaClient({
        datasources: {
          db: {
            url: renderDbUrl,
          },
        },
      });
      // Return the Proxy wrapper around this instance for dual database writing
      return createDualClientProxy(this.localClient, this.renderClient);
    }

    // Single database mode (e.g. running in Render or local dev without double writing)
    return this.localClient as any;
  }

  async onModuleInit() {
    await (this as any).$connect();
  }
}


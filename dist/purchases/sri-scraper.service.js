"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SriScraperService = void 0;
const common_1 = require("@nestjs/common");
let SriScraperService = class SriScraperService {
    async scrapePurchases(userRuc) {
        console.log(`Iniciando scrape de compras para el RUC: ${userRuc}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
        const today = new Date();
        return [
            {
                invoiceNum: `001-002-${Math.floor(Math.random() * 900000) + 100000}`,
                claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117921445670012001002000${Math.floor(Math.random() * 900000) + 100000}123456781`,
                providerRuc: '1792144567001',
                providerName: 'TELCONET S.A. (Conectividad Internet)',
                amount: 89.6,
                date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            },
            {
                invoiceNum: `005-001-${Math.floor(Math.random() * 900000) + 100000}`,
                claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117900123450012005001000${Math.floor(Math.random() * 900000) + 100000}876543211`,
                providerRuc: '1790012345001',
                providerName: 'CORPORACION FAVORITA S.A. (Consumos y Limpieza)',
                amount: 145.2,
                date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                invoiceNum: `002-003-${Math.floor(Math.random() * 900000) + 100000}`,
                claveAcceso: `${today.toISOString().slice(0, 10).replace(/-/g, '')}0117912345670012002003000${Math.floor(Math.random() * 900000) + 100000}112233441`,
                providerRuc: '1791234567001',
                providerName: 'DISTRIBUIDORA TECNOLOGICA DEL ECUADOR',
                amount: 1350.0,
                date: new Date(today.getTime() - 12 * 60 * 60 * 1000),
                items: [
                    { sku: 'COMP-001', quantity: 3, unitCost: 450.0 },
                ],
            },
        ];
    }
};
exports.SriScraperService = SriScraperService;
exports.SriScraperService = SriScraperService = __decorate([
    (0, common_1.Injectable)()
], SriScraperService);
//# sourceMappingURL=sri-scraper.service.js.map
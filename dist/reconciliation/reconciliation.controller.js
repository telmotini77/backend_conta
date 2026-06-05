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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationController = void 0;
const common_1 = require("@nestjs/common");
const reconciliation_service_1 = require("./reconciliation.service");
const reconciliation_dto_1 = require("./dto/reconciliation.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ReconciliationController = class ReconciliationController {
    reconciliationService;
    constructor(reconciliationService) {
        this.reconciliationService = reconciliationService;
    }
    async getSummary(req) {
        return this.reconciliationService.getSummary(req.user.id);
    }
    async createCashTransaction(req, dto) {
        return this.reconciliationService.createCashTransaction(req.user.id, dto);
    }
    async createWithholding(req, dto) {
        return this.reconciliationService.createWithholding(req.user.id, dto);
    }
    async matchWithholding(req, dto) {
        return this.reconciliationService.matchWithholding(req.user.id, dto);
    }
    async syncWithholdings(req) {
        return this.reconciliationService.syncWithholdings(req.user.id);
    }
};
exports.ReconciliationController = ReconciliationController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('cash-transactions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reconciliation_dto_1.CreateCashTransactionDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "createCashTransaction", null);
__decorate([
    (0, common_1.Post)('withholdings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reconciliation_dto_1.CreateWithholdingDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "createWithholding", null);
__decorate([
    (0, common_1.Post)('match'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reconciliation_dto_1.MatchWithholdingDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "matchWithholding", null);
__decorate([
    (0, common_1.Post)('sri-sync'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "syncWithholdings", null);
exports.ReconciliationController = ReconciliationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reconciliation'),
    __metadata("design:paramtypes", [reconciliation_service_1.ReconciliationService])
], ReconciliationController);
//# sourceMappingURL=reconciliation.controller.js.map
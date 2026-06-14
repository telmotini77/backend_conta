"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionDto = exports.CreateProductDto = void 0;
class CreateProductDto {
    sku;
    name;
    cost;
    price;
    stock;
    hasIva;
}
exports.CreateProductDto = CreateProductDto;
class CreateTransactionDto {
    productId;
    type;
    quantity;
}
exports.CreateTransactionDto = CreateTransactionDto;
//# sourceMappingURL=products.dto.js.map
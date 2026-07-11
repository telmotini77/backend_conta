"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDto = exports.CreateTransactionDto = exports.CreateProductDto = void 0;
class CreateProductDto {
    sku;
    name;
    cost;
    price;
    stock;
    hasIva;
    categoryId;
}
exports.CreateProductDto = CreateProductDto;
class CreateTransactionDto {
    productId;
    type;
    quantity;
}
exports.CreateTransactionDto = CreateTransactionDto;
class UpdateProductDto {
    price;
    categoryId;
    addedStock;
}
exports.UpdateProductDto = UpdateProductDto;
//# sourceMappingURL=products.dto.js.map
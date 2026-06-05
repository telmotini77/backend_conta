import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateTransactionDto } from './dto/products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    // Seed initial products if the user has no products yet
    await this.productsService.seedInitialProducts(userId);
    return this.productsService.findAll(userId);
  }

  @Post()
  async create(@Request() req: RequestWithUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.id, dto);
  }

  @Post('transaction')
  async createTransaction(
    @Request() req: RequestWithUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.productsService.createTransaction(
      req.user.id,
      dto.productId,
      dto.type,
      Number(dto.quantity),
    );
  }
}

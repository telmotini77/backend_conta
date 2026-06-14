import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchasesService, CreatePurchaseDto } from './purchases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.purchasesService.findAll(req.user.id);
  }

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(req.user.id, dto);
  }

  @Post('sync')
  async sync(@Request() req: RequestWithUser) {
    return this.purchasesService.syncPurchases(req.user.id);
  }
}

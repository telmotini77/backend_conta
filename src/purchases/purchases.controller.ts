import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
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

  @Post('sync')
  async sync(@Request() req: RequestWithUser) {
    return this.purchasesService.syncPurchases(req.user.id);
  }
}

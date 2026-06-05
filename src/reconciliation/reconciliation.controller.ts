import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import {
  CreateCashTransactionDto,
  CreateWithholdingDto,
  MatchWithholdingDto,
} from './dto/reconciliation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('summary')
  async getSummary(@Request() req: RequestWithUser) {
    return this.reconciliationService.getSummary(req.user.id);
  }

  @Post('cash-transactions')
  async createCashTransaction(
    @Request() req: RequestWithUser,
    @Body() dto: CreateCashTransactionDto,
  ) {
    return this.reconciliationService.createCashTransaction(req.user.id, dto);
  }

  @Post('withholdings')
  async createWithholding(
    @Request() req: RequestWithUser,
    @Body() dto: CreateWithholdingDto,
  ) {
    return this.reconciliationService.createWithholding(req.user.id, dto);
  }

  @Post('match')
  async matchWithholding(
    @Request() req: RequestWithUser,
    @Body() dto: MatchWithholdingDto,
  ) {
    return this.reconciliationService.matchWithholding(req.user.id, dto);
  }

  @Post('sri-sync')
  async syncWithholdings(@Request() req: RequestWithUser) {
    return this.reconciliationService.syncWithholdings(req.user.id);
  }
}

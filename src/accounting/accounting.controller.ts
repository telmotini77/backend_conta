import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountingService, EntryLineInput } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

class CreateManualEntryDto {
  description: string;
  date?: string;
  lines: EntryLineInput[];
}

@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('entries')
  async findAll(@Request() req: RequestWithUser) {
    return this.accountingService.findAll(req.user.id);
  }

  @Get('trial-balance')
  async getTrialBalance(@Request() req: RequestWithUser) {
    return this.accountingService.getTrialBalance(req.user.id);
  }

  @Post('entries')
  async createManual(
    @Request() req: RequestWithUser,
    @Body() dto: CreateManualEntryDto,
  ) {
    return this.accountingService.createManual(req.user.id, dto);
  }
}

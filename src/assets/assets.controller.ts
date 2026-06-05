import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/assets.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.assetsService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req: RequestWithUser, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(req.user.id, dto);
  }

  @Get('depreciations')
  async getDepreciations(@Request() req: RequestWithUser) {
    return this.assetsService.getDepreciations(req.user.id);
  }

  @Post('depreciate')
  async depreciate(
    @Request() req: RequestWithUser,
    @Body() body: { period?: string },
  ) {
    const period = body.period || new Date().toISOString().slice(0, 7);
    return this.assetsService.generateMonthlyDepreciations(req.user.id, period);
  }
}

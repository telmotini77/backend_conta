import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.companiesService.findAll(req.user.id);
  }

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body()
    dto: {
      type: string;
      identification: string;
      name: string;
      description: string;
    },
  ) {
    return this.companiesService.create(req.user.id, dto);
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    dto: {
      type: string;
      identification: string;
      name: string;
      description: string;
    },
  ) {
    return this.companiesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.companiesService.remove(req.user.id, id);
  }
}

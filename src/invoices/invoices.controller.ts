import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/invoices.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.invoicesService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req: RequestWithUser, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.id, dto);
  }

  @Post(':id/send')
  async send(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.invoicesService.sendInvoiceToClient(req.user.id, id);
  }

  @Get(':id/xml')
  async getXml(@Request() req: RequestWithUser, @Param('id') id: string) {
    const xml = await this.invoicesService.getInvoiceXml(req.user.id, id);
    return { xml };
  }
}

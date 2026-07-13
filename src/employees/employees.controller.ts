import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: { id: string; email: string; name: string; ruc: string };
}

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.employeesService.findAll(req.user.id);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() dto: { name: string; email: string; password: string },
  ) {
    return this.employeesService.create(req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.employeesService.remove(id, req.user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req: RequestWithUser, @Body('name') name: string) {
    return this.categoriesService.create(req.user.id, name);
  }
}

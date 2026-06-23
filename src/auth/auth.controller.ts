import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    name: string;
    ruc: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/sri-config')
  async getSriConfig(@Request() req: RequestWithUser) {
    return this.authService.getSriConfig(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/sri-config')
  async updateSriConfig(
    @Request() req: RequestWithUser,
    @Body()
    dto: {
      sriSimulate: boolean;
      sriEnvironment: string;
      signatureBase64?: string;
      signaturePassword?: string;
    },
  ) {
    return this.authService.updateSriConfig(req.user.id, dto);
  }
}

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // 1. Validate if user exists (email or ruc)
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException(
        'El correo electrónico ya está registrado.',
      );
    }

    const existingRuc = await this.prisma.user.findUnique({
      where: { ruc: dto.ruc },
    });
    if (existingRuc) {
      throw new BadRequestException('El RUC ya está registrado.');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        ruc: dto.ruc,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      ruc: user.ruc,
      createdAt: user.createdAt,
    };
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // 3. Sign token
    const payload = { email: user.email, sub: user.id };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        ruc: user.ruc,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getSriConfig(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return {
      sriSimulate: user.sriSimulate,
      sriEnvironment: user.sriEnvironment,
      hasSignature: !!user.signatureBase64,
      signaturePasswordLength: user.signaturePassword ? user.signaturePassword.length : 0,
    };
  }

  async getSriConfigInternal(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return {
      signatureBase64: user.signatureBase64,
      signaturePassword: user.signaturePassword,
    };
  }

  async updateSriConfig(
    userId: string,
    dto: {
      sriSimulate: boolean;
      sriEnvironment: string;
      signatureBase64?: string;
      signaturePassword?: string;
    },
  ) {
    const updateData: any = {
      sriSimulate: dto.sriSimulate,
      sriEnvironment: dto.sriEnvironment,
    };

    if (dto.signatureBase64 !== undefined) {
      updateData.signatureBase64 = dto.signatureBase64 || null;
    }
    if (dto.signaturePassword !== undefined) {
      updateData.signaturePassword = dto.signaturePassword || null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      sriSimulate: user.sriSimulate,
      sriEnvironment: user.sriEnvironment,
      hasSignature: !!user.signatureBase64,
    };
  }
}

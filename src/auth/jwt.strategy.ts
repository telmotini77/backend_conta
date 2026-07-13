import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'super-secret-jwt-key-2026-aura-contable',
    });
  }

  async validate(payload: { sub: string; email: string; role?: string; ownerId?: string }) {
    const targetId = payload.ownerId || payload.sub;
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      ruc: user.ruc,
      isEmployee: payload.role === 'employee',
      employeeId: payload.role === 'employee' ? payload.sub : undefined,
    };
  }
}

// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  private signAccessToken(user: { id: string; email: string; role: string }) {
    return this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET!, expiresIn: '15m' },
    );
  }

  async signup(
    dto: { email: string; password: string; name?: string },
    meta?: { userAgent?: string; ip?: string },
  ) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const accessToken = this.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const rt = await this.refreshTokens.issue({
      userId: user.id,
      ttlDays: 14,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    });

    return { user, accessToken, refreshToken: rt.raw };
  }

  async login(
    dto: { email: string; password: string },
    meta?: { userAgent?: string; ip?: string },
  ) {
    const userRow = await this.users.findByEmail(dto.email);
    if (!userRow?.passwordHash)
      throw new UnauthorizedException('INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(dto.password, userRow.passwordHash);
    if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const accessToken = this.signAccessToken({
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
    });

    const rt = await this.refreshTokens.issue({
      userId: userRow.id,
      ttlDays: 14,
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
    });

    const user = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      name: userRow.name,
      createdAt: userRow.createdAt,
    };
    return { user, accessToken, refreshToken: rt.raw };
  }

  async refresh(refreshTokenRaw?: string) {
    if (!refreshTokenRaw)
      throw new UnauthorizedException('MISSING_REFRESH_TOKEN');

    // rotation TODO: 현재는 validate만
    const userId = await this.refreshTokens.validate(refreshTokenRaw);
    if (!userId) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');

    const userRow = await this.users.findById(userId);
    if (!userRow) throw new UnauthorizedException('USER_NOT_FOUND');

    const accessToken = this.signAccessToken({
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
    });
    const user = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      name: userRow.name,
      createdAt: userRow.createdAt,
    };

    return { user, accessToken, refreshToken: refreshTokenRaw };
  }

  async logout(refreshTokenRaw?: string) {
    if (refreshTokenRaw) await this.refreshTokens.revoke(refreshTokenRaw);
  }
}

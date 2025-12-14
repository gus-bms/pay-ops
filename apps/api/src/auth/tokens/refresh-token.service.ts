import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async issue(params: {
    userId: string;
    ttlDays: number;
    userAgent?: string | null;
    ip?: string | null;
  }) {
    const raw = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hash(raw);
    const expiresAt = new Date(
      Date.now() + params.ttlDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash,
        expiresAt,
        userAgent: params.userAgent ?? null,
        ip: params.ip ?? null,
      },
    });

    return { raw, expiresAt };
  }

  // ✅ 추가: rotation 없이 MVP용 유효성 검사
  async validate(refreshTokenRaw: string): Promise<string | null> {
    const tokenHash = this.hash(refreshTokenRaw);

    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true, revokedAt: true },
    });

    if (!row) return null;
    if (row.revokedAt) return null;
    if (row.expiresAt.getTime() <= Date.now()) return null;

    return row.userId;
  }

  async revoke(refreshTokenRaw: string) {
    const tokenHash = this.hash(refreshTokenRaw);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
  }

  /**
   * TODO: Rotation 구현 예정
   * - rotate(refreshTokenRaw) => 새 토큰 발급 + 기존 토큰 revoke + replacedByTokenId 연결
   * - race condition 방어(updateMany 조건부)
   */
}

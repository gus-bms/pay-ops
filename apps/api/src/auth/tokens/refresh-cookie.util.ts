// src/auth/tokens/refresh-cookie.util.ts
import { Response } from 'express';

export function setRefreshCookie(res: Response, token: string) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 1000 * 60 * 60 * 24 * 14, // 예: 14일
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/auth/refresh',
  });
}

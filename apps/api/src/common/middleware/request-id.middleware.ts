import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = 'x-request-id';
    const requestId = (req.headers[headerName] as string) ?? randomUUID();

    // request scope에 저장(추후 로깅/DB 기록에도 사용 가능)
    (req as any).requestId = requestId;

    // 응답 헤더에도 세팅
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();

    return next.handle().pipe(
      map((data) => ({
        requestId: (req as any).requestId ?? null,
        success: true,
        code: 'OK',
        message: null,
        data,
        error: null,
      })),
    );
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    // 기본 payload
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let type = 'INTERNAL_ERROR';
    let details: any[] = [];

    if (exception instanceof UnauthorizedException) {
      console.log('[ERROR] auth error', exception);
      status = HttpStatus.UNAUTHORIZED;
      code = 'AUTH_ERROR';
      type = 'AUTH_ERROR';
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const response = exception.getResponse() as any;

      // DomainException에서 넘긴 형태를 우선 수용
      if (response && typeof response === 'object') {
        code = response.code ?? code;
        message = response.message ?? message;
        type = response.type ?? type;
        details = Array.isArray(response.details) ? response.details : details;
      } else {
        message = String(response);
      }
    } else if (exception?.name === 'PrismaClientKnownRequestError') {
      // Prisma 에러 매핑(필요한 것부터 점진적으로 추가)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'DB_ERROR';
      message = 'Database error';
      type = 'INTERNAL_ERROR';
      details = [{ prismaCode: exception.code }];
    }

    // 운영서비스 권장: 캐시 금지
    res.setHeader('Cache-Control', 'no-store');

    res.status(status).json({
      requestId: (req as any).requestId ?? null,
      success: false,
      code,
      message,
      data: null,
      error: {
        type,
        details,
      },
    });
  }
}

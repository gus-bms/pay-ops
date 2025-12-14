import { HttpException, HttpStatus } from '@nestjs/common';

export type DomainErrorType =
  | 'VALIDATION_ERROR'
  | 'RISK_ERROR'
  | 'DEPENDENCY_ERROR'
  | 'INTERNAL_ERROR';

export class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly type: DomainErrorType,
    public readonly details: any[] = [],
    status: number = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super({ code, message, type, details }, status);
  }
}

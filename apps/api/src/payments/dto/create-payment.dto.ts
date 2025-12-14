import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Plan ID (서버가 가격을 산정)' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({
    description:
      '클라이언트가 계산한 금액(원). 변조 탐지를 위해 선택적으로 전달',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  clientAmount?: number;

  @ApiPropertyOptional({
    description:
      'Idempotency-Key (헤더가 원칙이지만 MVP에서는 바디도 허용 가능)',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

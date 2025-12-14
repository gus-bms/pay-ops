import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, RejectReason, RiskDecision } from '@prisma/client';
import { DomainException } from 'src/common/errors/domain.exception';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    // plan 미존재 → 차단(거절)
    if (!plan) {
      const payment = await this.prisma.payment.create({
        data: {
          requestedPlanId: dto.planId,
          amount: 0,
          currency: 'KRW',
          status: PaymentStatus.REJECTED,
          riskDecision: RiskDecision.BLOCK,
          rejectReason: RejectReason.PLAN_NOT_FOUND,
          idempotencyKey: dto.idempotencyKey ?? null,
        },
      });

      throw new DomainException(
        'PAYMENT_PLAN_NOT_FOUND',
        'Plan not found',
        'VALIDATION_ERROR',
        [{ field: 'planId', reason: 'NOT_FOUND', paymentId: payment.id }],
        422,
      );
    }

    // 비활성 plan → 차단
    if (!plan.isActive) {
      const payment = await this.prisma.payment.create({
        data: {
          requestedPlanId: plan.id,
          planId: plan.id,
          amount: plan.amount,
          currency: plan.currency,
          status: PaymentStatus.REJECTED,
          riskDecision: RiskDecision.BLOCK,
          rejectReason: RejectReason.PLAN_INACTIVE,
          idempotencyKey: dto.idempotencyKey ?? null,
        },
      });

      throw new DomainException(
        'PAYMENT_NOT_ACTIVATED',
        'payment is not activated',
        'VALIDATION_ERROR',
        [{ field: 'activate', reason: 'DEACTIVATE', paymentId: payment.id }],
        422,
      );
    }

    // 금액 변조 탐지: clientAmount가 왔는데 plan.amount와 불일치 → 차단
    if (dto.clientAmount !== undefined && dto.clientAmount !== plan.amount) {
      const payment = await this.prisma.payment.create({
        data: {
          requestedPlanId: plan.id,
          planId: plan.id,
          amount: plan.amount, // 서버 산정금액 기록
          currency: plan.currency,
          status: PaymentStatus.REJECTED,
          riskDecision: RiskDecision.BLOCK,
          rejectReason: RejectReason.AMOUNT_NOT_ALLOWED,
          idempotencyKey: dto.idempotencyKey ?? null,
        },
      });

      throw new DomainException(
        'PAYMENT_AMOUNT_NOT_ALLOWED',
        'Client amount does not match server price table',
        'VALIDATION_ERROR',
        [{ field: 'clientAmount', reason: 'MISMATCH', paymentId: payment.id }],
        422,
      );
    }

    // 정상 접수(다음 단계에서 Risk/Hold/PG로 이어짐)
    return this.prisma.payment.create({
      data: {
        requestedPlanId: plan.id,
        planId: plan.id,
        amount: plan.amount,
        currency: plan.currency,
        status: PaymentStatus.CREATED,
        riskDecision: RiskDecision.ALLOW,
        idempotencyKey: dto.idempotencyKey ?? null,
      },
    });
  }

  async list(params: { status?: string; limit: number }) {
    const { status, limit } = params;

    return this.prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        plan: true,
      },
    });
  }
}

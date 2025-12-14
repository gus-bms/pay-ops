import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'PaymentStatus filter',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'default 20' })
  list(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.paymentsService.list({
      status,
      limit: limit ? Number(limit) : 20,
    });
  }
}
